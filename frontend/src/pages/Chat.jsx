// Copyright © 2026 Jorge Vinagre
// SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../utils/apiFetch";
import toast from "react-hot-toast";
import {
  Plus, Trash2, Send, MessageSquare, ChevronDown, Check, Bot, User, Loader2, Square
} from "lucide-react";
import ReactMarkdown from "react-markdown";


// ── Client selector ────────────────────────────────────────────────────────
function ClientSelector({ clients, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const ref = useRef(null);
  const selectedClient = clients.find(c => c.id === selected);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedClient ? (
          <>
            {selectedClient.logo_url ? (
              <img src={selectedClient.logo_url} alt="Client selector" className="w-4 h-4 rounded object-cover" style={{ width: "1rem", height: "1rem", borderRadius: "4px" }} aria-hidden="true" />
            ) : (
              <div className="w-4 h-4 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold" aria-hidden="true">
                {selectedClient.client_name[0].toUpperCase()}
              </div>
            )}
            <span className="max-w-[120px] truncate">{selectedClient.client_name}</span>
          </>
        ) : (
          <span>{t("chat.noClient") || "No client"}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("chat.selectClient") || "Select client"}
          className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
        >
          <button
            role="option"
            aria-selected={!selected}
            onClick={(e) => { e.stopPropagation(); onSelect(null); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {t("chat.noClient") || "No client"}
            {!selected && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
          </button>
          <div className="border-t border-gray-100" />
          {clients.map(c => (
            <button
              key={c.id}
              role="option"
              aria-selected={selected === c.id}
              onClick={() => { onSelect(c.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              {c.logo_url ? (
                <img src={c.logo_url} alt="Client selector opened" className="w-5 h-5 rounded object-cover flex-shrink-0" style={{ width: "1.25rem", height: "1.25rem", borderRadius: "4px" }} aria-hidden="true" />
              ) : (
                <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0" aria-hidden="true">
                  {c.client_name[0].toUpperCase()}
                </div>
              )}
              <span className="flex-1 text-left truncate text-gray-700">{c.client_name}</span>
              {selected === c.id && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────
function MessageBubble({ role, content, isStreaming }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-primary" : "bg-gray-100"
        }`}
        aria-hidden="true"
      >
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-primary" />
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <span>{content}</span>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 prose-strong:font-semibold prose-code:text-xs">
            {content}
          </ReactMarkdown>
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyChat({ onSuggestion }) {
  const { t } = useTranslation();
  const suggestions = [
    t("chat.suggestion1") || "Give me a content strategy for a fitness brand",
    t("chat.suggestion2") || "Write 5 Instagram captions for a coffee shop",
    t("chat.suggestion3") || "What are the best posting times for LinkedIn?",
    t("chat.suggestion4") || "Create a 30-day content calendar outline",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
          <Bot className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {t("chat.emptyTitle") || "How can I help you today?"}
        </h2>
        <p className="text-sm text-gray-500 max-w-sm">
          {t("chat.emptySubtitle") || "Ask me anything about content strategy, copywriting or social media."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s)}
            className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/4 transition-all leading-relaxed"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Chat component ────────────────────────────────────────────────────
export default function Chat() {
  const { clients } = useOutletContext();
  const { t } = useTranslation();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const data = await apiFetch("/chat/sessions");
      setSessions(data || []);
      if (data?.length > 0) {
        setActiveSessionId(data[0].id);
        const messages = await apiFetch(`/chat/session/${data[0].id}/messages`);
        setMessages(messages || []);
      }
    } catch {
      toast.error(t("chat.errorLoadingSessions") || "Could not load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const selectSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    setMessages([]);
    try {
      const data = await apiFetch(`/chat/session/${sessionId}/messages`);
      setMessages(data || []);
    } catch {
      toast.error(t("chat.errorLoadingMessages") || "Could not load messages");
    }
  };

  const createSession = async (clientId = null) => {
    try {
      const session = await apiFetch("/chat/session", {
        method: "POST",
        body: JSON.stringify({ client_id: clientId ?? selectedClientId ?? null }),
      });
      setSessions(prev => [session, ...prev]);
      setActiveSessionId(session.id);
      setMessages([]);
      inputRef.current?.focus();
      return session.id;
    } catch (e) {
      toast.error(t("chat.errorCreatingSession") || "Could not create session");
    }
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      const data = await apiFetch(`/chat/sessions/${sessionId}`, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch {
      toast.error(t("chat.errorDeletingSession") || "Could not delete session");
    }
  };

  const readerRef = useRef(null);

  const stopStreaming = () => {
    readerRef.current?.cancel();
    setStreaming(false);
    setMessages(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        isStreaming: false,
      };
      return updated;
    });
  };

  const sendMessage = useCallback(async (text, sessionIdOverride) => {
    const content = text || input.trim();
    const sessionId = sessionIdOverride || activeSessionId;
    if (!content || streaming) return;
    if (!sessionId) {
      toast.error(t("chat.noSession") || "Create a session first");
      return;
    }

    setInput("");
    setMessages(prev => [...prev, { role: "user", content }]);
    setStreaming(true);

    // Add empty assistant message to stream into
    setMessages(prev => [...prev, { role: "assistant", content: "", isStreaming: true }]);

    try {
      const data = await apiFetch(`/chat/session/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: content }),
        raw: true,
      });

      const reader = data.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        try {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fullContent, isStreaming: true };
            return updated;
          });
        } catch {
          break;
        }
      }

      // Mark streaming done
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: fullContent, isStreaming: false };
        return updated;
      });

    } catch {
      toast.error(t("chat.errorSending") || "Could not send message");
      setMessages(prev => prev.slice(0, -1)); // Remove empty assistant bubble
    } finally {
      setStreaming(false);
    }
  }, [input, activeSessionId, streaming]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatSessionDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t("chat.today") || "Today";
    if (diffDays === 1) return t("chat.yesterday") || "Yesterday";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex h-screen -m-4 md:-m-8 overflow-hidden">

      {/* ── Sessions sidebar ── */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col hidden md:flex">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">{t("chat.conversations") || "Conversations"}</h2>
          <button
            onClick={() => createSession()}
            aria-label={t("chat.newChat") || "New chat"}
            className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/8 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 px-4">
              {t("chat.noSessions") || "No conversations yet"}
            </p>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                onClick={() => selectSession(session.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && selectSession(session.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                  activeSessionId === session.id
                    ? "bg-primary/8 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {(() => {
                  const client = session.client_id ? clients.find(c => c.id === session.client_id) : null;
                  return client ? (
                    client.logo_url ? (
                      <img src={client.logo_url} alt="Sessions list" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {client.client_name[0].toUpperCase()}
                      </div>
                    )
                  ) : (
                    <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {session.client_id
                      ? clients.find(c => c.id === session.client_id)?.client_name || t("chat.unknownClient") || "Client"
                      : t("chat.generalChat") || "General chat"
                    }
                  </p>
                  <p className="text-xs text-gray-400">{formatSessionDate(session.created_at)}</p>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  aria-label={t("chat.deleteSession") || "Delete conversation"}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => createSession()}
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/8 transition-colors"
              aria-label={t("chat.newChat") || "New chat"}
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Logo of the active client */}
            {activeSessionId && selectedClientId && (() => {
              const client = clients.find(c => c.id === selectedClientId);
              if (!client) return null;
              return client.logo_url ? (
                <img src={client.logo_url} alt="Logo of the client in the selections list" className="w-6 h-6 rounded-lg object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {client.client_name[0].toUpperCase()}
                </div>
              );
            })()}

            <span className="text-sm font-medium text-gray-700">
              {activeSessionId
                ? t("chat.aiAssistant") || "AI Assistant"
                : t("chat.selectOrCreate") || "Select or create a conversation"
              }
            </span>
          </div>

          <ClientSelector
            clients={clients}
            selected={selectedClientId}
            onSelect={async (id) => {
              setSelectedClientId(id);
              const existing = sessions.find(s => s.client_id === id);
              if (existing) {
                await selectSession(existing.id);
              } else {
                await createSession(id);
              }
            }}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50/50">
          {!activeSessionId ? (
            <EmptyChat onSuggestion={async (s) => {
              const sessionId = await createSession();
              if (sessionId) sendMessage(s, sessionId);
            }} />
          ) : messages.length === 0 ? (
            <EmptyChat onSuggestion={(s) => sendMessage(s)} />
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={i}
                role={msg.role}
                content={msg.content}
                isStreaming={msg.isStreaming}
              />
            ))
          )}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
          <div className={`flex items-end gap-2 bg-white border rounded-2xl px-4 py-3 transition-all ${
            streaming ? "border-gray-200" : "border-gray-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10"
          }`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.placeholder") || "Ask anything about content strategy, copywriting…"}
              rows={1}
              disabled={streaming || !activeSessionId}
              aria-label={t("chat.placeholder") || "Message input"}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-900 placeholder-gray-400 leading-relaxed max-h-32 disabled:opacity-50 my-auto"
              style={{ fieldSizing: "content" }}
            />
            <button
              onClick={() => streaming ? stopStreaming() : sendMessage()}
              disabled={!streaming && (!input.trim() || !activeSessionId)}
              className="p-2 rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              {streaming
                ? <Square className="w-4 h-4" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            {t("chat.enterToSend") || "Enter to send · Shift+Enter for new line"}
          </p>
        </div>
      </div>
    </div>
  );
}
