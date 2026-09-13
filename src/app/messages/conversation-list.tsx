
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Plus, X, Search } from "lucide-react";
import Avatar from "@/components/avatar";

interface ConversationItem {
  id: string;
  other_user: { id: string; full_name: string; role: string } | null;
  last_message: { content: string; created_at: string; sender_id: string } | null;
}

interface Contact {
  id: string;
  full_name: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  parent: "Elternteil",
  teacher: "Lehrkraft",
  admin: "Verwaltung",
};

export default function ConversationList({
  conversations,
  availableContacts,
  userId,
}: {
  conversations: ConversationItem[];
  availableContacts: Contact[];
  userId: string;
}) {
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const filteredContacts = availableContacts.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  async function startConversation(contactId: string) {
    setCreating(true);
    const supabase = createClient();

    const { data: conv } = await supabase
      .from("conversations")
      .insert({})
      .select("id")
      .single();

    if (conv) {
      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: userId },
        { conversation_id: conv.id, user_id: contactId },
      ]);

      router.push(`/messages/${conv.id}`);
    }

    setCreating(false);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1) return "Gestern";
    if (diffDays < 7) {
      return date.toLocaleDateString("de-DE", { weekday: "short" });
    }
    return date.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nachrichten</h1>
          <p className="text-gray-500 text-sm mt-1">
            Direkter Austausch mit Lehrkraeften und Eltern
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-rose-600 transition"
        >
          {showNew ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showNew ? "Abbrechen" : "Neue Nachricht"}
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition text-gray-900"
              placeholder="Name suchen..."
              autoFocus
            />
          </div>

          {filteredContacts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              Keine weiteren Kontakte verfuegbar.
            </p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => startConversation(contact.id)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition text-left disabled:opacity-50"
                >
                  <Avatar name={contact.full_name} />
                  <div>
                    <div className="font-medium text-gray-900">
                      {contact.full_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {roleLabels[contact.role] || contact.role}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {conversations.length === 0 && !showNew ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">Noch keine Nachrichten.</p>
          <p className="text-gray-300 text-sm mt-1">
            Starte eine neue Unterhaltung!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-gray-200 transition"
            >
              <Avatar name={conv.other_user?.full_name || "?"} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    {conv.other_user?.full_name || "Unbekannt"}
                  </span>
                  {conv.last_message && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTime(conv.last_message.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {roleLabels[conv.other_user?.role || ""] || ""}
                  </span>
                  {conv.last_message && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-500 truncate">
                        {conv.last_message.sender_id === userId ? "Du: " : ""}
                        {conv.last_message.content}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
