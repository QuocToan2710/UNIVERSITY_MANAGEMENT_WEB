import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { StatusBadge } from "../components/status-badge";
import { apiListRequest, apiRequest, ApiError } from "../lib/api";
import { getCachedUser } from "../lib/auth";
import { gradeService } from "../services/grade.service";
import type { SubjectClassGradeSummary, GradeItemInput } from "../types/grade";
import type { User } from "../types/management";
import { exportToExcel } from "../lib/excel";
import { DownloadIcon, GradeIcon, RefreshIcon } from "../components/icons";

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
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCachedUser<User>());
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
      description=""
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
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Lớp Học Phần
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {classes.length === 0 ? (
              <span className="text-xs text-slate-500 font-medium">Chưa có lớp học phần nào trong hệ thống.</span>
            ) : (
              <select
                value={selectedClassId || ""}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                disabled={loadingClasses}
                className="min-w-[280px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition cursor-pointer"
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 transition cursor-pointer"
            >
              <RefreshIcon size={14} className="text-slate-400" />
              <span>Tải lại</span>
            </button>
          </div>
        </div>

        {summary && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-blue-400/40 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
            >
              <DownloadIcon size={14} />
              <span>Xuất Excel</span>
            </button>

            {!isLocked && (
              <button
                onClick={handleSaveGrades}
                disabled={saving}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs shadow-blue-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
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
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-750 transition disabled:opacity-50 cursor-pointer"
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
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400/50 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-750 transition disabled:opacity-50 cursor-pointer"
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
                className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition disabled:opacity-50 cursor-pointer"
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
          <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <GradeIcon size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {summary.subjectName}{" "}
                      <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                        ({summary.subjectCode})
                      </span>
                    </h2>
                    <StatusBadge status={summary.gradeStatus} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Lớp: <span className="font-semibold text-slate-800 dark:text-slate-200">{summary.subjectClassName} ({summary.subjectClassCode})</span> · Tín chỉ: <span className="font-semibold text-slate-800 dark:text-slate-200">{summary.credit}</span> · Giảng viên: <span className="font-semibold text-slate-800 dark:text-slate-200">{summary.teacherName || "Chưa phân công"}</span>
                  </p>
                </div>
              </div>

              {/* Dynamic Coefficients Badge - Unified Soft Primary Accent */}
              <div className="rounded-xl border border-blue-200/70 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/30 px-3.5 py-2 text-xs text-blue-900 dark:text-blue-200">
                <span className="font-semibold text-blue-700 dark:text-blue-400">Hệ số: </span>
                <span className="font-mono font-medium">
                  Chuyên cần ({summary.attendanceCoeff}) · Giữa kỳ ({summary.midtermCoeff}) · Cuối kỳ ({summary.finalCoeff})
                </span>
              </div>
            </div>

            {/* KPI Cards Grid - Single cohesive base with semantic highlights only for Pass/Fail */}
            <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
              <KpiCard label="Sĩ số lớp" value={String(summary.totalStudents)} />
              <KpiCard label="Đã có điểm" value={`${summary.gradedStudents} / ${summary.totalStudents}`} />
              <KpiCard
                label="Số lượng Đạt"
                value={String(summary.passedCount)}
                detail={`Tỷ lệ: ${summary.gradedStudents > 0 ? Math.round((summary.passedCount / summary.gradedStudents) * 100) : 0}%`}
                variant="success"
              />
              <KpiCard
                label="Không đạt (Rớt)"
                value={String(summary.failedCount)}
                detail={`Tỷ lệ: ${summary.gradedStudents > 0 ? Math.round((summary.failedCount / summary.gradedStudents) * 100) : 0}%`}
                variant="danger"
              />
              <KpiCard
                label="Điểm TB lớp"
                value={summary.averageScore !== null && summary.averageScore !== undefined ? String(summary.averageScore) : "—"}
              />
            </div>

            {/* Grade Distribution Bar - Minimalist with semantic highlights only for A and F */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Phổ điểm môn học
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.gradeDistribution || {}).map(([grade, count]) => {
                  const isF = grade === "F";
                  const isA = grade === "A";
                  return (
                    <div
                      key={grade}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono ${
                        isF
                          ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                          : isA
                          ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="font-semibold">{grade}:</span>
                      <span
                        className={
                          isF
                            ? "font-medium text-rose-500"
                            : isA
                            ? "font-medium text-emerald-500"
                            : "font-medium text-slate-500 dark:text-slate-400"
                        }
                      >
                        {count} SV
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Student Grades Table Grid */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã SV</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4 w-24 text-center">
                      CC ({summary.attendanceCoeff})
                    </th>
                    <th className="py-3 px-4 w-24 text-center">
                      GK ({summary.midtermCoeff})
                    </th>
                    <th className="py-3 px-4 w-24 text-center">
                      CK ({summary.finalCoeff})
                    </th>
                    <th className="py-3 px-4 w-24 text-center">Tổng (Hệ 10)</th>
                    <th className="py-3 px-4 w-16 text-center">Điểm chữ</th>
                    <th className="py-3 px-4 w-16 text-center">Hệ 4</th>
                    <th className="py-3 px-4 w-24 text-center">Kết quả</th>
                    <th className="py-3 px-4">Ghi chú</th>
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
                        <tr key={g.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                            {g.studentCode}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {g.studentName}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              disabled={isLocked}
                              value={inp.att}
                              onChange={(e) => handleInputChange(g.id, "att", e.target.value)}
                              placeholder="0.0"
                              className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 py-1.5 px-2 text-center font-mono font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition disabled:opacity-50"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              disabled={isLocked}
                              value={inp.mid}
                              onChange={(e) => handleInputChange(g.id, "mid", e.target.value)}
                              placeholder="0.0"
                              className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 py-1.5 px-2 text-center font-mono font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition disabled:opacity-50"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              disabled={isLocked}
                              value={inp.fin}
                              onChange={(e) => handleInputChange(g.id, "fin", e.target.value)}
                              placeholder="0.0"
                              className="w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 py-1.5 px-2 text-center font-mono font-semibold text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition disabled:opacity-50"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                            {previewTotal !== null ? previewTotal : "—"}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <GradeLetterBadge letter={previewLetter} />
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-medium text-slate-600 dark:text-slate-400">
                            {previewPoint4}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {previewTotal !== null ? (
                              previewPassed ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                  Đạt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                  <span className="size-1.5 rounded-full bg-rose-500" />
                                  Rớt
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              disabled={isLocked}
                              value={inp.note}
                              onChange={(e) => handleInputChange(g.id, "note", e.target.value)}
                              placeholder="Ghi chú…"
                              className="w-full rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent py-1 px-2 text-xs text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition disabled:opacity-50"
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

function GradeLetterBadge({ letter }: { letter: string }) {
  if (!letter || letter === "—") return <span className="text-slate-400">—</span>;
  const isFail = letter === "F";
  const isA = letter === "A";
  return (
    <span
      className={`font-mono font-bold text-xs ${
        isFail
          ? "text-rose-600 dark:text-rose-400"
          : isA
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-slate-800 dark:text-slate-200"
      }`}
    >
      {letter}
    </span>
  );
}

function KpiCard({
  label,
  value,
  detail,
  variant = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  variant?: "default" | "success" | "danger";
}) {
  const styles = {
    default: {
      border: "border-slate-200 dark:border-slate-800 hover:border-blue-500/30",
      bg: "bg-white dark:bg-slate-900/60",
      valueColor: "text-slate-900 dark:text-white",
    },
    success: {
      border: "border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-500/40",
      bg: "bg-emerald-50/20 dark:bg-emerald-950/10",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    danger: {
      border: "border-rose-200/80 dark:border-rose-900/40 hover:border-rose-500/40",
      bg: "bg-rose-50/20 dark:bg-rose-950/10",
      valueColor: "text-rose-600 dark:text-rose-400",
    },
  }[variant];

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-4 transition shadow-xs`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight ${styles.valueColor}`}>{value}</p>
      {detail && <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">{detail}</p>}
    </div>
  );
}