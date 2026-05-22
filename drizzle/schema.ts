import { boolean, bigint, int, mysqlEnum, mysqlTable, text, longtext, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  firefliesApiKey: varchar("firefliesApiKey", { length: 255 }), // user's own Fireflies API key
  notionApiKey: varchar("notionApiKey", { length: 255 }), // user's Notion integration token
  otterApiKey: varchar("otterApiKey", { length: 255 }), // user's Otter.ai API key
  granolaApiKey: varchar("granolaApiKey", { length: 255 }), // user's Granola personal API key
  zoomApiKey: varchar("zoomApiKey", { length: 512 }), // user's Zoom Server-to-Server OAuth token or JWT
  teamsApiKey: varchar("teamsApiKey", { length: 512 }), // user's Microsoft Teams (Graph API) access token
  // Stripe billing
  plan: mysqlEnum("plan", ["free", "pro", "team"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  planExpiresAt: bigint("planExpiresAt", { mode: "number" }), // UTC ms, null = no expiry
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Sessions table — stores meeting intelligence sessions
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  transcript: longtext("transcript"),
  personalNotes: longtext("personalNotes"),
  aiOutput: longtext("aiOutput"), // JSON string of structured AI analysis
  tags: text("tags"), // JSON array of tag strings e.g. ["Church","Real Estate"]
  status: mysqlEnum("status", ["draft", "analyzed"]).default("draft").notNull(),
  shareToken: varchar("shareToken", { length: 64 }), // nullable unique token for read-only sharing
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// Action items table — extracted from AI analysis, tracked across sessions
export const actionItems = mysqlTable("actionItems", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  task: text("task").notNull(),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  context: text("context"),
  owner: varchar("owner", { length: 255 }),
  completed: boolean("completed").default(false).notNull(),
  dueDate: bigint("dueDate", { mode: "number" }), // nullable UTC ms timestamp
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = typeof actionItems.$inferInsert;
