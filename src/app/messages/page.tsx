import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import ConversationList from "./conversation-list";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Alle Konversationen des Nutzers laden
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const convIds = (participations || []).map((p) => p.conversation_id);

  let conversations: Array<{
    id: string;
    created_at: string;
    other_user: { id: string; full_name: string; role: string } | null;
    last_message: { content: string; created_at: string; sender_id: string } | null;
  }> = [];

  if (convIds.length > 0) {
    // Andere Teilnehmer und letzte Nachrichten laden
    for (const convId of convIds) {
      const { data: otherParticipant } = await supabase
        .from("conversation_participants")
        .select("user_id, user:profiles(id, full_name, role)")
        .eq("conversation_id", convId)
        .neq("user_id", user.id)
        .single();

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const otherUser = otherParticipant?.user as unknown as { id: string; full_name: string; role: string } | null;

      conversations.push({
        id: convId,
        created_at: "",
        other_user: otherUser || null,
        last_message: lastMsg || null,
      });
    }

    // Nach letzter Nachricht sortieren (neueste zuerst)
    conversations.sort((a, b) => {
      const aTime = a.last_message?.created_at || "0";
      const bTime = b.last_message?.created_at || "0";
      return bTime.localeCompare(aTime);
    });
  }

  // Kontakte laden, mit denen noch keine Konversation besteht
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .neq("id", user.id)
    .order("full_name");

  const existingContactIds = new Set(
    conversations.map((c) => c.other_user?.id).filter(Boolean)
  );

  const availableContacts = (allProfiles || []).filter(
    (p) => !existingContactIds.has(p.id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={profile.full_name} userRole={profile.role} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <ConversationList
          conversations={conversations}
          availableContacts={availableContacts}
          userId={user.id}
        />
      </main>
    </div>
  );
}
