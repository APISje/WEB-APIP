import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/chat/session", async (req, res) => {
  const { visitorId } = req.body;
  if (!visitorId) {
    res.status(400).json({ error: "visitorId required" });
    return;
  }

  const existing = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.visitorId, visitorId))
    .orderBy(desc(chatSessionsTable.createdAt))
    .limit(1);

  if (existing.length > 0) {
    res.json(existing[0]);
    return;
  }

  const [session] = await db
    .insert(chatSessionsTable)
    .values({ visitorId, status: "active" })
    .returning();

  res.json(session);
});

router.get("/chat/session/:visitorId/messages", async (req, res) => {
  const { visitorId } = req.params;

  const sessions = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.visitorId, visitorId))
    .orderBy(desc(chatSessionsTable.createdAt))
    .limit(1);

  if (sessions.length === 0) {
    res.json([]);
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessions[0].id))
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages);
});

export default router;
