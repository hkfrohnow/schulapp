import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import BoardClient from "./board-client";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  let postsQuery = supabase
    .from("board_posts")
    .select("*, author:profiles(full_name, role)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (profile.role === "parent") {
    postsQuery = postsQuery.eq("is_public", true);
  }

  const { data: posts } = await postsQuery;

  const postIds = (posts || []).map((p: { id: string }) => p.id);
  let comments: Array<{
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author: { full_name: string } | null;
  }> = [];

  if (postIds.length > 0) {
    const { data } = await supabase
      .from("board_comments")
      .select("*, author:profiles!author_id(full_name)")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });
    comments = (data || []).map((c) => ({
      ...c,
      author: c.author as unknown as { full_name: string } | null,
    }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={profile.full_name} userRole={profile.role} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <BoardClient
          posts={posts || []}
          comments={comments}
          userRole={profile.role}
          userId={user.id}
        />
      </main>
    </div>
  );
}
