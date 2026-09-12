"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Pin, Plus, Trash2, X } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  pinned: boolean;
  created_at: string;
  author: { full_name: string; role: string } | null;
}

export default function BoardClient({
  posts,
  userRole,
  userId,
}: {
  posts: Post[];
  userRole: UserRole;
  userId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("board_posts").insert({
      title,
      content,
      author_id: userId,
      pinned: false,
    });

    if (!error) {
      setTitle("");
      setContent("");
      setShowForm(false);
      router.refresh();
    }

    setSubmitting(false);
  }

  async function handleDelete(postId: string) {
    await supabase.from("board_posts").delete().eq("id", postId);
    router.refresh();
  }

  async function togglePin(postId: string, currentPinned: boolean) {
    await supabase
      .from("board_posts")
      .update({ pinned: !currentPinned })
      .eq("id", postId);
    router.refresh();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const roleLabels: Record<string, string> = {
    parent: "Elternteil",
    teacher: "Lehrkraft",
    admin: "Verwaltung",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schwarzes Brett</h1>
          <p className="text-gray-500 text-sm mt-1">
            Infos und Ankuendigungen fuer alle
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Abbrechen" : "Neuer Beitrag"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titel
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-gray-900"
              placeholder="Worum geht es?"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nachricht
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none text-gray-900"
              placeholder="Was moechtest du mitteilen?"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {submitting ? "Wird gepostet..." : "Veroeffentlichen"}
          </button>
        </form>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Noch keine Beitraege.</p>
          <p className="text-gray-300 text-sm mt-1">
            Sei der Erste und teile eine Info!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className={`bg-white rounded-2xl border shadow-sm p-6 ${
                post.pinned ? "border-indigo-200 bg-indigo-50/30" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {post.pinned && (
                      <Pin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    )}
                    <h2 className="font-semibold text-gray-900 truncate">
                      {post.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 whitespace-pre-wrap mt-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                    <span className="font-medium text-gray-500">
                      {post.author?.full_name || "Unbekannt"}
                    </span>
                    <span>·</span>
                    <span>{roleLabels[post.author?.role || ""] || ""}</span>
                    <span>·</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>

                {(post.author_id === userId || userRole === "admin") && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {userRole === "admin" && (
                      <button
                        onClick={() => togglePin(post.id, post.pinned)}
                        className={`p-2 rounded-lg transition ${
                          post.pinned
                            ? "text-indigo-500 hover:bg-indigo-50"
                            : "text-gray-300 hover:bg-gray-50 hover:text-gray-500"
                        }`}
                        title={post.pinned ? "Loesung aufheben" : "Anpinnen"}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Loeschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
