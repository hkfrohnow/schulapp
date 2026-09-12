import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import ChatView from "./chat-view";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Pruefen ob Nutzer Teilnehmer ist
  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!participation) redirect("/messages");

  // Anderen Teilnehmer laden
  const { data: otherParticipant } = await supabase
    .from("conversation_participants")
    .select("user_id, user:profiles(id, full_name, role)")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id)
    .single();

  const otherUser = otherParticipant?.user as unknown as { id: string; full_name: string; role: string } | null;

  // Nachrichten laden
  const { data: messages } = await supabase
    .from("messages")
    .select("*, sender:profiles!sender_id(full_name)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation userName={profile.full_name} userRole={profile.role} />
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
        <ChatView
          conversationId={conversationId}
          messages={messages || []}
          otherUser={otherUser}
          userId={user.id}
        />
      </main>
    </div>
  );
}
