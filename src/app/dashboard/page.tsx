import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Navigation from "@/components/navigation";
import Link from "next/link";
import { Megaphone, CalendarDays, MessageCircle, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

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

  const features = [
    {
      title: "Schwarzes Brett",
      description: `${postCount || 0} Beitraege`,
      icon: Megaphone,
      href: "/board",
      color: "bg-indigo-500",
      ready: true,
    },
    {
      title: "Stundenplan",
      description: "Wochenplan deiner Klasse",
      icon: CalendarDays,
      href: "/timetable",
      color: "bg-emerald-500",
      ready: true,
    },
    {
      title: "Krankmeldung",
      description: "Kind krank- oder gesundmelden",
      icon: AlertTriangle,
      href: "/sick-notes",
      color: "bg-amber-500",
      ready: true,
    },
    {
      title: "Nachrichten",
      description: "Direkter Chat mit Lehrkraeften",
      icon: MessageCircle,
      href: "/messages",
      color: "bg-rose-500",
      ready: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={profile.full_name} userRole={profile.role} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hallo, {profile.full_name.split(" ")[0]}!
          </h1>
          <p className="text-gray-500 mt-1">
            Was steht heute an?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className={`block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm transition ${
                feature.ready
                  ? "hover:shadow-md hover:border-gray-200"
                  : "opacity-60 cursor-not-allowed"
              }`}
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
