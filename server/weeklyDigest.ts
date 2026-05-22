/**
 * Weekly Digest Handler
 *
 * Triggered every Monday at 9:00 AM UTC by a Heartbeat cron.
 * Queries all analyzed sessions from the past 7 days for every Pro/Team user,
 * generates an AI digest per user, and sends Chad a consolidated notification.
 *
 * Endpoint: POST /api/scheduled/weekly-digest
 * Auth: sdk.authenticateRequest → user.isCron === true
 */

import type { Request, Response } from "express";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { getProUsersWithRecentSessions } from "./db";
import { ENV } from "./_core/env";

// ─── Cron auth helper ─────────────────────────────────────────────────────────

interface CronUser {
  isCron: boolean;
  taskUid: string | null;
}

async function authenticateCronRequest(req: Request): Promise<CronUser | null> {
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
    const data = (await resp.json()) as { isCron?: boolean; taskUid?: string };
    return { isCron: data.isCron === true, taskUid: data.taskUid ?? null };
  } catch {
    return null;
  }
}

// ─── Digest generator ─────────────────────────────────────────────────────────

function groupByTag(
  rows: Array<{ id: number; name: string; aiOutput: string | null; tags: string | null; createdAt: Date }>
) {
  const groups: Record<string, typeof rows> = {};
  for (const row of rows) {
    let tags: string[] = [];
    try { tags = row.tags ? JSON.parse(row.tags) : []; } catch { tags = []; }
    const label = tags.length > 0 ? tags[0] : "Uncategorized";
    if (!groups[label]) groups[label] = [];
    groups[label].push(row);
  }
  return groups;
}

async function generateUserDigest(
  userName: string | null,
  groups: Record<string, Array<{ id: number; name: string; aiOutput: string | null; tags: string | null; createdAt: Date }>>,
  totalCount: number
): Promise<string> {
  const sessionLines: string[] = [];
  for (const [tag, rows] of Object.entries(groups)) {
    sessionLines.push(`\n## ${tag} (${rows.length} session${rows.length > 1 ? "s" : ""})`);
    for (const row of rows) {
      const date = new Date(row.createdAt).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
      });
      sessionLines.push(`- **${row.name}** (${date})`);
      if (row.aiOutput) {
        try {
          const ai = JSON.parse(row.aiOutput) as {
            summary?: string;
            actionItems?: Array<{ task: string; priority: string }>;
          };
          if (ai.summary) sessionLines.push(`  Summary: ${ai.summary}`);
          const highItems = (ai.actionItems ?? []).filter((a) => a.priority === "high");
          if (highItems.length > 0) {
            sessionLines.push(`  High-priority actions: ${highItems.map((a) => a.task).join("; ")}`);
          }
        } catch { /* skip malformed */ }
      }
    }
  }

  const prompt = `You are an executive assistant writing a weekly digest for ${userName ?? "a user"}. Below are ${totalCount} meeting sessions from the past 7 days, grouped by domain. Write 3-5 bullet points capturing the most important themes, decisions, and open actions. Be direct and specific — no filler.\n\nSESSIONS:\n${sessionLines.join("\n")}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a concise executive assistant. Return plain text bullet points only." },
        { role: "user", content: prompt },
      ],
    });
    return String(response.choices[0]?.message?.content ?? "").trim();
  } catch {
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

    // 2. Get all Pro/Team users with sessions in the past 7 days
    const proUsers = await getProUsersWithRecentSessions();

    if (proUsers.length === 0) {
      await notifyOwner({
        title: "NoteAssemble Weekly Digest",
        content: "No Pro/Team users had analyzed sessions in the past 7 days.",
      });
      return res.json({ ok: true, userCount: 0 });
    }

    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
      month: "short", day: "numeric",
    });
    const weekEnd = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // 3. Generate a digest for each user and accumulate into one notification
    const userSections: string[] = [];

    for (const userData of proUsers) {
      const groups = groupByTag(userData.sessions);
      const digestText = await generateUserDigest(userData.userName, groups, userData.sessions.length);

      const tagBreakdown = Object.entries(groups)
        .map(([tag, rows]) => `${tag}: ${rows.length}`)
        .join(" · ");

      userSections.push(
        [
          `### ${userData.userName ?? "User"} (${userData.email ?? "no email"})`,
          `${userData.sessions.length} session${userData.sessions.length > 1 ? "s" : ""} · ${tagBreakdown}`,
          "",
          digestText,
        ].join("\n")
      );
    }

    const totalSessions = proUsers.reduce((sum, u) => sum + u.sessions.length, 0);

    const content = [
      `**${weekStart} – ${weekEnd}** · ${proUsers.length} active Pro user${proUsers.length > 1 ? "s" : ""} · ${totalSessions} sessions`,
      "",
      ...userSections,
      "",
      "---",
      "Open NoteAssemble to review all sessions and action items.",
    ].join("\n");

    await notifyOwner({
      title: `NoteAssemble Weekly Digest — ${weekStart}`,
      content,
    });

    return res.json({ ok: true, userCount: proUsers.length, sessionCount: totalSessions });
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
