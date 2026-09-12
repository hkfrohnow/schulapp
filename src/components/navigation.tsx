"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import {
  LayoutDashboard,
  Megaphone,
  ThermometerSun,
  CalendarDays,
  MessageCircle,
  LogOut,
  School,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/board", label: "Brett", icon: Megaphone },
  { href: "/timetable", label: "Stundenplan", icon: CalendarDays },
  { href: "/sick-notes", label: "Krank", icon: ThermometerSun },
  { href: "/messages", label: "Chat", icon: MessageCircle },
];

export default function Navigation({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();

  const roleLabels: Record<string, string> = {
    parent: "Elternteil",
    teacher: "Lehrkraft",
    admin: "Verwaltung",
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-lg text-gray-900">SchulApp</span>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500">{roleLabels[userRole] || userRole}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition"
              title="Abmelden"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
