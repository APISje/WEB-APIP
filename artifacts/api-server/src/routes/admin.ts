import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function adminAuth(req: Request, res: Response, next: NextFunction) {
  const password = req.headers["x-admin-password"];
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/admin/sessions", adminAuth, async (_req, res) => {
  const sessions = await db
    .select()
    .from(chatSessionsTable)
    .orderBy(desc(chatSessionsTable.lastMessageAt));

  const result = await Promise.all(
    sessions.map(async (session) => {
      const lastMsg = await db
        .select()
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.sessionId, session.id))
        .orderBy(desc(chatMessagesTable.createdAt))
        .limit(1);

      const unreadRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatMessagesTable)
        .where(
          and(
            eq(chatMessagesTable.sessionId, session.id),
            eq(chatMessagesTable.sender, "visitor")
          )
        );

      return {
        ...session,
        lastMessage: lastMsg[0]?.content ?? null,
        unreadCount: Number(unreadRes[0]?.count ?? 0),
      };
    })
  );

  res.json(result);
});

router.get("/admin/sessions/:sessionId/messages", adminAuth, async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages);
});

router.patch("/admin/sessions/:sessionId/close", adminAuth, async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const [updated] = await db
    .update(chatSessionsTable)
    .set({ status: "closed" })
    .where(eq(chatSessionsTable.id, sessionId))
    .returning();

  res.json(updated);
});

export default router;
