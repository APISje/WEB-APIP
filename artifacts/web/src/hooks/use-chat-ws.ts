import { useEffect, useRef, useCallback, useState } from "react";

export interface ChatMessage {
  id: number;
  sessionId: number;
  sender: "visitor" | "admin";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: number;
  visitorId: string;
  status: "pending" | "active" | "closed";
  createdAt: string;
  lastMessageAt: string;
  lastMessage?: string | null;
}

export interface Announcement {
  content: string;
  createdAt: string;
}

type WsMessage =
  | { type: "session"; data: ChatSession }
  | { type: "history"; data: ChatMessage[] }
  | { type: "message"; data: ChatMessage }
  | { type: "auth_ok" }
  | { type: "session_list"; data: ChatSession[] }
  | { type: "new_visitor_message"; data: { sessionId: number; message: ChatMessage; sessionStatus: string } }
  | { type: "session_accepted"; data: ChatSession }
  | { type: "session_closed"; data: ChatSession }
  | { type: "announcement"; data: Announcement }
  | { type: "error"; message: string };

function getWsUrl() {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws`;
}

export function useVisitorChat(visitorId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [connected, setConnected] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    if (!visitorId) return;
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "join_visitor", visitorId }));
    };

    ws.onmessage = (e) => {
      const msg: WsMessage = JSON.parse(e.data);
      if (msg.type === "session") setSession(msg.data);
      if (msg.type === "history") setMessages(msg.data);
      if (msg.type === "message") setMessages((prev) => [...prev, msg.data]);
      if (msg.type === "session_accepted") setSession(msg.data);
      if (msg.type === "session_closed") setSession(msg.data);
      if (msg.type === "announcement") {
        setAnnouncement(msg.data);
        setTimeout(() => setAnnouncement(null), 5000);
      }
    };

    ws.onclose = () => setConnected(false);
    return () => ws.close();
  }, [visitorId]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", content }));
    }
  }, []);

  return { messages, session, connected, announcement, sendMessage };
}

export function useAdminChat(password: string, selectedSessionId: number | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMsgNotif, setNewMsgNotif] = useState<{ sessionId: number; sessionStatus: string } | null>(null);
  const [announcement, setAnnouncement] = useState<{ content: string; createdAt: string } | null>(null);

  useEffect(() => {
    if (!password) return;
    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "join_admin", password }));
    };

    ws.onmessage = (e) => {
      const msg: WsMessage = JSON.parse(e.data);
      if (msg.type === "auth_ok") setAuthed(true);
      if (msg.type === "error") setError(msg.message);
      if (msg.type === "session_list") setSessions(msg.data);
      if (msg.type === "history") setMessages(msg.data);
      if (msg.type === "message") setMessages((prev) => [...prev, msg.data]);
      if (msg.type === "session_accepted") {
        setSessions((prev) =>
          prev.map((s) => (s.id === msg.data.id ? { ...s, status: msg.data.status } : s))
        );
      }
      if (msg.type === "session_closed") {
        setSessions((prev) =>
          prev.map((s) => (s.id === msg.data.id ? { ...s, status: msg.data.status } : s))
        );
      }
      if (msg.type === "new_visitor_message") {
        setNewMsgNotif({ sessionId: msg.data.sessionId, sessionStatus: msg.data.sessionStatus });
      }
      if (msg.type === "announcement") {
        setAnnouncement(msg.data);
        setTimeout(() => setAnnouncement(null), 5000);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setAuthed(false);
    };

    return () => ws.close();
  }, [password]);

  useEffect(() => {
    if (!authed || selectedSessionId === null) return;
    setMessages([]);
    wsRef.current?.send(
      JSON.stringify({ type: "admin_select_session", sessionId: selectedSessionId })
    );
  }, [authed, selectedSessionId]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", content }));
    }
  }, []);

  const acceptSession = useCallback((sessionId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "accept_session", sessionId }));
    }
  }, []);

  const closeSession = useCallback((sessionId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "close_session", sessionId }));
    }
  }, []);

  const sendAnnouncement = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "announce", content }));
    }
  }, []);

  return {
    sessions, messages, connected, authed, error,
    newMsgNotif, announcement,
    sendMessage, acceptSession, closeSession, sendAnnouncement,
  };
}
