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

export async function getOpenActionItems(userId: number): Promise<(ActionItem & { sessionName: string; sessionTags: string | null })[]> {
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
