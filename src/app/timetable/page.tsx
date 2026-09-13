import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import TimetableView from "./timetable-view";

export const dynamic = "force-dynamic";

export default async function TimetablePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  let classNames: string[] = [];

  if (profile.role === "parent") {
    const { data: students } = await supabase
      .from("students")
      .select("class_name, first_name, last_name")
      .eq("parent_id", user.id);
    classNames = [...new Set((students || []).map((s) => s.class_name))];
  } else if (profile.role === "teacher") {
    const { data: entries } = await supabase
      .from("timetable_entries")
      .select("class_name")
      .eq("teacher_id", user.id);
    classNames = [...new Set((entries || []).map((e) => e.class_name))];

    if (classNames.length === 0) {
      const { data: allEntries } = await supabase
        .from("timetable_entries")
        .select("class_name");
      classNames = [...new Set((allEntries || []).map((e) => e.class_name))];
    }
  } else {
    const { data: allEntries } = await supabase
      .from("timetable_entries")
      .select("class_name");
    classNames = [...new Set((allEntries || []).map((e) => e.class_name))];
  }

  classNames.sort();
  const selectedClass = classNames[0] || null;

  let entries: Array<{
    id: string;
    class_name: string;
    day_of_week: number;
    period: number;
    start_time: string;
    end_time: string;
    subject: string;
    room: string | null;
    teacher: { full_name: string } | null;
  }> = [];

  if (selectedClass) {
    const { data } = await supabase
      .from("timetable_entries")
      .select("*, teacher:profiles!teacher_id(full_name)")
      .eq("class_name", selectedClass)
      .order("day_of_week")
      .order("period");

    entries = (data || []).map((e) => ({
      ...e,
      teacher: e.teacher as unknown as { full_name: string } | null,
    }));
  }

  // Alerts fuer diese Woche laden
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const entryIds = entries.map((e) => e.id);
  let alerts: Array<{
    id: string;
    timetable_entry_id: string;
    alert_date: string;
    alert_type: string;
    message: string;
  }> = [];

  if (entryIds.length > 0) {
    const { data } = await supabase
      .from("timetable_alerts")
      .select("id, timetable_entry_id, alert_date, alert_type, message")
      .in("timetable_entry_id", entryIds)
      .gte("alert_date", monday.toISOString().split("T")[0])
      .lte("alert_date", friday.toISOString().split("T")[0]);
    alerts = data || [];
  }

  let studentNames: Record<string, string> = {};
  if (profile.role === "parent") {
    const { data: students } = await supabase
      .from("students")
      .select("class_name, first_name")
      .eq("parent_id", user.id);
    for (const s of students || []) {
      studentNames[s.class_name] = s.first_name;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={profile.full_name} userRole={profile.role} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <TimetableView
          entries={entries}
          alerts={alerts}
          classNames={classNames}
          selectedClass={selectedClass}
          studentNames={studentNames}
          userRole={profile.role}
          userId={user.id}
        />
      </main>
    </div>
  );
}
