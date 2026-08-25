import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { apiListRequest, apiRequest, ApiError } from "../lib/api";
import { gradeService } from "../services/grade.service";
import type { GradeStatus, SubjectClassGradeSummary, GradeItemInput } from "../types/grade";
import type { User } from "../types/management";
import { exportToExcel } from "../lib/excel";

type SubjectClassOption = {
  id: number;
  subjectClassCode: string;
  name: string;
  semester?: string;
  academicYear?: string;
  subjectId?: number;
};

export function meta() {
  return [
    { title: "EduManage | Quản lý điểm học phần" },
    { name: "description", content: "Nhập điểm và quản lý bảng điểm lớp học phần theo hệ số động" },
  ];
}

export default function Grades() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<SubjectClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [summary, setSummary] = useState<SubjectClassGradeSummary | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Local editable grades state: enrollmentId -> { att, mid, fin, note }
  const [gradeInputs, setGradeInputs] = useState<Record<number, { att: string; mid: string; fin: string; note: string }>>({});

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant: "primary" | "warning" | "danger" | "info";
    action: () => Promise<void>;
  }>({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Xác nhận",
    confirmVariant: "primary",
    action: async () => {},
  });

  const rawRoles = (currentUser?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoles = rawRoles.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoles.includes("ADMIN") || (currentUser?.username || "").toLowerCase() === "admin";

  useEffect(() => {
    void (async () => {
      try {
        const [u, classList] = await Promise.all([
          apiRequest<User>("/users/myInfo").catch(() => null),
          apiListRequest<SubjectClassOption>("/subject-classes?size=1000").catch(async () =>
            apiListRequest<SubjectClassOption>("/subject-classes")
          ),
        ]);
        setCurrentUser(u);
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClassId(classList[0].id);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.status === 401) navigate("/login");
        else setError(apiErr.message || "Không thể tải danh sách lớp học phần.");
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, [navigate]);

  const loadGrades = async (classId: number) => {
    setLoadingGrades(true);
    setError("");
    setSuccessMsg("");
    try {
      const data = await gradeService.getSubjectClassGrades(classId);
      setSummary(data);

      const initialInputs: Record<number, { att: string; mid: string; fin: string; note: string }> = {};
      data.studentGrades.forEach((g) => {
        initialInputs[g.id] = {
          att: g.attendanceScore !== null && g.attendanceScore !== undefined ? String(g.attendanceScore) : "",
          mid: g.midtermScore !== null && g.midtermScore !== undefined ? String(g.midtermScore) : "",
          fin: g.finalScore !== null && g.finalScore !== undefined ? String(g.finalScore) : "",
          note: g.note || "",
        };
      });
      setGradeInputs(initialInputs);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Không thể tải bảng điểm của lớp.");
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      void loadGrades(selectedClassId);
    }
  }, [selectedClassId]);

  const handleInputChange = (enrollmentId: number, field: "att" | "mid" | "fin" | "note", value: string) => {
    setGradeInputs((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [field]: value,
      },
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedClassId || !summary) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const items: GradeItemInput[] = summary.studentGrades.map((g) => {
        const inp = gradeInputs[g.id] || { att: "", mid: "", fin: "", note: "" };
        const attNum = inp.att.trim() !== "" ? parseFloat(inp.att) : undefined;
        const midNum = inp.mid.trim() !== "" ? parseFloat(inp.mid) : undefined;
        const finNum = inp.fin.trim() !== "" ? parseFloat(inp.fin) : undefined;

        return {
          enrollmentId: g.id,
          attendanceScore: !isNaN(attNum as number) ? attNum : null,
          midtermScore: !isNaN(midNum as number) ? midNum : null,
          finalScore: !isNaN(finNum as number) ? finNum : null,
          note: inp.note,
        };
      });

      const updated = await gradeService.updateBatchGrades(selectedClassId, { items });
      setSummary(updated);
      setSuccessMsg("Lưu bảng điểm thành công!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Lỗi khi lưu bảng điểm.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitGrades = async () => {
    if (!selectedClassId) return;
    setActionLoading(true);
    try {
      const res = await gradeService.submitGrades(selectedClassId);
      setSummary(res);
      setSuccessMsg("Đã gửi nộp bảng điểm lên Phòng Đào tạo!");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Không thể nộp bảng điểm.");
    } finally {
      setActionLoading(false);
      setConfirmModal((prev) => ({ ...prev, open: false }));
    }
  };

  const handlePublishGrades = async () => {
    if (!selectedClassId) return;
    setActionLoading(true);
    try {
      const res = await gradeService.publishGrades(selectedClassId);
      setSummary(res);
      setSuccessMsg("Đã công bố điểm cho toàn bộ sinh viên trong lớp!");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Không thể công bố điểm.");
    } finally {
      setActionLoading(false);
      setConfirmModal((prev) => ({ ...prev, open: false }));
    }
  };

  const handleLockGrades = async () => {
    if (!selectedClassId) return;
    setActionLoading(true);
    try {
      const res = await gradeService.lockGrades(selectedClassId);
      setSummary(res);
      setSuccessMsg("Đã khóa sổ bảng điểm. Bảng điểm không thể chỉnh sửa.");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Không thể khóa sổ điểm.");
    } finally {
      setActionLoading(false);
      setConfirmModal((prev) => ({ ...prev, open: false }));
    }
  };

  const handleExportExcel = () => {
    if (!summary) return;
    const exportRows = summary.studentGrades.map((g, idx) => ({
      STT: idx + 1,
      "Mã SV": g.studentCode,
      "Họ và Tên": g.studentName,
      [`Chuyên cần (${summary.attendanceCoeff})`]: g.attendanceScore ?? "",
      [`Giữa kỳ (${summary.midtermCoeff})`]: g.midtermScore ?? "",
      [`Cuối kỳ (${summary.finalCoeff})`]: g.finalScore ?? "",
      "Tổng kết Hệ 10": g.totalScore ?? "",
      "Điểm Chữ": g.letterGrade ?? "",
      "Thang 4": g.gradePoint4 ?? "",
      "Kết quả": g.status === "PASSED" ? "Đạt" : g.status === "FAILED" ? "Không đạt" : "Đang học",
      "Ghi chú": g.note ?? "",
    }));

    exportToExcel(
      exportRows,
      `Bang_Diem_${summary.subjectClassCode}_${summary.semester}`,
      "BangDiem"
    );
  };

  const isLocked = summary?.gradeStatus === "LOCKED";
  const isPublished = summary?.gradeStatus === "PUBLISHED";

  return (
    <AppShell
      title="Quản lý điểm học phần"
      description="Nhập điểm thành phần theo hệ số động, theo dõi phổ điểm và chốt nộp bảng điểm."
    >
      {/* Alert Messages */}
      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-600 dark:text-red-300 backdrop-blur-md">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm text-emerald-700 dark:text-emerald-300 backdrop-blur-md">
          {successMsg}
        </div>
      )}

      {/* Class Selector & Actions Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Chọn Lớp Học Phần Cần Nhập Điểm
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {classes.length === 0 ? (
              <span className="text-xs text-slate-500 font-medium">Chưa có lớp học phần nào trong hệ thống.</span>
            ) : (
              <select
                value={selectedClassId || ""}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                disabled={loadingClasses}
                className="min-w-[280px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.subjectClassCode} - {c.name} ({c.semester || "HK1"} · {c.academicYear || "2025-2026"})
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => selectedClassId && void loadGrades(selectedClassId)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              Tải lại
            </button>
          </div>
        </div>

        {summary && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportExcel}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Xuất Excel
            </button>

            {!isLocked && (
              <button
                onClick={handleSaveGrades}
                disabled={saving}
                className="rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cyan-500 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Đang lưu…" : "Lưu bảng điểm"}
              </button>
            )}

            {!isLocked && !isPublished && (
              <button
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    title: "Chốt nộp bảng điểm",
                    message: "Bạn có chắc chắn muốn nộp bảng điểm lớp này lên Phòng Đào tạo duyệt không?",
                    confirmLabel: "Xác nhận nộp",
                    confirmVariant: "primary",
                    action: handleSubmitGrades,
                  })
                }
                disabled={actionLoading}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                Chốt nộp điểm
              </button>
            )}

            {isAdmin && !isLocked && (
              <button
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    title: "Phê duyệt & Công bố điểm",
                    message: "Công bố bảng điểm chính thức cho toàn bộ sinh viên trong lớp?",
                    confirmLabel: "Công bố ngay",
                    confirmVariant: "primary",
                    action: handlePublishGrades,
                  })
                }
                disabled={actionLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                Công bố điểm
              </button>
            )}

            {isAdmin && !isLocked && (
              <button
                onClick={() =>
                  setConfirmModal({
                    open: true,
                    title: "Khóa sổ điểm",
                    message: "Khóa sổ vĩnh viễn bảng điểm này? Sau khi khóa sổ, không ai có thể chỉnh sửa điểm.",
                    confirmLabel: "Khóa sổ",
                    confirmVariant: "danger",
                    action: handleLockGrades,
                  })
                }
                disabled={actionLoading}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-500 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                Khóa sổ
              </button>
            )}
          </div>
        )}
      </div>

      {loadingGrades ? (
        <div className="my-16 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
          Đang tải bảng điểm học phần…
        </div>
      ) : !summary ? (
        <div className="my-16 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
          Vui lòng chọn một lớp học phần để quản lý điểm.
        </div>
      ) : (
        <>
          {/* Class Overview Banner */}
          <div className="mt-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {summary.subjectName} ({summary.subjectCode})
                  </h2>
                  <StatusBadge status={summary.gradeStatus} />
                </div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  Lớp: <span className="font-bold text-cyan-600 dark:text-cyan-400">{summary.subjectClassName} ({summary.subjectClassCode})</span> · Tín chỉ: <span className="font-bold text-slate-900 dark:text-white">{summary.credit}</span> · Giảng viên: <span className="font-bold">{summary.teacherName || "Chưa phân công"}</span>
                </p>
              </div>

              {/* Dynamic Coefficients Badge */}
              <div className="rounded-2xl border border-amber-300 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-2.5 text-xs">
                <span className="font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Cấu hình hệ số:
                </span>
                <span className="ml-2 font-black text-slate-900 dark:text-white">
                  Chuyên cần ({summary.attendanceCoeff}) · Giữa kỳ ({summary.midtermCoeff}) · Cuối kỳ ({summary.finalCoeff})
                </span>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard label="Sĩ số lớp" value={String(summary.totalStudents)} theme="cyan" />
              <KpiCard label="Đã có điểm" value={`${summary.gradedStudents} / ${summary.totalStudents}`} theme="violet" />
              <KpiCard label="Số lượng Đạt" value={`${summary.passedCount}`} detail={`Tỷ lệ: ${summary.gradedStudents > 0 ? Math.round((summary.passedCount / summary.gradedStudents) * 100) : 0}%`} theme="emerald" />
              <KpiCard label="Không đạt (Rớt)" value={`${summary.failedCount}`} detail={`Tỷ lệ: ${summary.gradedStudents > 0 ? Math.round((summary.failedCount / summary.gradedStudents) * 100) : 0}%`} theme="amber" />
              <KpiCard label="Điểm TB lớp" value={summary.averageScore !== null && summary.averageScore !== undefined ? String(summary.averageScore) : "—"} theme="rose" />
            </div>

            {/* Grade Distribution Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Phổ điểm môn học (Grade Distribution)
              </p>
              <div className="flex flex-wrap gap-2.5">
                {Object.entries(summary.gradeDistribution || {}).map(([grade, count]) => (
                  <div key={grade} className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 text-xs">
                    <span className="font-mono font-black text-slate-900 dark:text-white">{grade}</span>
                    <span className="rounded-md bg-cyan-100 dark:bg-cyan-500/20 px-1.5 py-0.5 font-bold text-cyan-800 dark:text-cyan-300">
                      {count} SV
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student Grades Table Grid */}
          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 backdrop-blur-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    <th className="py-3.5 px-4">Mã SV</th>
                    <th className="py-3.5 px-4">Họ và Tên</th>
                    <th className="py-3.5 px-4 w-28 text-center">
                      CC ({summary.attendanceCoeff})
                    </th>
                    <th className="py-3.5 px-4 w-28 text-center">
                      GK ({summary.midtermCoeff})
                    </th>
                    <th className="py-3.5 px-4 w-28 text-center">
                      CK ({summary.finalCoeff})
                    </th>
                    <th className="py-3.5 px-4 w-28 text-center">Tổng (Hệ 10)</th>
                    <th className="py-3.5 px-4 w-20 text-center">Điểm chữ</th>
                    <th className="py-3.5 px-4 w-20 text-center">Hệ 4</th>
                    <th className="py-3.5 px-4 w-28 text-center">Kết quả</th>
                    <th className="py-3.5 px-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {summary.studentGrades.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500">
                        Chưa có sinh viên nào đăng ký lớp học phần này.
                      </td>
                    </tr>
                  ) : (
                    summary.studentGrades.map((g, idx) => {
                      const inp = gradeInputs[g.id] || { att: "", mid: "", fin: "", note: "" };

                      const attVal = inp.att !== "" ? parseFloat(inp.att) : null;
                      const midVal = inp.mid !== "" ? parseFloat(inp.mid) : null;
                      const finVal = inp.fin !== "" ? parseFloat(inp.fin) : null;

                      let previewTotal: number | null = g.totalScore ?? null;
                      let previewLetter = g.letterGrade ?? "—";
                      let previewPoint4 = g.gradePoint4 !== null && g.gradePoint4 !== undefined ? g.gradePoint4 : "—";
                      let previewPassed = g.status === "PASSED";

                      if (attVal !== null || midVal !== null || finVal !== null) {
                        let weighted = 0;
                        let coeffs = 0;
                        if (attVal !== null) { weighted += attVal * summary.attendanceCoeff; coeffs += summary.attendanceCoeff; }
                        if (midVal !== null) { weighted += midVal * summary.midtermCoeff; coeffs += summary.midtermCoeff; }
                        if (finVal !== null) { weighted += finVal * summary.finalCoeff; coeffs += summary.finalCoeff; }
                        if (coeffs > 0) {
                          previewTotal = Math.round((weighted / coeffs) * 100) / 100;
                          if (previewTotal >= 8.5) { previewLetter = "A"; previewPoint4 = 4.0; }
                          else if (previewTotal >= 8.0) { previewLetter = "B+"; previewPoint4 = 3.5; }
                          else if (previewTotal >= 7.0) { previewLetter = "B"; previewPoint4 = 3.0; }
                          else if (previewTotal >= 6.5) { previewLetter = "C+"; previewPoint4 = 2.5; }
                          else if (previewTotal >= 5.5) { previewLetter = "C"; previewPoint4 = 2.0; }
                          else if (previewTotal >= 5.0) { previewLetter = "D+"; previewPoint4 = 1.5; }
                          else if (previewTotal >= 4.0) { previewLetter = "D"; previewPoint4 = 1.0; }
                          else { previewLetter = "F"; previewPoint4 = 0.0; }
                          previewPassed = previewTotal >= 4.0 && (attVal === null || attVal >= 4.0);
                        }
                      }

                      return (
                        <tr key={g.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-cyan-700 dark:text-cyan-300">
                            {g.studentCode}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {g.studentName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              disabled={isLocked}
                              value={inp.att}
                              onChange={(e) => handleInputChange(g.id, "att", e.target.value)}
                              placeholder="0.0"
                              className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2 text-center font-mono font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              disabled={isLocked}
                              value={inp.mid}
                              onChange={(e) => handleInputChange(g.id, "mid", e.target.value)}
                              placeholder="0.0"
                              className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2 text-center font-mono font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              disabled={isLocked}
                              value={inp.fin}
                              onChange={(e) => handleInputChange(g.id, "fin", e.target.value)}
                              placeholder="0.0"
                              className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2 text-center font-mono font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-black text-sm text-slate-900 dark:text-white">
                            {previewTotal !== null ? previewTotal : "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <GradeLetterBadge letter={previewLetter} />
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {previewPoint4}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {previewTotal !== null ? (
                              previewPassed ? (
                                <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                  Đạt
                                </span>
                              ) : (
                                <span className="inline-block rounded-full bg-red-100 dark:bg-red-500/20 px-2.5 py-0.5 text-[11px] font-bold text-red-800 dark:text-red-300">
                                  Rớt
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={inp.note}
                              onChange={(e) => handleInputChange(g.id, "note", e.target.value)}
                              placeholder="Ghi chú…"
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent py-1 px-2 text-xs text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:outline-none disabled:opacity-60"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <ConfirmModal
          open={confirmModal.open}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmVariant={confirmModal.confirmVariant}
          onConfirm={() => void confirmModal.action()}
          onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        />
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: GradeStatus }) {
  const map = {
    DRAFT: { label: "Bản nháp", class: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40" },
    SUBMITTED: { label: "Đã nộp (Chờ duyệt)", class: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40" },
    PUBLISHED: { label: "Đã công bố", class: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40" },
    LOCKED: { label: "Đã khóa sổ", class: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600" },
  };

  const item = map[status] || map.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${item.class}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {item.label}
    </span>
  );
}

function GradeLetterBadge({ letter }: { letter: string }) {
  if (!letter || letter === "—") return <span className="text-slate-400">—</span>;

  let color = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
  if (letter.startsWith("A")) color = "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-black";
  else if (letter.startsWith("B")) color = "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold";
  else if (letter.startsWith("C")) color = "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold";
  else if (letter.startsWith("D")) color = "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold";
  else if (letter === "F") color = "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 font-black";

  return <span className={`inline-block rounded-md px-2 py-0.5 font-mono text-xs ${color}`}>{letter}</span>;
}

function KpiCard({
  label,
  value,
  detail,
  theme,
}: {
  label: string;
  value: string;
  detail?: string;
  theme: "cyan" | "violet" | "emerald" | "amber" | "rose";
}) {
  const styles = {
    cyan: "border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-500/5 text-cyan-900 dark:text-cyan-300",
    violet: "border-purple-200 dark:border-violet-500/20 bg-purple-50/50 dark:bg-violet-500/5 text-purple-900 dark:text-violet-300",
    emerald: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-900 dark:text-emerald-300",
    amber: "border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-amber-900 dark:text-amber-300",
    rose: "border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 text-rose-900 dark:text-rose-300",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[theme]}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
      {detail && <p className="mt-1 text-[11px] font-medium text-slate-500">{detail}</p>}
    </div>
  );
}