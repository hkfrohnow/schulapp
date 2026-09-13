"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/avatar";

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { full_name: string } | null;
}

const roleLabels: Record<string, string> = {
  parent: "Elternteil",
  teacher: "Lehrkraft",
  admin: "Verwaltung",
};

export default function ChatView({
  conversationId,
  messages: initialMessages,
  otherUser,
  userId,
}: {
  conversationId: string;
  messages: ChatMessage[];
  otherUser: { id: string; full_name: string; role: string } | null;
  userId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Echtzeit-Updates via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as ChatMessage;
          // Sender-Name nachladen
          if (newMsg.sender_id !== userId) {
            newMsg.sender = { full_name: otherUser?.full_name || "Unbekannt" };
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, otherUser]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const supabase = createClient();

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      sender: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
      })
      .select("*")
      .single();

    if (data) {
      // Echte Nachricht ersetzt optimistic
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? { ...data, sender: null } : m))
      );
    }

    setSending(false);
    inputRef.current?.focus();
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateHeader(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Heute";
    if (date.toDateString() === yesterday.toDateString()) return "Gestern";
    return date.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Nachrichten nach Tag gruppieren
  let lastDate = "";

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link
          href="/messages"
          className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Avatar name={otherUser?.full_name || "?"} />
        <div>
          <div className="font-semibold text-gray-900">
            {otherUser?.full_name || "Unbekannt"}
          </div>
          <div className="text-xs text-gray-400">
            {roleLabels[otherUser?.role || ""] || ""}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400">Noch keine Nachrichten.</p>
            <p className="text-gray-300 text-sm mt-1">
              Schreib die erste Nachricht!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          const msgDate = new Date(msg.created_at).toDateString();
          let showDateHeader = false;
          if (msgDate !== lastDate) {
            showDateHeader = true;
            lastDate = msgDate;
          }

          return (
            <div key={msg.id}>
              {showDateHeader && (
                <div className="flex justify-center my-4">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {formatDateHeader(msg.created_at)}
                  </span>
                </div>
              )}
              <div
                className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isMe
                      ? "bg-rose-500 text-white rounded-br-md"
                      : "bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {msg.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe ? "text-rose-200" : "text-gray-400"
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition text-gray-900"
            placeholder="Nachricht schreiben..."
            autoFocus
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
