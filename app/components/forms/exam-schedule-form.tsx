import { useEffect, useState, type FormEvent } from "react";
import { apiListRequest, apiRequest, fetchMasterData } from "../../lib/api";
import { emptyExamSchedule, type ExamSchedule, type ExamSchedulePayload, type Subject, type Teacher } from "../../types/management";

type ExamScheduleFormProps = {
  exam: ExamSchedule | null;
  onClose: () => void;
  onSaved: () => void;
};

const EXAM_FORMATS_DEFAULT = ["Tự luận", "Trắc nghiệm", "Thực hành", "Báo cáo đồ án"];

export function ExamScheduleForm({ exam, onClose, onSaved }: ExamScheduleFormProps) {
  const [form, setForm] = useState<ExamSchedulePayload>(
    exam
      ? {
          examCode: exam.examCode || "",
          name: exam.name || "",
          subjectId: exam.subjectId || "",
          examDate: exam.examDate || new Date().toISOString().split("T")[0],
          startTime: exam.startTime ? String(exam.startTime).slice(0, 5) : "08:00",
          endTime: exam.endTime ? String(exam.endTime).slice(0, 5) : "10:00",
          room: exam.room || "",
          examFormat: exam.examFormat || "Tự luận",
          proctorName: exam.proctorName || "",
          semester: exam.semester || "1",
          academicYear: exam.academicYear || "2024-2025",
        }
      : emptyExamSchedule
  );

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<{ value: string; label: string }[]>([]);
  const [examFormats, setExamFormats] = useState<string[]>(EXAM_FORMATS_DEFAULT);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchMasterData("SUBJECT")
      .then((opts) =>
        setSubjects(opts.map((o) => ({ id: o.value, subjectCode: o.code || o.value, name: o.label, credit: 3, semester: "1" })))
      )
      .catch(async () => setSubjects(await apiListRequest<Subject>("/subjects/all").catch(() => [])));

    void fetchMasterData("TEACHER")
      .then((opts) =>
        setTeachers(opts.map((o) => ({ id: o.value, teacherCode: o.code || o.value, fullName: o.label, email: "", phoneNumber: "" })))
      )
      .catch(async () => setTeachers(await apiListRequest<Teacher>("/teachers/all").catch(() => [])));

    void fetchMasterData("ROOM")
      .then((opts) => setRooms(opts.map((o) => ({ value: o.code || o.label, label: o.label }))))
      .catch(() => setRooms([]));

    void fetchMasterData("EXAM_FORMAT")
      .then((opts) => setExamFormats(opts.map((o) => o.label)))
      .catch(() => setExamFormats(EXAM_FORMATS_DEFAULT));
  }, []);

  function update<K extends keyof ExamSchedulePayload>(key: K, value: ExamSchedulePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        subjectId: form.subjectId ? Number(form.subjectId) : null,
        startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
        endTime: form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime,
      };

      await apiRequest<ExamSchedule>(exam ? `/exam-schedules/${exam.id}` : "/exam-schedules", {
        method: exam ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể lưu lịch thi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 dark:bg-slate-950/70 p-4 backdrop-blur-xl animate-in fade-in duration-200">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold">{exam ? "Cập nhật ca thi" : "Thêm ca thi mới"}</h2>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Thiết lập ngày thi, ca thi, phòng thi và giảng viên coi thi.</p>
          </div>
          <button type="button" onClick={onClose} className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            ✕
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Mã ca thi *" value={form.examCode} onChange={(v) => update("examCode", v)} required placeholder="VD: EXAM_JAVA01_HK1" />
          <Field label="Tên môn / Kỳ thi *" value={form.name} onChange={(v) => update("name", v)} required placeholder="VD: Thi kết thúc HP Lập trình Java" />

          {/* Chọn Môn học liên kết */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
              Môn học
              <select
                value={form.subjectId || ""}
                onChange={(e) => update("subjectId", e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subjectCode})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Field label="Ngày thi *" type="date" value={form.examDate} onChange={(v) => update("examDate", v)} required />
          
          {rooms.length > 0 ? (
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
              Phòng thi *
              <select
                required
                value={form.room || ""}
                onChange={(e) => update("room", e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
              >
                <option value="">-- Chọn phòng thi --</option>
                {rooms.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Field label="Phòng thi *" value={form.room} onChange={(v) => update("room", v)} required placeholder="VD: Phòng A2-402" />
          )}

          <Field label="Giờ bắt đầu *" type="time" value={form.startTime} onChange={(v) => update("startTime", v)} required />
          <Field label="Giờ kết thúc *" type="time" value={form.endTime} onChange={(v) => update("endTime", v)} required />

          {/* Hình thức thi */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Hình thức thi *
            <select
              required
              value={form.examFormat}
              onChange={(e) => update("examFormat", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              {examFormats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </label>

          {/* Giảng viên coi thi */}
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
            Cán bộ coi thi
            <select
              value={form.proctorName || ""}
              onChange={(e) => update("proctorName", e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs outline-none focus:border-cyan-400"
            >
              <option value="">-- Chọn cán bộ coi thi --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.fullName}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer">
            Hủy
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer"
          >
            {saving && <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            <span>{saving ? "Đang lưu..." : "Lưu ca thi"}</span>
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
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/80 px-4 py-3 text-xs font-medium text-slate-900 dark:text-white shadow-2xs placeholder-slate-500 outline-none focus:border-cyan-400"
      />
    </label>
  );
}
