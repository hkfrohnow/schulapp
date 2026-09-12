"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface Entry {
  id: string;
  class_name: string;
  day_of_week: number;
  period: number;
  start_time: string;
  end_time: string;
  subject: string;
  room: string | null;
  teacher: { full_name: string } | null;
}

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"];
const DAY_FULL = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

const SUBJECT_COLORS: Record<string, string> = {
  Deutsch: "bg-blue-50 border-blue-200 text-blue-700",
  Mathe: "bg-red-50 border-red-200 text-red-700",
  Englisch: "bg-purple-50 border-purple-200 text-purple-700",
  Sachkunde: "bg-green-50 border-green-200 text-green-700",
  Sport: "bg-orange-50 border-orange-200 text-orange-700",
  Kunst: "bg-pink-50 border-pink-200 text-pink-700",
  Musik: "bg-yellow-50 border-yellow-200 text-yellow-700",
  Religion: "bg-indigo-50 border-indigo-200 text-indigo-700",
  Ethik: "bg-indigo-50 border-indigo-200 text-indigo-700",
};

const DEFAULT_COLOR = "bg-gray-50 border-gray-200 text-gray-700";

function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || DEFAULT_COLOR;
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export default function TimetableView({
  entries,
  classNames,
  selectedClass,
  studentNames,
  userRole,
}: {
  entries: Entry[];
  classNames: string[];
  selectedClass: string | null;
  studentNames: Record<string, string>;
  userRole: UserRole;
}) {
  const [activeClass, setActiveClass] = useState(selectedClass);
  const [mobileDay, setMobileDay] = useState(() => {
    const jsDay = new Date().getDay();
    return jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : 0;
  });
  const router = useRouter();

  function handleClassChange(cls: string) {
    setActiveClass(cls);
    router.push(`/timetable?class=${cls}`);
    router.refresh();
  }

  if (classNames.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Stundenplan</h1>
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">Noch kein Stundenplan vorhanden.</p>
          <p className="text-gray-300 text-sm mt-1">
            {userRole === "parent"
              ? "Der Stundenplan wird von der Schulverwaltung eingetragen."
              : "Stundenplaene koennen von der Verwaltung angelegt werden."}
          </p>
        </div>
      </div>
    );
  }

  const maxPeriod = entries.length > 0
    ? Math.max(...entries.map((e) => e.period))
    : 4;
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  function getEntry(day: number, period: number) {
    return entries.find((e) => e.day_of_week === day + 1 && e.period === period);
  }

  const childName = activeClass ? studentNames[activeClass] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stundenplan</h1>
          <p className="text-gray-500 text-sm mt-1">
            {childName
              ? `${childName}s Stundenplan — Klasse ${activeClass}`
              : `Klasse ${activeClass}`}
          </p>
        </div>

        {classNames.length > 1 && (
          <div className="flex gap-1">
            {classNames.map((cls) => (
              <button
                key={cls}
                onClick={() => handleClassChange(cls)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  cls === activeClass
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: Tagesansicht */}
      <div className="sm:hidden">
        <div className="flex gap-1 mb-4">
          {DAYS.map((day, i) => (
            <button
              key={day}
              onClick={() => setMobileDay(i)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                i === mobileDay
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          {DAY_FULL[mobileDay]}
        </h2>

        <div className="space-y-2">
          {periods.map((period) => {
            const entry = getEntry(mobileDay, period);
            if (!entry) return null;

            const colors = getSubjectColor(entry.subject);

            return (
              <div
                key={period}
                className={`border rounded-2xl p-4 ${colors}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-base">{entry.subject}</span>
                  <span className="text-xs opacity-70">{period}. Stunde</span>
                </div>
                <div className="flex items-center gap-4 text-sm opacity-80">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                  </span>
                  {entry.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {entry.room}
                    </span>
                  )}
                  {entry.teacher && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {entry.teacher.full_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {periods.every((p) => !getEntry(mobileDay, p)) && (
            <div className="text-center py-8 text-gray-400">
              Kein Unterricht an diesem Tag.
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Wochenraster */}
      <div className="hidden sm:block">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-20">
                  Zeit
                </th>
                {DAYS.map((day, i) => {
                  const isToday = new Date().getDay() === i + 1;
                  return (
                    <th
                      key={day}
                      className={`px-2 py-3 text-center text-sm font-semibold ${
                        isToday ? "text-emerald-600" : "text-gray-700"
                      }`}
                    >
                      <span className="sm:hidden">{day}</span>
                      <span className="hidden sm:inline">{DAY_FULL[i]}</span>
                      {isToday && (
                        <span className="ml-1.5 inline-block w-2 h-2 bg-emerald-500 rounded-full" />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => {
                const firstEntry = entries.find((e) => e.period === period);
                return (
                  <tr key={period} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2 align-top">
                      <div className="text-xs font-medium text-gray-400">
                        {period}. Std
                      </div>
                      {firstEntry && (
                        <div className="text-[10px] text-gray-300">
                          {formatTime(firstEntry.start_time)}
                        </div>
                      )}
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const entry = getEntry(dayIdx, period);
                      if (!entry) {
                        return (
                          <td key={dayIdx} className="px-1 py-1.5">
                            <div className="h-16" />
                          </td>
                        );
                      }

                      const colors = getSubjectColor(entry.subject);

                      return (
                        <td key={dayIdx} className="px-1 py-1.5">
                          <div
                            className={`border rounded-xl px-2.5 py-2 h-16 flex flex-col justify-center ${colors}`}
                          >
                            <div className="font-semibold text-sm truncate">
                              {entry.subject}
                            </div>
                            <div className="text-[10px] opacity-70 truncate">
                              {entry.room || ""}
                              {entry.room && entry.teacher ? " · " : ""}
                              {entry.teacher?.full_name || ""}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
