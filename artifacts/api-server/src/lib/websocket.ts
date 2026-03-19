import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "APIP";

interface Client {
  ws: WebSocket;
  role: "visitor" | "admin";
  sessionId?: number;
  visitorId?: string;
}

const clients: Set<Client> = new Set();

function broadcast(data: unknown, filter?: (c: Client) => boolean) {
  const json = JSON.stringify(data);
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      if (!filter || filter(client)) {
        client.ws.send(json);
      }
    }
  }
}

async function broadcastSessionList() {
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

      return {
        ...session,
        lastMessage: lastMsg[0]?.content ?? null,
      };
    })
  );

  broadcast({ type: "session_list", data: result }, (c) => c.role === "admin");
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    const client: Client = { ws, role: "visitor" };
    clients.add(client);

    ws.on("message", async (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
        return;
      }

      const type = msg.type as string;

      // ─── Visitor Join ──────────────────────────────────────────
      if (type === "join_visitor") {
        const visitorId = msg.visitorId as string;
        if (!visitorId) return;

        client.role = "visitor";
        client.visitorId = visitorId;

        const existing = await db
          .select()
          .from(chatSessionsTable)
          .where(eq(chatSessionsTable.visitorId, visitorId))
          .orderBy(desc(chatSessionsTable.createdAt))
          .limit(1);

        let session = existing[0];
        if (!session) {
          const [s] = await db
            .insert(chatSessionsTable)
            .values({ visitorId, status: "pending" })
            .returning();
          session = s;
        }
        client.sessionId = session.id;

        ws.send(JSON.stringify({ type: "session", data: session }));

        const messages = await db
          .select()
          .from(chatMessagesTable)
          .where(eq(chatMessagesTable.sessionId, session.id))
          .orderBy(chatMessagesTable.createdAt);

        ws.send(JSON.stringify({ type: "history", data: messages }));
        return;
      }

      // ─── Admin Join ────────────────────────────────────────────
      if (type === "join_admin") {
        const password = msg.password as string;
        if (password !== ADMIN_PASSWORD) {
          ws.send(JSON.stringify({ type: "error", message: "Wrong password" }));
          ws.close();
          return;
        }
        client.role = "admin";
        ws.send(JSON.stringify({ type: "auth_ok" }));
        await broadcastSessionList();
        return;
      }

      // ─── Admin Select Session ──────────────────────────────────
      if (type === "admin_select_session") {
        if (client.role !== "admin") return;
        client.sessionId = msg.sessionId as number;

        const messages = await db
          .select()
          .from(chatMessagesTable)
          .where(eq(chatMessagesTable.sessionId, client.sessionId))
          .orderBy(chatMessagesTable.createdAt);

        ws.send(JSON.stringify({ type: "history", data: messages }));
        return;
      }

      // ─── Admin Accept Session ──────────────────────────────────
      if (type === "accept_session") {
        if (client.role !== "admin") return;
        const sessionId = msg.sessionId as number;
        if (!sessionId) return;

        const [updated] = await db
          .update(chatSessionsTable)
          .set({ status: "active" })
          .where(eq(chatSessionsTable.id, sessionId))
          .returning();

        broadcast(
          { type: "session_accepted", data: updated },
          (c) =>
            (c.role === "visitor" && c.sessionId === sessionId) ||
            c.role === "admin"
        );

        await broadcastSessionList();
        return;
      }

      // ─── Admin Close Session ───────────────────────────────────
      if (type === "close_session") {
        if (client.role !== "admin") return;
        const sessionId = msg.sessionId as number;
        if (!sessionId) return;

        const [updated] = await db
          .update(chatSessionsTable)
          .set({ status: "closed" })
          .where(eq(chatSessionsTable.id, sessionId))
          .returning();

        broadcast(
          { type: "session_closed", data: updated },
          (c) =>
            (c.role === "visitor" && c.sessionId === sessionId) ||
            c.role === "admin"
        );

        await broadcastSessionList();
        return;
      }

      // ─── Admin Announce ────────────────────────────────────────
      if (type === "announce") {
        if (client.role !== "admin") return;
        const content = (msg.content as string)?.trim();
        if (!content) return;

        broadcast(
          { type: "announcement", data: { content, createdAt: new Date().toISOString() } },
          () => true
        );
        return;
      }

      // ─── Send Message ──────────────────────────────────────────
      if (type === "message") {
        const content = (msg.content as string)?.trim();
        if (!content) return;

        if (client.role === "visitor" && client.sessionId) {
          const session = await db
            .select()
            .from(chatSessionsTable)
            .where(eq(chatSessionsTable.id, client.sessionId))
            .limit(1);

          if (!session[0]) return;

          const [saved] = await db
            .insert(chatMessagesTable)
            .values({ sessionId: client.sessionId, sender: "visitor", content })
            .returning();

          await db
            .update(chatSessionsTable)
            .set({ lastMessageAt: new Date() })
            .where(eq(chatSessionsTable.id, client.sessionId));

          const msgPayload = { type: "message", data: saved };
          broadcast(
            msgPayload,
            (c) =>
              (c.role === "visitor" && c.sessionId === client.sessionId) ||
              (c.role === "admin" && c.sessionId === client.sessionId)
          );

          broadcast(
            {
              type: "new_visitor_message",
              data: { sessionId: client.sessionId, message: saved, sessionStatus: session[0].status },
            },
            (c) => c.role === "admin"
          );

          await broadcastSessionList();
          return;
        }

        if (client.role === "admin" && client.sessionId) {
          const session = await db
            .select()
            .from(chatSessionsTable)
            .where(eq(chatSessionsTable.id, client.sessionId))
            .limit(1);

          if (!session[0] || session[0].status !== "active") {
            ws.send(JSON.stringify({ type: "error", message: "Sesi belum diaktifkan. Accept dulu." }));
            return;
          }

          const [saved] = await db
            .insert(chatMessagesTable)
            .values({ sessionId: client.sessionId, sender: "admin", content })
            .returning();

          await db
            .update(chatSessionsTable)
            .set({ lastMessageAt: new Date() })
            .where(eq(chatSessionsTable.id, client.sessionId));

          const msgPayload = { type: "message", data: saved };
          broadcast(
            msgPayload,
            (c) =>
              (c.role === "visitor" && c.sessionId === client.sessionId) ||
              (c.role === "admin" && c.sessionId === client.sessionId)
          );

          await broadcastSessionList();
          return;
        }
      }
    });

    ws.on("close", () => {
      clients.delete(client);
    });
  });

  return wss;
}
