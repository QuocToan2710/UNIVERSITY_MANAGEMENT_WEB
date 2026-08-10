import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest } from "../../lib/api";
import type { ClassGroup, Course, Teacher } from "../../types/management";
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
          courseId: schedule.courseId,
          teacherId: schedule.teacherId,
          classGroupId: schedule.classGroupId,
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
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      apiListRequest<Course>("/courses/all"),
      apiListRequest<Teacher>("/teachers/all"),
      apiListRequest<ClassGroup>("/class-groups/all"),
    ]).then(([cList, tList, cgList]) => {

      setCourses(cList);
      setTeachers(tList);
      setClassGroups(cgList);
    }).catch(() => {
      // Fallback
    });
  }, []);

  function update<K extends keyof ClassSchedulePayload>(key: K, value: ClassSchedulePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest<ClassSchedule>(schedule ? `/schedules/${schedule.id}` : "/schedules", {
        method: schedule ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu lịch học.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-white"
      >
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{schedule ? "Cập nhật slot lịch học" : "Xếp lịch học mới"}</h2>
            <p className="mt-1 text-xs text-slate-400">Chọn môn học, giảng viên, lớp học và khung giờ cố định theo tuần.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Môn học */}
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Môn học *
            <select
              required
              value={form.courseId}
              onChange={(e) => update("courseId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-white">-- Chọn môn học --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.courseCode} - {c.courseName} ({c.credit} tín chỉ)
                </option>
              ))}
            </select>
          </label>

          {/* Giảng viên */}
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Giảng viên dạy *
            <select
              required
              value={form.teacherId}
              onChange={(e) => update("teacherId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-white">-- Chọn giảng viên --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.teacherCode} - {t.fullName}
                </option>
              ))}
            </select>
          </label>

          {/* Lớp học */}
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Lớp học *
            <select
              required
              value={form.classGroupId}
              onChange={(e) => update("classGroupId", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
            >
              <option value="" className="bg-slate-900 text-white">-- Chọn lớp học --</option>
              {classGroups.map((cg) => (
                <option key={cg.id} value={cg.id} className="bg-slate-900 text-white">
                  {cg.classCode} - {cg.className}
                </option>
              ))}
            </select>
          </label>

          {/* Thứ trong tuần */}
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Thứ trong tuần *
            <select
              required
              value={form.dayOfWeek}
              onChange={(e) => update("dayOfWeek", e.target.value as WeekDay)}
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
            >
              {WEEK_DAYS.map((day) => (
                <option key={day} value={day} className="bg-slate-900 text-white">
                  {WEEK_DAY_LABELS[day]}
                </option>
              ))}
            </select>
          </label>

          {/* Giờ bắt đầu */}
          <Field label="Giờ bắt đầu *" type="time" value={form.startTime} onChange={(v) => update("startTime", v)} required />

          {/* Giờ kết thúc */}
          <Field label="Giờ kết thúc *" type="time" value={form.endTime} onChange={(v) => update("endTime", v)} required />

          {/* Phòng học */}
          <Field label="Phòng học" value={form.room} onChange={(v) => update("room", v)} placeholder="VD: A1.101" />

          {/* Học kỳ */}
          <Field label="Học kỳ" value={form.semester} onChange={(v) => update("semester", v)} placeholder="VD: HK1" />

          {/* Năm học */}
          <Field label="Năm học" value={form.academicYear} onChange={(v) => update("academicYear", v)} placeholder="VD: 2025-2026" />

          {/* Ghi chú */}
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider sm:col-span-2">
            Ghi chú
            <input
              value={form.note || ""}
              onChange={(e) => update("note", e.target.value)}
              placeholder="Ghi chú thêm (nếu có)"
              className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
            />
          </label>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md disabled:opacity-50"
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
    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function formatTimeInput(str: string) {
  if (!str) return "07:30";
  const parts = str.split(":");
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}
