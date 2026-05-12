import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  createSession,
  deleteSession,
  getSessionById,
  getSessionsByUser,
  updateSession,
} from "./db";
import { getRecentMeetings, searchMeetings, getTranscriptText } from "./fireflies";

// ─── AI Prompt & Schema ────────────────────────────────────────────────────────

const AI_SYSTEM_PROMPT = `You are an executive intelligence assistant. A professional has given you two inputs from a meeting. The TRANSCRIPT is what was said aloud. The PERSONAL NOTES are their private thoughts and reactions — treat these as equally important as the transcript. Synthesize both into a structured intelligence report. Return ONLY valid JSON matching the required schema.`;

const AI_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "2-3 sentence executive summary synthesizing both inputs" },
    keyDecisions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          decision: { type: "string" },
          context: { type: "string" },
        },
        required: ["decision", "context"],
        additionalProperties: false,
      },
    },
    actionItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          task: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          context: { type: "string" },
          owner: { type: "string" },
        },
        required: ["task", "priority", "context", "owner"],
        additionalProperties: false,
      },
    },
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          insight: { type: "string" },
          source: { type: "string", enum: ["transcript", "notes", "synthesis"] },
        },
        required: ["insight", "source"],
        additionalProperties: false,
      },
    },
    watchItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          type: { type: "string", enum: ["risk", "open-question", "tension", "dependency"] },
        },
        required: ["item", "type"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "keyDecisions", "actionItems", "insights", "watchItems"],
  additionalProperties: false,
};


export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Fireflies ─────────────────────────────────────────────────────────────
  fireflies: router({
    /** List the 10 most recent meetings. */
    recent: protectedProcedure.query(async () => {
      try {
        const meetings = await getRecentMeetings(10);
        return meetings.map((m) => ({
          id: m.id,
          title: m.title ?? "Untitled Meeting",
          date: m.date ?? null,
        }));
      } catch (err) {
        console.error("[Fireflies] recent error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recent Fireflies meetings",
        });
      }
    }),

    /** Search meetings by keyword in the title. */
    search: protectedProcedure
      .input(z.object({ keyword: z.string().min(1) }))
      .query(async ({ input }) => {
        try {
          const meetings = await searchMeetings(input.keyword, 10);
          return meetings.map((m) => ({
            id: m.id,
            title: m.title ?? "Untitled Meeting",
            date: m.date ?? null,
          }));
        } catch (err) {
          console.error("[Fireflies] search error:", err);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to search Fireflies meetings",
          });
        }
      }),

    /** Fetch the full transcript text for a given meeting ID. */
    getTranscript: protectedProcedure
      .input(z.object({ transcriptId: z.string() }))
      .query(async ({ input }) => {
        try {
          const { title, text } = await getTranscriptText(input.transcriptId);
          return { transcript: text, title };
        } catch (err) {
          console.error("[Fireflies] getTranscript error:", err);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch transcript from Fireflies",
          });
        }
      }),
  }),

  // ─── Sessions ───────────────────────────────────────────────────────────────
  sessions: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const rows = await getSessionsByUser(ctx.user.id, input.search);
        return rows.map((s) => ({
          ...s,
          parsedTags: (() => { try { return s.tags ? (JSON.parse(s.tags) as string[]) : []; } catch { return []; } })(),
        }));
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.id, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        return {
          ...session,
          parsedTags: (() => { try { return session.tags ? (JSON.parse(session.tags) as string[]) : []; } catch { return []; } })(),
        };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        transcript: z.string().optional(),
        personalNotes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createSession({
          userId: ctx.user.id,
          name: input.name,
          transcript: input.transcript ?? null,
          personalNotes: input.personalNotes ?? null,
          tags: input.tags && input.tags.length > 0 ? JSON.stringify(input.tags) : null,
          status: "draft",
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        transcript: z.string().optional(),
        personalNotes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, tags, ...rest } = input;
        const data: Record<string, unknown> = { ...rest };
        if (tags !== undefined) {
          data.tags = tags.length > 0 ? JSON.stringify(tags) : null;
        }
        await updateSession(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteSession(input.id, ctx.user.id);
        return { success: true };
      }),

    analyze: protectedProcedure
      .input(z.object({
        id: z.number(),
        transcript: z.string(),
        personalNotes: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.id, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });

        if (!input.transcript.trim() && !input.personalNotes.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please provide a transcript or personal notes before analyzing.",
          });
        }

        const userMessage = [
          input.transcript.trim() ? `TRANSCRIPT:\n${input.transcript.trim()}` : "TRANSCRIPT: (none provided)",
          input.personalNotes.trim() ? `PERSONAL NOTES:\n${input.personalNotes.trim()}` : "PERSONAL NOTES: (none provided)",
        ].join("\n\n");

        const response = await invokeLLM({
          messages: [
            { role: "system", content: AI_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "meeting_intelligence", strict: true, schema: AI_SCHEMA },
          },
        });

        const rawContent = String(response.choices[0]?.message?.content ?? "{}");

        await updateSession(input.id, ctx.user.id, {
          transcript: input.transcript,
          personalNotes: input.personalNotes,
          aiOutput: rawContent,
          status: "analyzed",
        });

        return { aiOutput: JSON.parse(rawContent) };
      }),
  }),
});

export type AppRouter = typeof appRouter;
