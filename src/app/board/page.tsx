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

  const { data: posts } = await supabase
    .from("board_posts")
    .select("*, author:profiles(full_name, role)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={profile.full_name} userRole={profile.role} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <BoardClient
          posts={posts || []}
          userRole={profile.role}
          userId={user.id}
        />
      </main>
    </div>
  );
}
