import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ActionItem, actionItems, InsertActionItem, InsertSession, InsertUser, Session, sessions, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Session helpers ───────────────────────────────────────────────────────────

export async function createSession(data: InsertSession): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessions).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function getSessionsByUser(userId: number, search?: string): Promise<Session[]> {
  const db = await getDb();
  if (!db) return [];
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          or(
            like(sessions.name, term),
            like(sessions.transcript, term),
            like(sessions.personalNotes, term),
            like(sessions.aiOutput, term)
          )
        )
      )
      .orderBy(desc(sessions.createdAt));
  }
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt));
}

export async function getSessionById(id: number, userId: number): Promise<Session | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
    .limit(1);
  return result[0];
}

export async function getSessionByShareToken(token: string): Promise<Session | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.shareToken, token))
    .limit(1);
  return result[0];
}

export async function updateSession(id: number, userId: number, data: Partial<InsertSession>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sessions).set(data).where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
}

export async function deleteSession(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
}

// ─── Action Item helpers ──────────────────────────────────────────────────────────────

export type ActionItemWithSession = ActionItem & { sessionName: string; sessionTags: string | null };

export async function getOpenActionItems(userId: number): Promise<ActionItemWithSession[]> {
  const db = await getDb();
  if (!db) return [];
  // Join with sessions to get session name and tags for context
  const rows = await db
    .select({
      id: actionItems.id,
      sessionId: actionItems.sessionId,
      userId: actionItems.userId,
      task: actionItems.task,
      priority: actionItems.priority,
      context: actionItems.context,
      owner: actionItems.owner,
      completed: actionItems.completed,
      dueDate: actionItems.dueDate,
      createdAt: actionItems.createdAt,
      updatedAt: actionItems.updatedAt,
      sessionName: sessions.name,
      sessionTags: sessions.tags,
    })
    .from(actionItems)
    .innerJoin(sessions, eq(actionItems.sessionId, sessions.id))
    .where(eq(actionItems.userId, userId))
    .orderBy(desc(actionItems.createdAt));
  return rows;
}

export async function upsertActionItemsForSession(
  sessionId: number,
  userId: number,
  items: Array<{ task: string; priority: "high" | "medium" | "low"; context: string; owner: string }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete existing non-completed items for this session, then re-insert
  await db
    .delete(actionItems)
    .where(and(eq(actionItems.sessionId, sessionId), eq(actionItems.userId, userId), eq(actionItems.completed, false)));
  if (items.length === 0) return;
  const rows: InsertActionItem[] = items.map((item) => ({
    sessionId,
    userId,
    task: item.task,
    priority: item.priority,
    context: item.context || null,
    owner: item.owner || null,
    completed: false,
    dueDate: null,
  }));
  await db.insert(actionItems).values(rows);
}

export async function toggleActionItem(id: number, userId: number, completed: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(actionItems)
    .set({ completed })
    .where(and(eq(actionItems.id, id), eq(actionItems.userId, userId)));
}

// ─── User integration key helpers ───────────────────────────────────────────────

type IntegrationField = 'firefliesApiKey' | 'notionApiKey' | 'otterApiKey' | 'granolaApiKey' | 'zoomApiKey' | 'teamsApiKey';

export async function setUserIntegrationKey(userId: number, field: IntegrationField, apiKey: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(users).set({ [field]: apiKey }).where(eq(users.id, userId));
}

export async function getUserIntegrationKeys(userId: number): Promise<{ firefliesApiKey: string | null; notionApiKey: string | null; otterApiKey: string | null; granolaApiKey: string | null; zoomApiKey: string | null; teamsApiKey: string | null }> {
  const db = await getDb();
  if (!db) return { firefliesApiKey: null, notionApiKey: null, otterApiKey: null, granolaApiKey: null, zoomApiKey: null, teamsApiKey: null };
  const result = await db
    .select({ firefliesApiKey: users.firefliesApiKey, notionApiKey: users.notionApiKey, otterApiKey: users.otterApiKey, granolaApiKey: users.granolaApiKey, zoomApiKey: users.zoomApiKey, teamsApiKey: users.teamsApiKey })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0] ?? { firefliesApiKey: null, notionApiKey: null, otterApiKey: null, granolaApiKey: null, zoomApiKey: null, teamsApiKey: null };
}

export async function clearUserIntegrationKey(userId: number, field: IntegrationField): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(users).set({ [field]: null }).where(eq(users.id, userId));
}

export async function setActionItemDueDate(id: number, userId: number, dueDate: number | null): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(actionItems)
    .set({ dueDate })
    .where(and(eq(actionItems.id, id), eq(actionItems.userId, userId)));
}

// ─── Billing helpers ─────────────────────────────────────────────────────────

export type PlanId = "free" | "pro" | "team";

export async function getUserBilling(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      plan: users.plan,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      planExpiresAt: users.planExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function updateUserBilling(
  userId: number,
  data: {
    plan?: PlanId;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    planExpiresAt?: number | null;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getUserByStripeCustomerId(customerId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  return result[0] ?? null;
}

export async function countSessionsThisMonth(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startMs = startOfMonth.getTime();
  const result = await db
    .select({ id: sessions.id, createdAt: sessions.createdAt })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  // Filter in JS: count only sessions created this calendar month
  return result.filter((s) => {
    const ts = s.createdAt instanceof Date ? s.createdAt.getTime() : (s.createdAt ?? 0);
    return ts >= startMs;
  }).length;
}

// ─── Weekly Digest Helpers ────────────────────────────────────────────────────

/**
 * Returns all Pro/Team users who have at least one analyzed session
 * created in the past 7 days, along with those sessions.
 */
export async function getProUsersWithRecentSessions(): Promise<
  Array<{
    userId: number;
    userName: string | null;
    email: string | null;
    sessions: Array<{ id: number; name: string; aiOutput: string | null; tags: string | null; createdAt: Date }>;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get all Pro/Team users
  const proUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, plan: users.plan })
    .from(users)
    .where(or(eq(users.plan, "pro"), eq(users.plan, "team")));

  if (proUsers.length === 0) return [];

  const result: Array<{
    userId: number;
    userName: string | null;
    email: string | null;
    sessions: Array<{ id: number; name: string; aiOutput: string | null; tags: string | null; createdAt: Date }>;
  }> = [];

  for (const user of proUsers) {
    const recentSessions = await db
      .select({
        id: sessions.id,
        name: sessions.name,
        aiOutput: sessions.aiOutput,
        tags: sessions.tags,
        createdAt: sessions.createdAt,
      })
      .from(sessions)
      .where(and(eq(sessions.userId, user.id), eq(sessions.status, "analyzed")))
      .orderBy(desc(sessions.createdAt));

    // Filter to past 7 days in JS (same pattern as countSessionsThisMonth)
    const recent = recentSessions.filter((s) => {
      const ts = s.createdAt instanceof Date ? s.createdAt.getTime() : 0;
      return ts >= sevenDaysAgo.getTime();
    });

    if (recent.length > 0) {
      result.push({ userId: user.id, userName: user.name, email: user.email, sessions: recent });
    }
  }

  return result;
}
