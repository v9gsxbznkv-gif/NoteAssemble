import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  clearUserIntegrationKey,
  countSessionsThisMonth,
  createSession,
  deleteSession,
  getOpenActionItems,
  getSessionById,
  getSessionByShareToken,
  getSessionsByUser,
  getUserBilling,
  getUserIntegrationKeys,
  setActionItemDueDate,
  setUserIntegrationKey,
  toggleActionItem,
  updateSession,
  upsertActionItemsForSession,
} from "./db";
import { getRecentMeetings, searchMeetings, getTranscriptText } from "./fireflies";
import { notifyOwner } from "./_core/notification";
import { stripe, ensureProducts, PLANS, type PlanId } from "./stripe";
import { updateUserBilling, getUserByStripeCustomerId } from "./db";

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

  // ─── Integrations (per-user API keys) ────────────────────────────────────────
  integrations: router({
    /** Get the user's connected integration keys (masked for display). */
    getKeys: protectedProcedure.query(async ({ ctx }) => {
      const keys = await getUserIntegrationKeys(ctx.user.id);
      // Mask keys: show last 4 chars only
      const mask = (k: string | null) => k ? `${'•'.repeat(Math.max(0, k.length - 4))}${k.slice(-4)}` : null;
      return {
        fireflies: { connected: !!keys.firefliesApiKey, masked: mask(keys.firefliesApiKey) },
        notion: { connected: !!keys.notionApiKey, masked: mask(keys.notionApiKey) },
        otter: { connected: !!keys.otterApiKey, masked: mask(keys.otterApiKey) },
        granola: { connected: !!keys.granolaApiKey, masked: mask(keys.granolaApiKey) },
        zoom: { connected: !!keys.zoomApiKey, masked: mask(keys.zoomApiKey) },
        teams: { connected: !!keys.teamsApiKey, masked: mask(keys.teamsApiKey) },
      };
    }),

    /** Save an integration API key for the current user. */
    setKey: protectedProcedure
      .input(z.object({
        service: z.enum(['fireflies', 'notion', 'otter', 'granola', 'zoom', 'teams']),
        apiKey: z.string().min(1).max(255),
      }))
      .mutation(async ({ ctx, input }) => {
        const fieldMap = { fireflies: 'firefliesApiKey', notion: 'notionApiKey', otter: 'otterApiKey', granola: 'granolaApiKey', zoom: 'zoomApiKey', teams: 'teamsApiKey' } as const;
        await setUserIntegrationKey(ctx.user.id, fieldMap[input.service], input.apiKey);
        return { success: true };
      }),

    /** Remove an integration API key for the current user. */
    clearKey: protectedProcedure
      .input(z.object({ service: z.enum(['fireflies', 'notion', 'otter', 'granola', 'zoom', 'teams']) }))
      .mutation(async ({ ctx, input }) => {
        const fieldMap = { fireflies: 'firefliesApiKey', notion: 'notionApiKey', otter: 'otterApiKey', granola: 'granolaApiKey', zoom: 'zoomApiKey', teams: 'teamsApiKey' } as const;
        await clearUserIntegrationKey(ctx.user.id, fieldMap[input.service]);
        return { success: true };
      }),
  }),

  // ─── Notion Import ────────────────────────────────────────────────────────────
  notion: router({
    /** Fetch a Notion page's content by URL or page ID using the user's integration token. */
    importPage: protectedProcedure
      .input(z.object({ pageUrl: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const keys = await getUserIntegrationKeys(ctx.user.id);
        if (!keys.notionApiKey) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Connect your Notion account in Settings → Integrations first.',
          });
        }
        // Extract page ID from URL (e.g. https://notion.so/My-Page-abc123def456)
        const match = input.pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i) ||
                      input.pageUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (!match) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Could not extract a page ID from that Notion URL. Copy the URL directly from your browser.' });
        }
        const pageId = match[1].replace(/-/g, '');
        // Fetch page blocks from Notion API
        const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
          headers: {
            'Authorization': `Bearer ${keys.notionApiKey}`,
            'Notion-Version': '2022-06-28',
          },
        });
        if (!blocksRes.ok) {
          const err = await blocksRes.json().catch(() => ({})) as { message?: string };
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Notion API error: ${err.message ?? blocksRes.statusText}` });
        }
        const blocksData = await blocksRes.json() as { results: Array<{ type: string; [key: string]: unknown }> };
        // Convert blocks to plain text
        const lines: string[] = [];
        for (const block of blocksData.results) {
          const richText = (block[block.type] as { rich_text?: Array<{ plain_text: string }> })?.rich_text ?? [];
          const text = richText.map((t) => t.plain_text).join('');
          if (text.trim()) lines.push(text);
        }
        if (lines.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No readable text found in this Notion page.' });
        }
        return { text: lines.join('\n'), pageId };
      }),
  }),

  // ─── Granola Import ───────────────────────────────────────────────────────────
  granola: router({
    /** List recent Granola meeting notes using the user's personal API key. */
    listNotes: protectedProcedure.query(async ({ ctx }) => {
      const keys = await getUserIntegrationKeys(ctx.user.id);
      if (!keys.granolaApiKey) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Connect your Granola account in Settings → Integrations first.',
        });
      }
      const res = await fetch('https://public-api.granola.ai/v1/notes?limit=20', {
        headers: { 'Authorization': `Bearer ${keys.granolaApiKey}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Granola API error: ${err.message ?? res.statusText}` });
      }
      const data = await res.json() as { notes?: Array<{ id: string; title?: string; created_at?: string }> };
      return (data.notes ?? []).map((n) => ({ id: n.id, title: n.title ?? 'Untitled Meeting', date: n.created_at ?? null }));
    }),

    /** Fetch the full transcript/notes for a specific Granola note. */
    getNote: protectedProcedure
      .input(z.object({ noteId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        const keys = await getUserIntegrationKeys(ctx.user.id);
        if (!keys.granolaApiKey) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Connect your Granola account in Settings → Integrations first.' });
        }
        const res = await fetch(`https://public-api.granola.ai/v1/notes/${input.noteId}`, {
          headers: { 'Authorization': `Bearer ${keys.granolaApiKey}` },
        });
        if (!res.ok) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Granola note not found.' });
        }
        const data = await res.json() as { id: string; title?: string; transcript?: string; summary?: string; created_at?: string };
        return {
          id: data.id,
          title: data.title ?? 'Untitled Meeting',
          transcript: data.transcript ?? '',
          summary: data.summary ?? '',
          date: data.created_at ?? null,
        };
      }),
  }),

  // ─── Fireflies ─────────────────────────────────────────────────────────────
  fireflies: router({
    /** List the 10 most recent meetings using the user's own Fireflies key. */
    recent: protectedProcedure.query(async ({ ctx }) => {
      const keys = await getUserIntegrationKeys(ctx.user.id);
      if (!keys.firefliesApiKey) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Connect your Fireflies account in Settings → Integrations to import meetings.',
        });
      }
      try {
        const meetings = await getRecentMeetings(10, keys.firefliesApiKey);
        return meetings.map((m) => ({
          id: m.id,
          title: m.title ?? 'Untitled Meeting',
          date: m.date ?? null,
        }));
      } catch (err) {
        console.error('[Fireflies] recent error:', err);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch recent Fireflies meetings' });
      }
    }),

    /** Search meetings by keyword in the title. */
    search: protectedProcedure
      .input(z.object({ keyword: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        const keys = await getUserIntegrationKeys(ctx.user.id);
        if (!keys.firefliesApiKey) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Connect your Fireflies account in Settings → Integrations to import meetings.',
          });
        }
        try {
          const meetings = await searchMeetings(input.keyword, 10, keys.firefliesApiKey);
          return meetings.map((m) => ({
            id: m.id,
            title: m.title ?? 'Untitled Meeting',
            date: m.date ?? null,
          }));
        } catch (err) {
          console.error('[Fireflies] search error:', err);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to search Fireflies meetings' });
        }
      }),

    /** Fetch the full transcript text for a given meeting ID. */
    getTranscript: protectedProcedure
      .input(z.object({ transcriptId: z.string() }))
      .query(async ({ ctx, input }) => {
        const keys = await getUserIntegrationKeys(ctx.user.id);
        if (!keys.firefliesApiKey) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Connect your Fireflies account in Settings → Integrations to import meetings.',
          });
        }
        try {
          const { title, text } = await getTranscriptText(input.transcriptId, keys.firefliesApiKey);
          return { transcript: text, title };
        } catch (err) {
          console.error('[Fireflies] getTranscript error:', err);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch transcript from Fireflies' });
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

    /** Public read-only view via share token — no auth required. */
    getShared: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .query(async ({ input }) => {
        const session = await getSessionByShareToken(input.token);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Shared session not found or link has been revoked" });
        // Return only safe fields — no userId, no raw tags JSON
        return {
          id: session.id,
          name: session.name,
          status: session.status,
          aiOutput: session.aiOutput,
          createdAt: session.createdAt,
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
        // Enforce free plan session limit (10/month)
        const billing = await getUserBilling(ctx.user.id);
        const plan = (billing?.plan ?? "free") as PlanId;
        if (plan === "free") {
          const count = await countSessionsThisMonth(ctx.user.id);
          if (count >= 10) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "FREE_LIMIT_REACHED",
            });
          }
        }
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

    /** Generate a read-only share token for a session. Returns the share URL. */
    generateShareLink: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.id, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        // Reuse existing token if already shared
        const token = session.shareToken ?? randomBytes(32).toString("hex");
        if (!session.shareToken) {
          await updateSession(input.id, ctx.user.id, { shareToken: token });
        }
        return { token };
      }),

    /** Revoke the share token for a session (disables the public link). */
    revokeShareLink: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.id, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        await updateSession(input.id, ctx.user.id, { shareToken: null });
        return { success: true };
      }),

    /** Generate a short descriptive title from transcript/notes when the user hasn't typed one. */
    generateTitle: protectedProcedure
      .input(z.object({
        transcript: z.string().optional(),
        personalNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const transcript = (input.transcript ?? "").trim();
        const notes = (input.personalNotes ?? "").trim();

        if (!transcript && !notes) {
          return { title: "Untitled Session" };
        }

        // Feed a short excerpt (first 2000 chars) to keep the call fast
        const excerpt = [
          transcript ? `TRANSCRIPT EXCERPT:\n${transcript.slice(0, 1500)}` : "",
          notes ? `NOTES EXCERPT:\n${notes.slice(0, 500)}` : "",
        ].filter(Boolean).join("\n\n");

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a concise meeting title generator. Given a short excerpt from a meeting transcript and/or personal notes, return ONLY a short, descriptive title for the session — 4 to 7 words, title case, no punctuation at the end, no quotes. Nothing else.",
              },
              { role: "user", content: excerpt },
            ],
          });
          const raw = String(response.choices[0]?.message?.content ?? "").trim();
          const title = raw.replace(/^["']|["']$/g, "").trim();
          return { title: title || "Untitled Session" };
        } catch {
          return { title: "Untitled Session" };
        }
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

        // Truncate transcript to 120k chars (~90k tokens) to stay within LLM context limits
        const MAX_TRANSCRIPT_CHARS = 120_000;
        const transcriptText = input.transcript.trim();
        const truncatedTranscript = transcriptText.length > MAX_TRANSCRIPT_CHARS
          ? transcriptText.slice(0, MAX_TRANSCRIPT_CHARS) + "\n\n[Transcript truncated to fit analysis window — full text saved]"
          : transcriptText;

        const userMessage = [
          truncatedTranscript ? `TRANSCRIPT:\n${truncatedTranscript}` : "TRANSCRIPT: (none provided)",
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
        const parsed = JSON.parse(rawContent) as {
          summary: string;
          keyDecisions: Array<{ decision: string; context: string }>;
          actionItems: Array<{ task: string; priority: "high" | "medium" | "low"; context: string; owner: string }>;
          insights: Array<{ insight: string; source: string }>;
          watchItems: Array<{ item: string; type: string }>;
        };

        await updateSession(input.id, ctx.user.id, {
          transcript: input.transcript,
          personalNotes: input.personalNotes,
          aiOutput: rawContent,
          status: "analyzed",
        });

        // Auto-sync action items to the tracker table
        if (Array.isArray(parsed.actionItems) && parsed.actionItems.length > 0) {
          await upsertActionItemsForSession(input.id, ctx.user.id, parsed.actionItems);
        }

        return { aiOutput: parsed };
      }),
  }),

  // ─── Action Items ────────────────────────────────────────────────────────────
  actionItems: router({
    /** List all action items for the current user (open and completed), with session context. */
    list: protectedProcedure.query(async ({ ctx }) => {
      const rows = await getOpenActionItems(ctx.user.id);
      return rows.map((r) => ({
        ...r,
        parsedTags: (() => { try { return r.sessionTags ? (JSON.parse(r.sessionTags) as string[]) : []; } catch { return []; } })(),
      }));
    }),

    /** Toggle an action item's completed state. */
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), completed: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await toggleActionItem(input.id, ctx.user.id, input.completed);
        return { success: true };
      }),

    /** Set or clear the due date (UTC ms timestamp) for an action item. */
    setDueDate: protectedProcedure
      .input(z.object({ id: z.number(), dueDate: z.number().nullable() }))
      .mutation(async ({ ctx, input }) => {
        await setActionItemDueDate(input.id, ctx.user.id, input.dueDate);
        return { success: true };
      }),
  }),

  // ─── Zoom & Teams Import ───────────────────────────────────────────────────
  zoom: router({
    /** List recent Zoom cloud recordings that have transcripts available. */
    listRecordings: protectedProcedure
      .query(async ({ ctx }) => {
        const keys = await getUserIntegrationKeys(ctx.user.id);
        if (!keys.zoomApiKey) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Connect your Zoom account in Settings → Integrations.' });
        }
        // Zoom Server-to-Server OAuth: list cloud recordings from the last 30 days
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const to = new Date().toISOString().split('T')[0];
        const resp = await fetch(`https://api.zoom.us/v2/users/me/recordings?from=${from}&to=${to}&page_size=20`, {
          headers: { Authorization: `Bearer ${keys.zoomApiKey}`, 'Content-Type': 'application/json' },
        });
        if (!resp.ok) {
          const err = await resp.text();
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Zoom API error: ${err}` });
        }
        const data = await resp.json() as { meetings?: Array<{ uuid: string; topic: string; start_time: string; recording_files?: Array<{ file_type: string; download_url: string; id: string }> }> };
        // Return only meetings that have a transcript file (VTT)
        const meetings = (data.meetings ?? []).filter(m =>
          m.recording_files?.some(f => f.file_type === 'TRANSCRIPT')
        ).map(m => ({
          id: m.uuid,
          topic: m.topic,
          startTime: m.start_time,
          transcriptFileId: m.recording_files?.find(f => f.file_type === 'TRANSCRIPT')?.id ?? '',
          downloadUrl: m.recording_files?.find(f => f.file_type === 'TRANSCRIPT')?.download_url ?? '',
        }));
        return { meetings };
      }),

    /** Fetch the VTT transcript text for a specific Zoom recording. */
    getTranscript: protectedProcedure
      .input(z.object({ downloadUrl: z.string().url(), topic: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const keys = await getUserIntegrationKeys(ctx.user.id);
        if (!keys.zoomApiKey) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Connect your Zoom account in Settings → Integrations.' });
        }
        const resp = await fetch(input.downloadUrl, {
          headers: { Authorization: `Bearer ${keys.zoomApiKey}` },
        });
        if (!resp.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to download Zoom transcript' });
        const vtt = await resp.text();
        // Strip VTT header/timestamps, extract plain text
        const lines = vtt.split('\n');
        const textLines = lines.filter(l => l.trim() && !l.startsWith('WEBVTT') && !l.match(/^\d+$/) && !l.match(/^\d{2}:\d{2}/));
        const transcript = textLines.join(' ').replace(/\s+/g, ' ').trim();
        return { transcript, title: input.topic };
      }),
  }),

  teams: router({
    /** List recent Teams meeting transcripts via Microsoft Graph API. */
    listTranscripts: protectedProcedure
      .query(async ({ ctx }) => {
        const keys = await getUserIntegrationKeys(ctx.user.id);
        if (!keys.teamsApiKey) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Connect your Microsoft Teams account in Settings → Integrations.' });
        }
        // Graph API: list online meetings with transcripts
        const resp = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings?$top=20&$select=id,subject,startDateTime', {
          headers: { Authorization: `Bearer ${keys.teamsApiKey}`, 'Content-Type': 'application/json' },
        });
        if (!resp.ok) {
          const err = await resp.text();
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Teams API error: ${err}` });
        }
        const data = await resp.json() as { value?: Array<{ id: string; subject: string; startDateTime: string }> };
        return { meetings: (data.value ?? []).map(m => ({ id: m.id, subject: m.subject, startDateTime: m.startDateTime })) };
      }),

    /** Fetch transcript content for a specific Teams meeting. */
    getTranscript: protectedProcedure
      .input(z.object({ meetingId: z.string(), subject: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const keys = await getUserIntegrationKeys(ctx.user.id);
        if (!keys.teamsApiKey) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Connect your Microsoft Teams account in Settings → Integrations.' });
        }
        // Get transcripts list for this meeting
        const tResp = await fetch(`https://graph.microsoft.com/v1.0/me/onlineMeetings/${input.meetingId}/transcripts`, {
          headers: { Authorization: `Bearer ${keys.teamsApiKey}` },
        });
        if (!tResp.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to list Teams transcripts' });
        const tData = await tResp.json() as { value?: Array<{ id: string }> };
        const transcriptId = tData.value?.[0]?.id;
        if (!transcriptId) throw new TRPCError({ code: 'NOT_FOUND', message: 'No transcript found for this Teams meeting' });
        // Fetch the transcript content (plain text)
        const cResp = await fetch(`https://graph.microsoft.com/v1.0/me/onlineMeetings/${input.meetingId}/transcripts/${transcriptId}/content?$format=text/vtt`, {
          headers: { Authorization: `Bearer ${keys.teamsApiKey}` },
        });
        if (!cResp.ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to download Teams transcript' });
        const vtt = await cResp.text();
        const lines = vtt.split('\n');
        const textLines = lines.filter(l => l.trim() && !l.startsWith('WEBVTT') && !l.match(/^\d+$/) && !l.match(/^\d{2}:\d{2}/));
        const transcript = textLines.join(' ').replace(/\s+/g, ' ').trim();
        return { transcript, title: input.subject };
      }),
  }),

  // ─── Billing ──────────────────────────────────────────────────────────────
  billing: router({
    /** Get current user's plan and billing status */
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const billing = await getUserBilling(ctx.user.id);
      const plan = (billing?.plan ?? "free") as PlanId;
      const sessionsThisMonth = plan === "free" ? await countSessionsThisMonth(ctx.user.id) : null;
      return {
        plan,
        stripeCustomerId: billing?.stripeCustomerId ?? null,
        stripeSubscriptionId: billing?.stripeSubscriptionId ?? null,
        planExpiresAt: billing?.planExpiresAt ?? null,
        plans: PLANS,
        sessionsThisMonth,
        sessionLimit: plan === "free" ? 10 : null,
      };
    }),

    /** Create a Stripe Checkout session for upgrading to Pro or Team */
    createCheckoutSession: protectedProcedure
      .input(z.object({ planKey: z.enum(["pro", "team"]), origin: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        const priceIds = await ensureProducts();
        const priceId = priceIds[input.planKey];
        if (!priceId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Price not found" });

        const billing = await getUserBilling(ctx.user.id);
        let customerId = billing?.stripeCustomerId ?? undefined;

        // Create or reuse Stripe customer
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: ctx.user.email ?? undefined,
            name: ctx.user.name ?? undefined,
            metadata: { user_id: String(ctx.user.id) },
          });
          customerId = customer.id;
          await updateUserBilling(ctx.user.id, { stripeCustomerId: customerId });
        }

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${input.origin}/settings?billing=success`,
          cancel_url: `${input.origin}/pricing`,
          allow_promotion_codes: true,
          client_reference_id: String(ctx.user.id),
          metadata: {
            user_id: String(ctx.user.id),
            plan_key: input.planKey,
            customer_email: ctx.user.email ?? "",
          },
        });

        return { url: session.url };
      }),

    /** Create a Stripe Customer Portal session for managing subscription */
    createPortalSession: protectedProcedure
      .input(z.object({ origin: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        const billing = await getUserBilling(ctx.user.id);
        if (!billing?.stripeCustomerId) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No billing account found" });
        }
        const session = await stripe.billingPortal.sessions.create({
          customer: billing.stripeCustomerId,
          return_url: `${input.origin}/settings`,
        });
        return { url: session.url };
      }),
  }),

  // ─── Notes Import (OCR + Paste) ───────────────────────────────────────────
  notes: router({
    /** Extract text from an image using GPT-4o vision (OCR for handwritten/printed notes). */
    extractFromImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url(), // S3 or data URL of the uploaded image
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an OCR assistant. Extract all text from the provided image exactly as written. Preserve line breaks, bullet points, and structure. Return only the extracted text — no commentary, no formatting changes.",
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url" as const,
                  image_url: { url: input.imageUrl, detail: "high" as const },
                },
                {
                  type: "text" as const,
                  text: "Extract all text from this image. Preserve the original structure and formatting.",
                },
              ],
            },
          ],
        });
        const text = String(response.choices[0]?.message?.content ?? "").trim();
        if (!text) throw new TRPCError({ code: "UNPROCESSABLE_CONTENT", message: "No text could be extracted from this image." });
        return { text };
      }),
  }),
  // ─── Support / Contact ────────────────────────────────────────────────────────
  support: router({
    /** Send a support message from a logged-in user to the owner via notification. */
    sendMessage: protectedProcedure
      .input(z.object({
        subject: z.string().min(1).max(120),
        message: z.string().min(10).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const delivered = await notifyOwner({
          title: `[Support] ${input.subject}`,
          content: `From: ${ctx.user.name} (${ctx.user.email})\n\n${input.message}`,
        });
        return { success: delivered };
      }),
  }),
});

export type AppRouter = typeof appRouter;
