"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { CalendarDays, Clock, MapPin, User, AlertTriangle, X, Ban, ArrowRightLeft, Info } from "lucide-react";
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

interface Alert {
  id: string;
  timetable_entry_id: string;
  alert_date: string;
  alert_type: string;
  message: string;
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

const ALERT_TYPES = [
  { value: "cancelled", label: "Faellt aus", icon: Ban, color: "text-red-600 bg-red-50" },
  { value: "room_change", label: "Raumwechsel", icon: ArrowRightLeft, color: "text-orange-600 bg-orange-50" },
  { value: "substitute", label: "Vertretung", icon: User, color: "text-blue-600 bg-blue-50" },
  { value: "info", label: "Hinweis", icon: Info, color: "text-gray-600 bg-gray-100" },
];

function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || DEFAULT_COLOR;
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function getDateForDay(dayIdx: number) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const target = new Date(monday);
  target.setDate(monday.getDate() + dayIdx);
  return target.toISOString().split("T")[0];
}

export default function TimetableView({
  entries,
  alerts,
  classNames,
  selectedClass,
  studentNames,
  userRole,
  userId,
}: {
  entries: Entry[];
  alerts: Alert[];
  classNames: string[];
  selectedClass: string | null;
  studentNames: Record<string, string>;
  userRole: UserRole;
  userId: string;
}) {
  const [activeClass, setActiveClass] = useState(selectedClass);
  const [mobileDay, setMobileDay] = useState(() => {
    const jsDay = new Date().getDay();
    return jsDay >= 1 && jsDay <= 5 ? jsDay - 1 : 0;
  });
  const [alertModal, setAlertModal] = useState<{ entry: Entry; dayIdx: number } | null>(null);
  const [alertType, setAlertType] = useState("cancelled");
  const [alertMessage, setAlertMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const canEdit = userRole === "teacher" || userRole === "admin";

  function handleClassChange(cls: string) {
    setActiveClass(cls);
    router.push(`/timetable?class=${cls}`);
    router.refresh();
  }

  function getAlertForEntry(entryId: string, dayIdx: number): Alert | undefined {
    const date = getDateForDay(dayIdx);
    return alerts.find((a) => a.timetable_entry_id === entryId && a.alert_date === date);
  }

  async function handleCreateAlert(e: React.FormEvent) {
    e.preventDefault();
    if (!alertModal) return;
    setSubmitting(true);

    const supabase = createClient();
    const alertDate = getDateForDay(alertModal.dayIdx);

    await supabase.from("timetable_alerts").insert({
      timetable_entry_id: alertModal.entry.id,
      alert_date: alertDate,
      alert_type: alertType,
      message: alertMessage,
      created_by: userId,
    });

    setAlertModal(null);
    setAlertMessage("");
    setAlertType("cancelled");
    setSubmitting(false);
    router.refresh();
  }

  async function handleDeleteAlert(alertId: string) {
    const supabase = createClient();
    await supabase.from("timetable_alerts").delete().eq("id", alertId);
    router.refresh();
  }

  if (classNames.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Stundenplan</h1>
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">Noch kein Stundenplan vorhanden.</p>
        </div>
      </div>
    );
  }

  const maxPeriod = entries.length > 0 ? Math.max(...entries.map((e) => e.period)) : 4;
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  function getEntry(day: number, period: number) {
    return entries.find((e) => e.day_of_week === day + 1 && e.period === period);
  }

  const childName = activeClass ? studentNames[activeClass] : null;

  // Aktive Alerts als Banner oben anzeigen
  const todayAlerts = alerts.filter((a) => {
    const today = new Date().toISOString().split("T")[0];
    return a.alert_date === today;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stundenplan</h1>
          <p className="text-gray-500 text-sm mt-1">
            {childName ? `${childName}s Stundenplan — Klasse ${activeClass}` : `Klasse ${activeClass}`}
          </p>
        </div>
        {classNames.length > 1 && (
          <div className="flex gap-1">
            {classNames.map((cls) => (
              <button
                key={cls}
                onClick={() => handleClassChange(cls)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  cls === activeClass ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Heutige Aenderungen als Banner */}
      {todayAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {todayAlerts.map((alert) => {
            const entry = entries.find((e) => e.id === alert.timetable_entry_id);
            const typeInfo = ALERT_TYPES.find((t) => t.value === alert.alert_type);
            return (
              <div key={alert.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                alert.alert_type === "cancelled" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
              }`}>
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                  alert.alert_type === "cancelled" ? "text-red-500" : "text-orange-500"
                }`} />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    {entry?.subject} ({entry?.period}. Std)
                  </span>
                  <span className="text-gray-500"> — </span>
                  <span className="text-gray-700">{typeInfo?.label}: {alert.message}</span>
                </div>
                {canEdit && (
                  <button onClick={() => handleDeleteAlert(alert.id)} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateAlert} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Aenderung: {alertModal.entry.subject} ({DAY_FULL[alertModal.dayIdx]})
              </h3>
              <button type="button" onClick={() => setAlertModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ALERT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setAlertType(type.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition border ${
                    alertType === type.value
                      ? type.color + " border-current"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-gray-900"
              placeholder="z.B. Frau Schmidt krank, Vertretung durch Herrn Mueller"
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition disabled:opacity-50"
            >
              {submitting ? "Wird gespeichert..." : "Aenderung melden"}
            </button>
          </form>
        </div>
      )}

      {/* Mobile: Tagesansicht */}
      <div className="sm:hidden">
        <div className="flex gap-1 mb-4">
          {DAYS.map((day, i) => (
            <button
              key={day}
              onClick={() => setMobileDay(i)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                i === mobileDay ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-3">{DAY_FULL[mobileDay]}</h2>

        <div className="space-y-2">
          {periods.map((period) => {
            const entry = getEntry(mobileDay, period);
            if (!entry) return null;
            const alert = getAlertForEntry(entry.id, mobileDay);
            const colors = alert?.alert_type === "cancelled"
              ? "bg-red-50 border-red-500 border-2 text-red-600 ring-2 ring-red-200"
              : alert
              ? "bg-orange-50 border-orange-500 border-2 text-orange-700 ring-2 ring-orange-200"
              : getSubjectColor(entry.subject);

            return (
              <div
                key={period}
                className={`border rounded-2xl p-4 ${colors} relative`}
                onClick={() => canEdit && !alert ? setAlertModal({ entry, dayIdx: mobileDay }) : undefined}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold text-base ${alert?.alert_type === "cancelled" ? "line-through" : ""}`}>
                    {entry.subject}
                  </span>
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
                </div>
                {alert && (
                  <div className={`mt-2 flex items-center gap-2 text-sm font-medium ${
                    alert.alert_type === "cancelled" ? "text-red-600" : "text-orange-600"
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                    {ALERT_TYPES.find((t) => t.value === alert.alert_type)?.label}: {alert.message}
                    {canEdit && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAlert(alert.id); }} className="ml-auto">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                {canEdit && !alert && (
                  <div className="text-xs opacity-40 mt-1">Tippen fuer Aenderung</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop: Wochenraster */}
      <div className="hidden sm:block">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase w-20">Zeit</th>
                {DAYS.map((day, i) => {
                  const isToday = new Date().getDay() === i + 1;
                  return (
                    <th key={day} className={`px-2 py-3 text-center text-sm font-semibold ${isToday ? "text-emerald-600" : "text-gray-700"}`}>
                      {DAY_FULL[i]}
                      {isToday && <span className="ml-1.5 inline-block w-2 h-2 bg-emerald-500 rounded-full" />}
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
                      <div className="text-xs font-medium text-gray-400">{period}. Std</div>
                      {firstEntry && <div className="text-[10px] text-gray-300">{formatTime(firstEntry.start_time)}</div>}
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const entry = getEntry(dayIdx, period);
                      if (!entry) return <td key={dayIdx} className="px-1 py-1.5"><div className="h-16" /></td>;

                      const alert = getAlertForEntry(entry.id, dayIdx);
                      const isCancelled = alert?.alert_type === "cancelled";
                      const colors = isCancelled
                        ? "bg-red-50 border-red-500 border-2 text-red-500 ring-2 ring-red-200"
                        : alert
                        ? "bg-orange-50 border-orange-500 border-2 text-orange-700 ring-2 ring-orange-200"
                        : getSubjectColor(entry.subject);

                      return (
                        <td key={dayIdx} className="px-1 py-1.5">
                          <div
                            className={`border rounded-xl px-2.5 py-2 min-h-[4rem] flex flex-col justify-center relative ${colors} ${
                              canEdit && !alert ? "cursor-pointer hover:shadow-md transition" : ""
                            }`}
                            onClick={() => canEdit && !alert ? setAlertModal({ entry, dayIdx }) : undefined}
                          >
                            <div className={`font-semibold text-sm truncate ${isCancelled ? "line-through" : ""}`}>
                              {entry.subject}
                            </div>
                            <div className="text-[10px] opacity-70 truncate">
                              {entry.room || ""}{entry.room && entry.teacher ? " · " : ""}{entry.teacher?.full_name || ""}
                            </div>
                            {alert && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse flex-shrink-0" />
                                <span className="text-[11px] font-bold truncate">{alert.message}</span>
                                {canEdit && (
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteAlert(alert.id); }} className="ml-auto opacity-50 hover:opacity-100">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
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
