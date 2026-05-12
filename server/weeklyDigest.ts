/**
 * Weekly Digest Handler
 *
 * Triggered every Monday at 9:00 AM UTC by a Heartbeat cron.
 * Queries all sessions from the past 7 days for the owner, groups them by tag,
 * generates an AI summary, and sends it as a Manus owner notification.
 *
 * Endpoint: POST /api/scheduled/weekly-digest
 * Auth: sdk.authenticateRequest → user.isCron === true
 */

import type { Request, Response } from "express";
import { and, gte } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { sessions } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";

// ─── Cron auth helper ─────────────────────────────────────────────────────────

interface CronUser {
  isCron: boolean;
  taskUid: string | null;
  userId?: string;
}

async function authenticateCronRequest(req: Request): Promise<CronUser | null> {
  // The platform injects a Bearer token for cron calls.
  // We validate it against the forge API.
  const authHeader = req.headers.authorization ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);

  try {
    const baseUrl = ENV.forgeApiUrl;
    if (!baseUrl) return null;
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const endpoint = new URL(
      "webdevtoken.v1.WebDevService/AuthenticateRequest",
      normalizedBase
    ).toString();

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ token }),
    });

    if (!resp.ok) return null;
    const data = (await resp.json()) as { isCron?: boolean; taskUid?: string; userId?: string };
    return {
      isCron: data.isCron === true,
      taskUid: data.taskUid ?? null,
      userId: data.userId,
    };
  } catch {
    return null;
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getRecentSessionsForOwner(userId: number, sinceMs: number) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(sinceMs);
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gte(sessions.createdAt, since)))
    .orderBy(sessions.createdAt);
}

// ─── Digest generator ─────────────────────────────────────────────────────────

function groupByTag(rows: typeof sessions.$inferSelect[]) {
  const groups: Record<string, typeof sessions.$inferSelect[]> = {};
  for (const row of rows) {
    let tags: string[] = [];
    try { tags = row.tags ? JSON.parse(row.tags) : []; } catch { tags = []; }
    const label = tags.length > 0 ? tags[0] : "Uncategorized";
    if (!groups[label]) groups[label] = [];
    groups[label].push(row);
  }
  return groups;
}

async function generateDigestSummary(
  groups: Record<string, typeof sessions.$inferSelect[]>,
  totalCount: number
): Promise<string> {
  const sessionLines: string[] = [];
  for (const [tag, rows] of Object.entries(groups)) {
    sessionLines.push(`\n## ${tag} (${rows.length} session${rows.length > 1 ? "s" : ""})`);
    for (const row of rows) {
      const date = new Date(row.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      sessionLines.push(`- **${row.name}** (${date})`);
      if (row.aiOutput) {
        try {
          const ai = JSON.parse(row.aiOutput) as { summary?: string; actionItems?: Array<{ task: string; priority: string }> };
          if (ai.summary) sessionLines.push(`  Summary: ${ai.summary}`);
          const highItems = (ai.actionItems ?? []).filter((a) => a.priority === "high");
          if (highItems.length > 0) {
            sessionLines.push(`  High-priority actions: ${highItems.map((a) => a.task).join("; ")}`);
          }
        } catch { /* skip malformed */ }
      }
    }
  }

  const prompt = `You are an executive assistant. Below is a summary of ${totalCount} meeting sessions from the past 7 days, grouped by domain. Write a concise weekly digest in 3-5 bullet points that captures the most important themes, decisions, and open actions across all domains. Be direct and specific — no filler language.\n\nSESSIONS:\n${sessionLines.join("\n")}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a concise executive assistant. Return plain text only." },
        { role: "user", content: prompt },
      ],
    });
    return String(response.choices[0]?.message?.content ?? "").trim();
  } catch {
    // Fallback: just return the raw session list
    return sessionLines.join("\n");
  }
}

// ─── Express handler ──────────────────────────────────────────────────────────

export async function weeklyDigestHandler(req: Request, res: Response) {
  try {
    // 1. Authenticate — must be a cron call
    const user = await authenticateCronRequest(req);
    if (!user || !user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    // 2. Get the owner's user ID from the DB using OWNER_OPEN_ID
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { users } = await import("../drizzle/schema");
    const ownerOpenId = ENV.ownerOpenId;
    if (!ownerOpenId) {
      return res.status(500).json({ error: "OWNER_OPEN_ID not configured" });
    }

    const ownerRows = await db.select().from(users).where(eq(users.openId, ownerOpenId)).limit(1);
    if (ownerRows.length === 0) {
      // Owner hasn't signed in yet — skip silently
      return res.json({ ok: true, skipped: "owner-not-found" });
    }
    const ownerId = ownerRows[0].id;

    // 3. Query sessions from the past 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = await getRecentSessionsForOwner(ownerId, sevenDaysAgo);

    if (recentSessions.length === 0) {
      await notifyOwner({
        title: "NoteAssemble Weekly Digest",
        content: "No sessions recorded in the past 7 days.",
      });
      return res.json({ ok: true, sessionCount: 0 });
    }

    // 4. Group by tag and generate AI summary
    const groups = groupByTag(recentSessions);
    const digestText = await generateDigestSummary(groups, recentSessions.length);

    // 5. Build the notification
    const weekStart = new Date(sevenDaysAgo).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekEnd = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const tagBreakdown = Object.entries(groups)
      .map(([tag, rows]) => `${tag}: ${rows.length}`)
      .join(" · ");

    const content = [
      `**${weekStart} – ${weekEnd}** · ${recentSessions.length} session${recentSessions.length > 1 ? "s" : ""} · ${tagBreakdown}`,
      "",
      digestText,
      "",
      "---",
      "Open NoteAssemble to review all sessions and action items.",
    ].join("\n");

    await notifyOwner({
      title: `NoteAssemble Weekly Digest — ${weekStart}`,
      content,
    });

    return res.json({ ok: true, sessionCount: recentSessions.length });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[WeeklyDigest] Error:", err);
    return res.status(500).json({
      error,
      stack,
      context: { url: req.url, taskUid: req.headers["x-task-uid"] ?? null },
      timestamp: new Date().toISOString(),
    });
  }
}
