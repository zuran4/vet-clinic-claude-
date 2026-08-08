import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, ArrowLeft, ChevronLeft, Send, Mail, MessageCircle } from "lucide-react";

const CHANNEL_ICON = { email: Mail, whatsapp: MessageCircle };
const CHANNEL_COLOR = { email: "text-indigo-500", whatsapp: "text-emerald-500" };
const CHANNEL_FILTERS = [
  { key: "all", label: "Όλα", icon: null },
  { key: "email", label: "Email", icon: Mail },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];
import dayjs from "dayjs";

import { getConversations, getThread, sendReply } from "../api/messagesApi";
import { useRealtimeSync } from "../hooks/useRealtimeSync";

function MessagesPage({ onClose }) {
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selected, setSelected] = useState(null);
  const [channelFilter, setChannelFilter] = useState("all");
  const [thread, setThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const loadConversations = useCallback(() => {
    setLoadingList(true);
    getConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  const loadThread = useCallback((counterpart) => {
    setLoadingThread(true);
    getThread(counterpart)
      .then((msgs) => {
        setThread(msgs);
        setConversations((prev) =>
          prev.map((c) => (c.counterpart === counterpart ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch(() => {})
      .finally(() => setLoadingThread(false));
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useRealtimeSync({
    messages: () => {
      loadConversations();
      setSelected((current) => {
        if (current) loadThread(current);
        return current;
      });
    },
  });

  const handleSelect = (counterpart) => {
    setSelected(counterpart);
    loadThread(counterpart);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selected) return;

    setSending(true);
    setSendError("");
    try {
      const saved = await sendReply(selected, replyText.trim());
      setThread((prev) => [...prev, saved]);
      setReplyText("");
      loadConversations();
    } catch (err) {
      setSendError(err.message || "Αποτυχία αποστολής απάντησης.");
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.counterpart === selected);

  const unreadByChannel = conversations.reduce((acc, c) => {
    acc[c.channel] = (acc[c.channel] || 0) + (c.unreadCount || 0);
    return acc;
  }, {});

  const filteredConversations =
    channelFilter === "all" ? conversations : conversations.filter((c) => c.channel === channelFilter);

  return (
    <div>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-400 rounded-2xl px-5 py-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-white">
            <MessageSquare className="w-5 h-5" />
            <span className="text-lg font-bold">Μηνύματα</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Επιστροφή
          </button>
        </div>
      </div>

      {/* Φίλτρο καναλιού */}
      <div className="flex items-center gap-2 mb-4">
        {CHANNEL_FILTERS.map((f) => {
          const Icon = f.icon;
          const active = channelFilter === f.key;
          const unread = f.key === "all"
            ? Object.values(unreadByChannel).reduce((s, n) => s + n, 0)
            : unreadByChannel[f.key] || 0;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setChannelFilter(f.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 dark:bg-win-elevated text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-win-elevated2"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {f.label}
              {unread > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                    active ? "bg-white/25 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 h-[70vh] min-h-[420px]">
        {/* Λίστα συνομιλιών */}
        <div
          className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 flex-shrink-0 bg-white dark:bg-win-surface border border-gray-100 dark:border-win-border rounded-2xl overflow-hidden`}
        >
          <div className="overflow-y-auto flex-1">
            {loadingList && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-win-elevated animate-pulse" />
                ))}
              </div>
            )}

            {!loadingList && filteredConversations.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 px-4">
                {conversations.length === 0 ? "Δεν υπάρχουν μηνύματα ακόμα." : "Δεν υπάρχουν μηνύματα σε αυτό το κανάλι."}
              </p>
            )}

            {!loadingList &&
              filteredConversations.map((c) => {
                const ChannelIcon = CHANNEL_ICON[c.channel] || Mail;
                return (
                <button
                  key={`${c.channel}:${c.counterpart}`}
                  type="button"
                  onClick={() => handleSelect(c.counterpart)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-win-border/60 hover:bg-gray-50 dark:hover:bg-win-elevated transition-colors ${
                    selected === c.counterpart ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                      <ChannelIcon className={`w-3.5 h-3.5 flex-shrink-0 ${CHANNEL_COLOR[c.channel] || "text-gray-400"}`} />
                      <span className="truncate">{c.customerName || c.counterpartName || c.counterpart}</span>
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex-shrink-0">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                    {c.lastSubject || "(χωρίς θέμα)"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 truncate mt-0.5">
                    {c.lastDirection === "outbound" ? "Εσείς: " : ""}
                    {c.lastText}
                  </p>
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                    {dayjs(c.lastReceivedAt).format("DD/MM HH:mm")}
                  </p>
                </button>
                );
              })}
          </div>
        </div>

        {/* Thread */}
        <div
          className={`${selected ? "flex" : "hidden md:flex"} flex-col flex-1 bg-white dark:bg-win-surface border border-gray-100 dark:border-win-border rounded-2xl overflow-hidden`}
        >
          {!selected && (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Επίλεξε μια συνομιλία
            </div>
          )}

          {selected && (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-win-border flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="md:hidden p-1 -ml-1 text-gray-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {(() => {
                  const ChannelIcon = CHANNEL_ICON[selectedConv?.channel] || Mail;
                  return <ChannelIcon className={`w-4 h-4 flex-shrink-0 ${CHANNEL_COLOR[selectedConv?.channel] || "text-indigo-500"}`} />;
                })()}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {selectedConv?.customerName || selectedConv?.counterpartName || selected}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{selected}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingThread && <p className="text-sm text-gray-400 text-center py-8">Φόρτωση...</p>}
                {!loadingThread &&
                  thread.map((m) => (
                    <div key={m._id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.direction === "outbound"
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 dark:bg-win-elevated text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {m.subject && (
                          <p
                            className={`text-xs font-semibold mb-1 ${
                              m.direction === "outbound" ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {m.subject}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            m.direction === "outbound" ? "text-white/60" : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {dayjs(m.receivedAt).format("DD/MM/YYYY HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              <form onSubmit={handleReply} className="border-t border-gray-100 dark:border-win-border p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Γράψε απάντηση..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-win-border-light bg-white dark:bg-win-elevated text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:text-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" /> {sending ? "..." : "Αποστολή"}
                  </button>
                </div>
                {sendError && <p className="text-xs text-red-500 mt-1.5">{sendError}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
