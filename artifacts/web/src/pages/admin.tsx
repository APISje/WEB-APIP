import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, Send, Users, Clock, CheckCircle, Circle,
  LogOut, Shield, ChevronRight, Inbox, Bell, BellRing,
  Megaphone, X, Check, UserCheck, XCircle, Menu, ArrowLeft,
} from "lucide-react";
import { useAdminChat } from "@/hooks/use-chat-ws";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL;

function playNotif() {
  try {
    const audio = new Audio(`${BASE}notif.mp3`);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch {}
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "Baru saja";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}j lalu`;
  return date.toLocaleDateString("id-ID");
}

// ─── Toast Notification ──────────────────────────────────────────────────────
interface ToastItem { id: number; message: string; type: "message" | "announce" }

function ToastNotif({ items, onClose }: { items: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-80">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-4 duration-300",
            item.type === "announce"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-card border-border text-foreground"
          )}
        >
          {item.type === "announce" ? (
            <Megaphone className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
          ) : (
            <BellRing className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
          )}
          <p className="text-sm flex-1 leading-snug">{item.message}</p>
          <button onClick={() => onClose(item.id)} className="opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Announce Modal ───────────────────────────────────────────────────────────
function AnnounceModal({ onSend, onClose }: { onSend: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-foreground">Kirim Pengumuman</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Pesan akan muncul di semua halaman pengunjung selama 5 detik disertai suara notifikasi.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ketik pengumuman..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              Batal
            </button>
            <button
              onClick={() => { if (text.trim()) { onSend(text.trim()); onClose(); } }}
              disabled={!text.trim()}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              Kirim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginForm({ onLogin, error }: { onLogin: (pw: string) => void; error?: boolean }) {
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={`${BASE}logo.png`} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-4 rounded-2xl" />
          <h1 className="text-2xl font-bold text-foreground">Vireon Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Admin Dashboard</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <form onSubmit={(e) => { e.preventDefault(); if (pw.trim()) onLogin(pw); }} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Kode Akses</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Masukkan kode..."
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" /> Kode salah. Coba lagi.
              </div>
            )}
            <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" /> Masuk
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [password, setPassword] = useState<string | null>(null);
  const [wrongPw, setWrongPw] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastCounter = useRef(0);

  const addToast = useCallback((message: string, type: ToastItem["type"]) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const { sessions, messages, connected, authed, error, newMsgNotif, announcement,
    sendMessage, acceptSession, closeSession, sendAnnouncement } =
    useAdminChat(password ?? "", selectedId);

  // Wrong password
  useEffect(() => {
    if (error === "Wrong password") setWrongPw(true);
  }, [error]);

  // New message notification
  const prevNotif = useRef<typeof newMsgNotif>(null);
  useEffect(() => {
    if (!newMsgNotif) return;
    if (prevNotif.current?.sessionId === newMsgNotif.sessionId &&
      prevNotif.current?.sessionStatus === newMsgNotif.sessionStatus) return;
    prevNotif.current = newMsgNotif;
    playNotif();
    const sess = sessions.find((s) => s.id === newMsgNotif.sessionId);
    const label = sess ? `Visitor #${sess.id}` : `Sesi baru`;
    const status = newMsgNotif.sessionStatus === "pending" ? " (menunggu accept)" : "";
    addToast(`💬 Pesan baru dari ${label}${status}`, "message");
  }, [newMsgNotif, sessions, addToast]);

  // Announcement on admin side too
  const prevAnnounce = useRef<string | null>(null);
  useEffect(() => {
    if (!announcement || announcement.content === prevAnnounce.current) return;
    prevAnnounce.current = announcement.content;
    addToast(`📢 ${announcement.content}`, "announce");
  }, [announcement, addToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedId !== null) {
      inputRef.current?.focus();
      setSidebarOpen(false);
    }
  }, [selectedId]);

  if (!password || wrongPw) {
    return <LoginForm onLogin={(pw) => { setPassword(pw); setWrongPw(false); }} error={wrongPw} />;
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Menghubungkan...</p>
        </div>
      </div>
    );
  }

  const selectedSession = sessions.find((s) => s.id === selectedId);
  const pendingSessions = sessions.filter((s) => s.status === "pending");
  const activeSessions = sessions.filter((s) => s.status === "active");
  const closedSessions = sessions.filter((s) => s.status === "closed");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedId) return;
    sendMessage(trimmed);
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const SessionItem = ({ session }: { session: (typeof sessions)[0] }) => {
    const isSelected = session.id === selectedId;
    const hasNew = newMsgNotif?.sessionId === session.id && !isSelected;
    const statusColor = session.status === "pending"
      ? "text-amber-600" : session.status === "active" ? "text-green-600" : "text-muted-foreground";
    const statusIcon = session.status === "pending"
      ? <Circle className="w-2 h-2 fill-amber-400" />
      : session.status === "active"
      ? <Circle className="w-2 h-2 fill-green-500" />
      : <CheckCircle className="w-2 h-2" />;
    const statusLabel = session.status === "pending" ? "Menunggu" : session.status === "active" ? "Aktif" : "Ditutup";

    return (
      <button
        key={session.id}
        onClick={() => setSelectedId(session.id)}
        className={cn(
          "w-full px-3 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/30 flex items-start gap-3",
          isSelected && "bg-primary/5 border-l-2 border-l-primary"
        )}
      >
        <div className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
          session.status === "pending" ? "bg-amber-100 text-amber-700"
          : session.status === "active" ? "bg-green-100 text-green-700"
          : "bg-muted text-muted-foreground"
        )}>
          {session.visitorId.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm font-semibold text-foreground truncate">Visitor #{session.id}</span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTime(session.lastMessageAt)}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{session.lastMessage ?? "Belum ada pesan"}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={cn("text-[10px] flex items-center gap-1", statusColor)}>{statusIcon} {statusLabel}</span>
            {hasNew && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </div>
        </div>
        <ChevronRight className={cn("w-4 h-4 text-muted-foreground/30 flex-shrink-0 mt-1", isSelected && "text-primary")} />
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Percakapan</span>
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">{sessions.length}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Inbox className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="text-xs text-muted-foreground">Belum ada percakapan</p>
          </div>
        ) : (
          <>
            {pendingSessions.length > 0 && (
              <>
                <div className="px-3 py-2 bg-amber-50/50 border-b border-amber-100">
                  <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                    <Circle className="w-2 h-2 fill-amber-400" /> Menunggu Accept ({pendingSessions.length})
                  </span>
                </div>
                {pendingSessions.map((s) => <SessionItem key={s.id} session={s} />)}
              </>
            )}
            {activeSessions.length > 0 && (
              <>
                <div className="px-3 py-2 bg-green-50/50 border-b border-green-100">
                  <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1">
                    <Circle className="w-2 h-2 fill-green-500" /> Aktif ({activeSessions.length})
                  </span>
                </div>
                {activeSessions.map((s) => <SessionItem key={s.id} session={s} />)}
              </>
            )}
            {closedSessions.length > 0 && (
              <>
                <div className="px-3 py-2 border-b border-border/30">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Ditutup ({closedSessions.length})</span>
                </div>
                {closedSessions.map((s) => <SessionItem key={s.id} session={s} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ToastNotif items={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      {showAnnounce && <AnnounceModal onSend={sendAnnouncement} onClose={() => setShowAnnounce(false)} />}

      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-card/90 backdrop-blur px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-4 h-4" />
          </button>
          <img src={`${BASE}logo.png`} alt="Logo" className="w-7 h-7 object-contain rounded-lg hidden sm:block" />
          <div>
            <span className="font-bold text-foreground text-sm">Vireon Projects</span>
            <span className="text-muted-foreground text-xs ml-1.5 hidden sm:inline">Admin</span>
          </div>
          <div className={cn("flex items-center gap-1.5 text-xs px-2 py-1 rounded-full", connected ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500")}>
            <span className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            <span className="hidden sm:inline">{connected ? "Online" : "Offline"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingSessions.length > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-semibold">
              <Bell className="w-3.5 h-3.5" />
              {pendingSessions.length} Pending
            </span>
          )}
          <button
            onClick={() => setShowAnnounce(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors"
            title="Kirim Pengumuman"
          >
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Announce</span>
          </button>
          <button
            onClick={() => setPassword(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "bg-card border-r border-border flex flex-col flex-shrink-0 transition-transform duration-300 z-20",
          "fixed lg:relative inset-y-14 lg:inset-auto w-72",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <SidebarContent />
        </aside>

        {/* Chat Panel */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {selectedId === null ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
              <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-primary/30" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Pilih Percakapan</h2>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Pilih dari daftar di kiri. Percakapan <span className="text-amber-600 font-medium">pending</span> harus di-accept dulu sebelum bisa dibalas.
              </p>
              {pendingSessions.length > 0 && (
                <button
                  onClick={() => { setSidebarOpen(true); }}
                  className="mt-6 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-700 text-sm font-medium hover:bg-amber-500/20 transition-colors flex items-center gap-2"
                >
                  <Bell className="w-4 h-4 animate-bounce" />
                  {pendingSessions.length} sesi menunggu accept
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="border-b border-border bg-card/80 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                <button
                  className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => { setSelectedId(null); setSidebarOpen(true); }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                  selectedSession?.status === "pending" ? "bg-amber-100 text-amber-700"
                  : selectedSession?.status === "active" ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
                )}>
                  {selectedSession?.visitorId.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">Visitor #{selectedId}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedSession ? new Date(selectedSession.createdAt).toLocaleString("id-ID") : "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedSession?.status === "pending" && (
                    <button
                      onClick={() => acceptSession(selectedId)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-all shadow-sm shadow-green-200 active:scale-95"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Accept</span>
                    </button>
                  )}
                  {selectedSession?.status === "active" && (
                    <button
                      onClick={() => closeSession(selectedId)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Tutup</span>
                    </button>
                  )}
                  {selectedSession?.status === "closed" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Ditutup
                    </span>
                  )}
                </div>
              </div>

              {/* Pending Banner */}
              {selectedSession?.status === "pending" && (
                <div className="mx-4 mt-4 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800">Sesi Menunggu Accept</p>
                    <p className="text-xs text-amber-600">Klik tombol Accept untuk mulai membalas pesan pengunjung ini.</p>
                  </div>
                  <button
                    onClick={() => acceptSession(selectedId)}
                    className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">Belum ada pesan.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={cn("flex gap-2", msg.sender === "admin" ? "justify-end" : "justify-start")}>
                      {msg.sender === "visitor" && (
                        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0 self-end">V</div>
                      )}
                      <div className="flex flex-col max-w-[75%] sm:max-w-[60%]">
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                          msg.sender === "admin"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card border border-border text-foreground rounded-bl-sm"
                        )}>
                          {msg.content}
                        </div>
                        <span className={cn("text-[10px] text-muted-foreground mt-1", msg.sender === "admin" ? "text-right" : "text-left")}>
                          {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {msg.sender === "admin" && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0 self-end">A</div>
                      )}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {selectedSession?.status === "active" ? (
                <div className="p-3 border-t border-border bg-card/80 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Ketik balasan..."
                      className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : selectedSession?.status === "pending" ? (
                <div className="p-4 border-t border-border bg-card/80 flex-shrink-0">
                  <button
                    onClick={() => acceptSession(selectedId)}
                    className="w-full py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <UserCheck className="w-5 h-5" /> Accept & Mulai Chat
                  </button>
                </div>
              ) : (
                <div className="p-4 border-t border-border bg-card/80 flex-shrink-0">
                  <div className="text-center text-sm text-muted-foreground py-2">Sesi ini sudah ditutup.</div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
