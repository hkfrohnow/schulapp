"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Plus, X, Heart, ThermometerSun, CheckCircle2, Calendar } from "lucide-react";
import type { UserRole, Student, SickNote } from "@/lib/types";

const REASONS = [
  "Krankheit",
  "Arztbesuch",
  "Familiaerer Anlass",
  "Sonstiges",
];

export default function SickNotesClient({
  sickNotes,
  students,
  userRole,
  userId,
}: {
  sickNotes: SickNote[];
  students: Student[];
  userRole: UserRole;
  userId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function todayStr() {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.from("sick_notes").insert({
      student_id: studentId,
      reported_by: userId,
      start_date: startDate,
      end_date: endDate,
      reason,
      notes: notes || null,
    });

    if (!error) {
      setShowForm(false);
      setNotes("");
      router.refresh();
    }

    setSubmitting(false);
  }

  async function markRecovered(noteId: string) {
    const supabase = createClient();
    await supabase
      .from("sick_notes")
      .update({ status: "recovered", end_date: todayStr() })
      .eq("id", noteId);
    router.refresh();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("de-DE", {
      day: "numeric",
      month: "short",
    });
  }

  function daysBetween(start: string, end: string) {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
  }

  const activeNotes = sickNotes.filter((n) => n.status === "active");
  const pastNotes = sickNotes.filter((n) => n.status === "recovered");
  const myStudents = students.filter((s) => s.parent_id === userId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Krankmeldungen</h1>
          <p className="text-gray-500 text-sm mt-1">
            {userRole === "parent"
              ? "Melde dein Kind krank"
              : "Krankmeldungen deiner Schueler:innen"}
          </p>
        </div>
        {userRole === "parent" && myStudents.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition"
          >
            {showForm ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {showForm ? "Abbrechen" : "Kind krankmelden"}
          </button>
        )}
      </div>

      {userRole === "parent" && myStudents.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 font-medium">
            Noch keine Kinder zugeordnet.
          </p>
          <p className="text-amber-600 text-sm mt-1">
            Bitte die Schulverwaltung kontaktieren.
          </p>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 space-y-4"
        >
          {myStudents.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kind
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
              >
                {myStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} (Klasse {s.class_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          {myStudents.length === 1 && (
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-500">Kind: </span>
              <span className="font-medium text-gray-900">
                {myStudents[0].first_name} {myStudents[0].last_name}
              </span>
              <span className="text-sm text-gray-400 ml-2">
                Klasse {myStudents[0].class_name}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Von
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bis (voraussichtlich)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grund
            </label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    reason === r
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anmerkung <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition resize-none text-gray-900"
              placeholder="z.B. Kann voraussichtlich ab Mittwoch wieder kommen"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-600 transition disabled:opacity-50"
          >
            {submitting ? "Wird gemeldet..." : "Krankmeldung abschicken"}
          </button>
        </form>
      )}

      {activeNotes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ThermometerSun className="w-4 h-4" />
            Aktuell krank ({activeNotes.length})
          </h2>
          <div className="space-y-3">
            {activeNotes.map((note) => (
              <SickNoteCard
                key={note.id}
                note={note}
                userRole={userRole}
                userId={userId}
                onRecover={markRecovered}
                formatDate={formatDate}
                daysBetween={daysBetween}
              />
            ))}
          </div>
        </div>
      )}

      {activeNotes.length === 0 && !showForm && (
        <div className="text-center py-12 mb-8">
          <Heart className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">Alle gesund!</p>
          <p className="text-gray-300 text-sm mt-1">
            Keine aktiven Krankmeldungen.
          </p>
        </div>
      )}

      {pastNotes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Vergangene Krankmeldungen
          </h2>
          <div className="space-y-3">
            {pastNotes.map((note) => (
              <SickNoteCard
                key={note.id}
                note={note}
                userRole={userRole}
                userId={userId}
                onRecover={markRecovered}
                formatDate={formatDate}
                daysBetween={daysBetween}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SickNoteCard({
  note,
  userRole,
  userId,
  onRecover,
  formatDate,
  daysBetween,
}: {
  note: SickNote;
  userRole: UserRole;
  userId: string;
  onRecover: (id: string) => void;
  formatDate: (d: string) => string;
  daysBetween: (s: string, e: string) => number;
}) {
  const isActive = note.status === "active";
  const canRecover = isActive && (note.reported_by === userId || userRole === "admin");
  const days = daysBetween(note.start_date, note.end_date);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 ${
        isActive ? "border-amber-200" : "border-gray-100 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-gray-900">
              {note.student?.first_name} {note.student?.last_name}
            </span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              Klasse {note.student?.class_name}
            </span>
            {isActive && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                krank
              </span>
            )}
            {!isActive && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                gesund
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(note.start_date)} – {formatDate(note.end_date)}
            </span>
            <span>{days} {days === 1 ? "Tag" : "Tage"}</span>
            <span className="text-gray-400">·</span>
            <span>{note.reason}</span>
          </div>

          {note.notes && (
            <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">
              {note.notes}
            </p>
          )}

          {userRole !== "parent" && note.reporter && (
            <p className="text-xs text-gray-400 mt-2">
              Gemeldet von {note.reporter.full_name}
            </p>
          )}
        </div>

        {canRecover && (
          <button
            onClick={() => onRecover(note.id)}
            className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-xl transition font-medium flex-shrink-0"
          >
            <Heart className="w-4 h-4" />
            Gesundmelden
          </button>
        )}
      </div>
    </div>
  );
}
