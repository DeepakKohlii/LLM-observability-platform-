import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import axios from "axios";
import { sendChat } from "../../services/chat";
import { sendGuestChat } from "../../services/guest";
import type { ChatMessage, ChatSettings } from "../../types/chat";
import { formatTraceCost } from "../../utils/format";
import type { UserMode } from "../../types/navigation";

interface Props {
  mode: UserMode;
  settings: ChatSettings;
  isConfigured: boolean;
  guestId?: string;
  callsRemaining?: number;
  onTraceLogged?: () => void;
  onGuestUpdated?: () => void;
  onUpgrade?: () => void;
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ChatPanel({
  mode,
  settings,
  isConfigured,
  guestId,
  callsRemaining = 0,
  onTraceLogged,
  onGuestUpdated,
  onUpgrade,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const welcomeMessage =
      mode === "guest"
        ? `Try llm_observe with ${callsRemaining} free API call${callsRemaining === 1 ? "" : "s"} left. Each message is logged — open Dashboard to watch your graphs update in real time.`
        : "Send a message to call your LLM provider. Each request is logged automatically — switch to Dashboard to see updated graphs and traces.";

    if (!initialized.current) {
      initialized.current = true;
      setMessages([
        { id: "welcome", role: "assistant", content: welcomeMessage },
      ]);
      return;
    }

    setMessages((prev) => {
      if (prev.length === 0 || prev[0].id !== "welcome") return prev;
      const next = [...prev];
      next[0] = { ...next[0], content: welcomeMessage };
      return next;
    });
  }, [mode, callsRemaining]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const canSend =
    mode === "guest" ? callsRemaining > 0 : isConfigured;

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || sending) return;

    if (mode === "guest" && callsRemaining <= 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "error",
          content:
            "You've used all 5 guest calls. Add your own API key to keep going.",
        },
      ]);
      scrollToBottom();
      return;
    }

    if (mode === "full" && !isConfigured) {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "error",
          content:
            "Configure your provider and API key in the panel on the right first.",
        },
      ]);
      scrollToBottom();
      return;
    }

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: "user", content: prompt },
    ]);
    setSending(true);
    scrollToBottom();

    try {
      const result =
        mode === "guest" && guestId
          ? await sendGuestChat(guestId, prompt)
          : await sendChat(settings, prompt);

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: result.response,
          meta: {
            model: result.model,
            latency_ms: result.latency_ms,
            cost_usd: result.cost_usd,
          },
        },
      ]);
      onTraceLogged?.();
      if (mode === "guest") onGuestUpdated?.();
    } catch (err) {
      let message = "Request failed";
      if (axios.isAxiosError(err)) {
        message =
          (err.response?.data as { detail?: string })?.detail ?? err.message;
      }
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "error", content: message },
      ]);
      onTraceLogged?.();
      if (mode === "guest") onGuestUpdated?.();
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const placeholder =
    mode === "guest"
      ? callsRemaining > 0
        ? `Ask anything… (${callsRemaining} guest call${callsRemaining === 1 ? "" : "s"} left)`
        : "Guest limit reached — add your API key →"
      : isConfigured
        ? "Ask anything… (Enter to send, Shift+Enter for newline)"
        : "Add your API key in settings →";

  return (
    <div className="chat-panel">
      {mode === "guest" && (
        <div className="guest-banner">
          <span className="guest-badge">guest mode</span>
          <span>
            {callsRemaining > 0
              ? `${callsRemaining} of 5 free calls remaining`
              : "No free calls left"}
          </span>
          {callsRemaining <= 0 && onUpgrade && (
            <button type="button" className="guest-upgrade-btn" onClick={onUpgrade}>
              use your API key →
            </button>
          )}
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble chat-bubble--${msg.role}`}>
            <div className="chat-bubble-label">
              {msg.role === "user"
                ? "you"
                : msg.role === "error"
                  ? "error"
                  : "assistant"}
            </div>
            <div className="chat-bubble-text">{msg.content}</div>
            {msg.meta && (
              <div className="chat-bubble-meta">
                {msg.meta.model} · {msg.meta.latency_ms}ms ·{" "}
                {formatTraceCost(msg.meta.cost_usd)}
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="chat-bubble chat-bubble--assistant">
            <div className="chat-bubble-label">assistant</div>
            <div className="chat-bubble-text chat-typing">
              <span>thinking</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          rows={2}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={sending || !canSend}
        />
        <button
          type="button"
          className="chat-send-btn"
          onClick={() => void handleSend()}
          disabled={sending || !input.trim() || !canSend}
        >
          {sending ? "…" : "send →"}
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;
