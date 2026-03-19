import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Megaphone } from "lucide-react";
import { useVisitorChat } from "@/hooks/use-chat-ws";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL;

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem("visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("visitor_id", id);
  }
  return id;
}

function playNotif() {
  try {
    const audio = new Audio(`${BASE}notif.mp3`);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch {}
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [visitorId] = useState(getOrCreateVisitorId);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [announceText, setAnnounceText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, session, connected, announcement, sendMessage } = useVisitorChat(visitorId);

  // Show announcement
  const prevAnnounce = useRef<string | null>(null);
  useEffect(() => {
    if (!announcement || announcement.content === prevAnnounce.current) return;
    prevAnnounce.current = announcement.content;
    setAnnounceText(announcement.content);
    setShowAnnounce(true);
    playNotif();
    setTimeout(() => setShowAnnounce(false), 5000);
  }, [announcement]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Notify on admin reply
  const prevCount = useRef(0);
  useEffect(() => {
    const adminCount = messages.filter((m) => m.sender === "admin").length;
    if (adminCount > prevCount.current && !open) {
      playNotif();
    }
    prevCount.current = adminCount;
  }, [messages, open]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !connected) return;
    sendMessage(trimmed);
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isPending = session?.status === "pending";
  const isClosed = session?.status === "closed";
  const newAdminCount = messages.filter((m) => m.sender === "admin").length;

  return (
    <>
      {/* Announcement Banner */}
      {showAnnounce && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90vw] max-w-md animate-in slide-in-from-top-4 duration-300">
          <div className="bg-amber-500 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3">
            <Megaphone className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-0.5">Pengumuman</p>
              <p className="text-sm font-medium leading-snug">{announceText}</p>
            </div>
            <button onClick={() => setShowAnnounce(false)} className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="w-[calc(100vw-2rem)] sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200 max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <img src={`${BASE}logo.png`} alt="Logo" className="w-7 h-7 object-contain rounded-lg bg-white/10 p-0.5" />
                <div>
                  <p className="font-bold text-sm leading-tight">Vireon Projects</p>
                  <div className="flex items-center gap-1.5">
                    {connected ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse inline-block" />
                        <span className="text-xs opacity-80">
                          {isPending ? "Menunggu admin..." : isClosed ? "Sesi ditutup" : "Admin online"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-300 inline-block" />
                        <span className="text-xs opacity-80">Menghubungkan...</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pending Banner */}
            {isPending && messages.length === 0 && (
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-xs text-amber-700">Kirim pesan pertama — admin akan segera merespons!</p>
              </div>
            )}
            {isPending && messages.length > 0 && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-center">
                <p className="text-xs text-amber-700">⏳ Menunggu admin menerima percakapan...</p>
              </div>
            )}
            {isClosed && (
              <div className="px-4 py-2 bg-muted border-b border-border text-center">
                <p className="text-xs text-muted-foreground">Percakapan ini telah ditutup oleh admin.</p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-background/40 min-h-48">
              {messages.length === 0 && !isPending && (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">Halo! Ada yang bisa kami bantu?</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-2", msg.sender === "visitor" ? "justify-end" : "justify-start")}>
                  {msg.sender === "admin" && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold flex-shrink-0 self-end">A</div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words",
                    msg.sender === "visitor"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}>
                    {msg.content}
                    <div className={cn("text-[9px] mt-0.5 opacity-60", msg.sender === "visitor" ? "text-right" : "text-left")}>
                      {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-2.5 border-t border-border bg-card flex-shrink-0">
              {!isClosed ? (
                <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={connected ? "Ketik pesan..." : "Menghubungkan..."}
                    disabled={!connected}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !connected}
                    className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-center text-xs text-muted-foreground py-1.5">Sesi ditutup</div>
              )}
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
          style={{ width: "52px", height: "52px" }}
        >
          {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
          {!open && newAdminCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {newAdminCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
