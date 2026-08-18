import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest, fetchMasterData } from "../../lib/api";
import type { Course, Teacher } from "../../types/management";
import {
  emptyClassSchedule,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  type ClassSchedule,
  type ClassSchedulePayload,
  type WeekDay,
} from "../../types/schedule";

type ScheduleFormProps = {
  schedule: ClassSchedule | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ScheduleForm({ schedule, onClose, onSaved }: ScheduleFormProps) {
  const [form, setForm] = useState<ClassSchedulePayload>(
    schedule
      ? {
          courseClassId: schedule.courseClassId,
          teacherId: schedule.teacherId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: formatTimeInput(schedule.startTime),
          endTime: formatTimeInput(schedule.endTime),
          room: schedule.room || "",
          semester: schedule.semester || "HK1",
          academicYear: schedule.academicYear || "2025-2026",
          note: schedule.note || "",
        }
      : emptyClassSchedule
  );

  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<{ value: string; label: string }[]>([]);
  const [semesters, setSemesters] = useState<{ value: string; label: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ value: string; label: string }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchMasterData("COURSE_CLASS")
      .then((opts) =>
        setCourses(opts.map((o) => ({ id: o.value, courseCode: o.code || o.value, courseName: o.label, credit: 3, semester: "1" })))
      )
      .catch(async () => setCourses(await apiListRequest<Course>("/courses/all").catch(() => [])));

    void fetchMasterData("TEACHER")
      .then((opts) =>
        setTeachers(opts.map((o) => ({ id: o.value, teacherCode: o.code || o.value, fullName: o.label, email: "", phoneNumber: "" })))
      )
      .catch(async () => setTeachers(await apiListRequest<Teacher>("/teachers/all").catch(() => [])));

    void fetchMasterData("ROOM")
      .then((opts) => setRooms(opts.map((o) => ({ value: o.code || o.label, label: o.label }))))
      .catch(() => setRooms([]));

    void fetchMasterData("SEMESTER")
      .then((opts) => setSemesters(opts.map((o) => ({ value: o.value, label: o.label }))))
      .catch(() => setSemesters([
        { value: "1", label: "Học kỳ 1" },
        { value: "2", label: "Học kỳ 2" },
        { value: "3", label: "Học kỳ Hè" }
      ]));

    void fetchMasterData("ACADEMIC_YEAR")
      .then((opts) => setAcademicYears(opts.map((o) => ({ value: o.value, label: o.label }))))
      .catch(() => setAcademicYears([
        { value: "2024-2025", label: "2024 - 2025" },
        { value: "2025-2026", label: "2025 - 2026" },
        { value: "2023-2024", label: "2023 - 2024" }
      ]));
  }, []);

  function update<K extends keyof ClassSchedulePayload>(key: K, value: ClassSchedulePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        courseClassId: form.courseClassId ? Number(form.courseClassId) : null,
        teacherId: form.teacherId ? Number(form.teacherId) : null,
        startTime: form.startTime ? (form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime) : "07:30:00",
        endTime: form.endTime ? (form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime) : "09:30:00",
      };
      await apiRequest<ClassSchedule>(schedule ? `/schedules/${schedule.id}` : "/schedules", {
        method: schedule ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu lịch học.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 dark:bg-slate-50 dark:bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{schedule ? "Cập nhật slot lịch học" : "Xếp lịch học mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Chọn lớp học phần, giảng viên và khung giờ cố định theo tuần.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Lớp học phần */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Lớp học phần *
            <select
              required
              value={form.courseClassId}
              onChange={(e) => update("courseClassId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              <option value="">-- Chọn lớp học phần --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} - {c.courseName}
                </option>
              ))}
            </select>
          </label>

          {/* Giảng viên */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Giảng viên dạy *
            <select
              required
              value={form.teacherId}
              onChange={(e) => update("teacherId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              <option value="">-- Chọn giảng viên --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.teacherCode} - {t.fullName}
                </option>
              ))}
            </select>
          </label>

          {/* Thứ trong tuần */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Thứ trong tuần *
            <select
              required
              value={form.dayOfWeek}
              onChange={(e) => update("dayOfWeek", e.target.value as WeekDay)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              {WEEK_DAYS.map((day) => (
                <option key={day} value={day}>
                  {WEEK_DAY_LABELS[day]}
                </option>
              ))}
            </select>
          </label>

          {/* Phòng học */}
          {rooms.length > 0 ? (
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
              Phòng học
              <select
                value={form.room || ""}
                onChange={(e) => update("room", e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
              >
                <option value="">-- Chọn phòng học --</option>
                {rooms.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Field label="Phòng học" value={form.room} onChange={(v) => update("room", v)} placeholder="VD: A1.101" />
          )}

          {/* Giờ bắt đầu */}
          <Field label="Giờ bắt đầu *" type="time" value={form.startTime} onChange={(v) => update("startTime", v)} required />

          {/* Giờ kết thúc */}
          <Field label="Giờ kết thúc *" type="time" value={form.endTime} onChange={(v) => update("endTime", v)} required />

          {/* Học kỳ */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Học kỳ
            <select
              value={form.semester || "1"}
              onChange={(e) => update("semester", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              {semesters.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {/* Năm học */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Năm học
            <select
              value={form.academicYear || "2024-2025"}
              onChange={(e) => update("academicYear", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              {academicYears.map((ay) => (
                <option key={ay.value} value={ay.value}>
                  {ay.label}
                </option>
              ))}
            </select>
          </label>

          {/* Ghi chú */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider sm:col-span-2">
            Ghi chú
            <input
              value={form.note || ""}
              onChange={(e) => update("note", e.target.value)}
              placeholder="Ghi chú thêm (nếu có)"
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            />
          </label>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white shadow-md disabled:opacity-50"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu lịch học"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-100 dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function formatTimeInput(str: string) {
  if (!str) return "07:30";
  const parts = str.split(":");
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}
