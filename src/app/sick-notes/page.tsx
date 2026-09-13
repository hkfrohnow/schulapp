import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import SickNotesClient from "./sick-notes-client";

export const dynamic = "force-dynamic";

export default async function SickNotesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .order("first_name");

  let sickNotes;

  if (profile.role === "parent") {
    const studentIds = (students || []).map((s) => s.id);
    if (studentIds.length > 0) {
      const { data } = await supabase
        .from("sick_notes")
        .select("*, student:students(*), reporter:profiles!reported_by(full_name)")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false });
      sickNotes = data;
    } else {
      sickNotes = [];
    }
  } else {
    const { data } = await supabase
      .from("sick_notes")
      .select("*, student:students(*), reporter:profiles!reported_by(full_name)")
      .order("created_at", { ascending: false });
    sickNotes = data;
  }

  // Lesebestaetigungen laden
  const noteIds = (sickNotes || []).map((n: { id: string }) => n.id);
  let reads: Array<{ sick_note_id: string; reader: { full_name: string } | null; read_at: string }> = [];
  if (noteIds.length > 0) {
    const { data } = await supabase
      .from("sick_note_reads")
      .select("sick_note_id, reader:profiles!reader_id(full_name), read_at")
      .in("sick_note_id", noteIds);
    reads = (data || []).map((r) => ({
      ...r,
      reader: r.reader as unknown as { full_name: string } | null,
    }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={profile.full_name} userRole={profile.role} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <SickNotesClient
          sickNotes={sickNotes || []}
          students={students || []}
          userRole={profile.role}
          userId={user.id}
          reads={reads}
        />
      </main>
    </div>
  );
}
