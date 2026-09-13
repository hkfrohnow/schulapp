import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import Link from "next/link";
import { Megaphone, CalendarDays, MessageCircle, AlertTriangle, Ban, ArrowRightLeft, User, Info } from "lucide-react";

export const dynamic = "force-dynamic";

const ALERT_LABELS: Record<string, { label: string; color: string }> = {
  cancelled: { label: "Faellt aus", color: "text-red-600" },
  room_change: { label: "Raumwechsel", color: "text-orange-600" },
  substitute: { label: "Vertretung", color: "text-blue-600" },
  info: { label: "Hinweis", color: "text-gray-600" },
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { count: postCount } = await supabase
    .from("board_posts")
    .select("*", { count: "exact", head: true });

  // Heutige Stundenplan-Aenderungen laden
  const today = new Date().toISOString().split("T")[0];

  let classNames: string[] = [];
  if (profile.role === "parent") {
    const { data: students } = await supabase
      .from("students")
      .select("class_name")
      .eq("parent_id", user.id);
    classNames = [...new Set((students || []).map((s) => s.class_name))];
  } else {
    const { data: allEntries } = await supabase
      .from("timetable_entries")
      .select("class_name");
    classNames = [...new Set((allEntries || []).map((e) => e.class_name))];
  }

  let todayAlerts: Array<{
    id: string;
    alert_type: string;
    message: string;
    entry: { subject: string; period: number; class_name: string } | null;
  }> = [];

  if (classNames.length > 0) {
    const { data: entries } = await supabase
      .from("timetable_entries")
      .select("id, subject, period, class_name")
      .in("class_name", classNames);

    const entryIds = (entries || []).map((e) => e.id);
    if (entryIds.length > 0) {
      const { data: alerts } = await supabase
        .from("timetable_alerts")
        .select("id, timetable_entry_id, alert_type, message")
        .in("timetable_entry_id", entryIds)
        .eq("alert_date", today);

      todayAlerts = (alerts || []).map((a) => ({
        ...a,
        entry: (entries || []).find((e) => e.id === a.timetable_entry_id) as { subject: string; period: number; class_name: string } | null,
      }));
    }
  }

  const alertCount = todayAlerts.length;

  const features = [
    {
      title: "Pinnwand",
      description: `${postCount || 0} Beitraege`,
      icon: Megaphone,
      href: "/board",
      color: "bg-indigo-500",
    },
    {
      title: "Stundenplan",
      description: alertCount > 0 ? `${alertCount} Aenderung${alertCount > 1 ? "en" : ""} heute` : "Wochenplan deiner Klasse",
      icon: CalendarDays,
      href: "/timetable",
      color: alertCount > 0 ? "bg-red-500" : "bg-emerald-500",
    },
    {
      title: "Krankmeldung",
      description: "Kind krank- oder gesundmelden",
      icon: AlertTriangle,
      href: "/sick-notes",
      color: "bg-amber-500",
    },
    {
      title: "Nachrichten",
      description: "Direkter Chat mit Lehrkraeften",
      icon: MessageCircle,
      href: "/messages",
      color: "bg-rose-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={profile.full_name} userRole={profile.role} alertCount={alertCount} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hallo, {profile.full_name.split(" ")[0]}!
          </h1>
          <p className="text-gray-500 mt-1">
            Was steht heute an?
          </p>
        </div>

        {/* Heutige Aenderungen */}
        {todayAlerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Aenderungen heute
            </h2>
            <div className="space-y-2">
              {todayAlerts.map((alert) => {
                const info = ALERT_LABELS[alert.alert_type] || ALERT_LABELS.info;
                return (
                  <Link
                    key={alert.id}
                    href="/timetable"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition hover:shadow-md ${
                      alert.alert_type === "cancelled"
                        ? "bg-red-50 border-red-200"
                        : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    {alert.alert_type === "cancelled" ? (
                      <Ban className="w-5 h-5 text-red-500 flex-shrink-0" />
                    ) : alert.alert_type === "room_change" ? (
                      <ArrowRightLeft className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    ) : alert.alert_type === "substitute" ? (
                      <User className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Info className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-medium text-gray-900">
                        {alert.entry?.subject} ({alert.entry?.period}. Std, Kl. {alert.entry?.class_name})
                      </span>
                      <span className="text-gray-500"> — </span>
                      <span className={info.color}>{info.label}: {alert.message}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm transition hover:shadow-md hover:border-gray-200"
            >
              <div className="flex items-start gap-4">
                <div className={`${feature.color} p-3 rounded-xl`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{feature.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
