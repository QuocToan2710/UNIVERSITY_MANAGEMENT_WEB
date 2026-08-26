import { useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "../confirm-modal";
import { EmptyState } from "../empty-state";
import { StatusBadge } from "../status-badge";
import {
  BookOpenIcon,
  CheckIcon,
  CloseIcon,
  CourseIcon,
  DownloadIcon,
  GraduationCapIcon,
  PlusIcon,
  SearchIcon,
  StudentIcon,
  TrashIcon,
  UserCheckIcon,
  UsersIcon,
} from "../icons";
import { apiListRequest, apiRequest } from "../../lib/api";
import { exportToExcel } from "../../lib/excel";
import { enrollmentService } from "../../services/enrollment.service";
import type { ClassGroup, Student } from "../../types/management";
import type { BatchEnrollmentResult, EnrollmentRecord } from "../../types/enrollment";

interface EnrollmentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectClass: {
    id: number;
    subjectClassCode: string;
    name: string;
    maxCapacity?: number;
    semester?: string;
    academicYear?: string;
    teacherName?: string;
  };
  onSuccess?: () => void;
}

export function EnrollmentManagementModal({
  isOpen,
  onClose,
  subjectClass,
  onSuccess,
}: EnrollmentManagementModalProps) {
  const [activeTab, setActiveTab] = useState<"enrolled" | "byClass" | "byStudent">("enrolled");
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Tab 2: By Class Group
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<number | "">("");
  const [submittingClassGroup, setSubmittingClassGroup] = useState(false);

  // Tab 3: By Individual Students
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<(string | number)[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [submittingStudents, setSubmittingStudents] = useState(false);

  // Batch Result modal
  const [batchResult, setBatchResult] = useState<BatchEnrollmentResult | null>(null);

  // Delete modal
  const [deletingEnrollment, setDeletingEnrollment] = useState<EnrollmentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadEnrolledData() {
    setLoading(true);
    setError("");
    try {
      const data = await enrollmentService.getEnrollmentsBySubjectClass(subjectClass.id);
      setEnrollments(data);
    } catch (err: any) {
      setError(err?.message || "Không thể tải danh sách sinh viên trong lớp học phần.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAuxiliaryData() {
    try {
      const [cgList, stuList] = await Promise.all([
        apiListRequest<ClassGroup>("/class-groups?size=1000").catch(async () =>
          apiListRequest<ClassGroup>("/class-groups")
        ),
        apiListRequest<Student>("/students?size=1000").catch(async () =>
          apiListRequest<Student>("/students")
        ),
      ]);
      setClassGroups(cgList);
      setAllStudents(stuList);
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    if (isOpen && subjectClass?.id) {
      void loadEnrolledData();
      void loadAuxiliaryData();
      setSelectedStudentIds([]);
      setSelectedClassGroupId("");
      setBatchResult(null);
      setError("");
      setSuccessMsg("");
    }
  }, [isOpen, subjectClass?.id]);

  const currentCount = enrollments.length;
  const maxCap = subjectClass.maxCapacity || 50;
  const capacityPercent = Math.min(100, Math.round((currentCount / maxCap) * 100));

  const filteredEnrollments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return enrollments;
    return enrollments.filter(
      (e) =>
        (e.studentCode || "").toLowerCase().includes(term) ||
        (e.studentName || "").toLowerCase().includes(term)
    );
  }, [enrollments, searchTerm]);

  // Students not currently enrolled
  const enrolledStudentIds = useMemo(() => {
    return new Set(enrollments.map((e) => e.studentId));
  }, [enrollments]);

  const availableStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    return allStudents.filter((s) => {
      if (enrolledStudentIds.has(s.id)) return false;
      if (!term) return true;
      return (
        (s.studentCode || "").toLowerCase().includes(term) ||
        (s.fullName || "").toLowerCase().includes(term) ||
        (s.email || "").toLowerCase().includes(term)
      );
    });
  }, [allStudents, enrolledStudentIds, studentSearch]);

  async function handleDeleteEnrollment() {
    if (!deletingEnrollment) return;
    setDeleting(true);
    setError("");
    try {
      await enrollmentService.deleteEnrollment(deletingEnrollment.id);
      setSuccessMsg(`Đã xóa sinh viên ${deletingEnrollment.studentName || ""} khỏi lớp.`);
      setDeletingEnrollment(null);
      await loadEnrolledData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || "Không thể xóa sinh viên khỏi lớp.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleEnrollClassGroup() {
    if (!selectedClassGroupId) return;
    setSubmittingClassGroup(true);
    setError("");
    setSuccessMsg("");
    setBatchResult(null);
    try {
      const res = await enrollmentService.enrollClassGroup(
        subjectClass.id,
        Number(selectedClassGroupId)
      );
      setBatchResult(res);
      await loadEnrolledData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || "Lỗi khi gán lớp sinh hoạt.");
    } finally {
      setSubmittingClassGroup(false);
    }
  }

  async function handleBatchEnrollStudents() {
    if (selectedStudentIds.length === 0) return;
    setSubmittingStudents(true);
    setError("");
    setSuccessMsg("");
    setBatchResult(null);
    try {
      const res = await enrollmentService.batchEnroll(subjectClass.id, selectedStudentIds);
      setBatchResult(res);
      setSelectedStudentIds([]);
      await loadEnrolledData();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || "Lỗi khi thêm sinh viên vào lớp.");
    } finally {
      setSubmittingStudents(false);
    }
  }

  function toggleStudentSelection(id: string | number) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleSelectAllAvailable() {
    if (selectedStudentIds.length === availableStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents.map((s) => s.id));
    }
  }

  function handleExportExcel() {
    exportToExcel(
      enrollments as unknown as Record<string, unknown>[],
      `Danh_Sach_Lop_${subjectClass.subjectClassCode}`,
      "DanhSachSinhVien",
      [
        { key: "studentCode", header: "Mã Sinh Viên" },
        { key: "studentName", header: "Họ và Tên" },
        { key: "subjectClassCode", header: "Mã Lớp Học Phần" },
        { key: "subjectClassName", header: "Tên Lớp Học Phần" },
        { key: "enrolledAt", header: "Ngày Ghi Danh" },
        { key: "attendanceScore", header: "Điểm Chuyên Cần" },
        { key: "midtermScore", header: "Điểm Giữa Kỳ" },
        { key: "finalScore", header: "Điểm Cuối Kỳ" },
        { key: "totalScore", header: "Điểm Tổng Kết" },
        { key: "letterGrade", header: "Điểm Chữ" },
      ]
    );
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-pink-50/30 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Quản lý Sinh viên Lớp Học Phần
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold font-mono">
                    {subjectClass.subjectClassCode}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {subjectClass.name} • GV: {subjectClass.teacherName || "Chưa phân công"} • Học kỳ: {subjectClass.semester || "HK1"} ({subjectClass.academicYear || "2025-2026"})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Sĩ số & Progress Bar */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Sĩ số lớp:{" "}
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {currentCount}
                </span>{" "}
                / {maxCap} sinh viên ({capacityPercent}%)
              </div>
              <div className="w-32 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    capacityPercent >= 100
                      ? "bg-rose-500"
                      : capacityPercent >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("enrolled")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "enrolled"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <UsersIcon className="w-3.5 h-3.5" />
                Danh sách lớp ({currentCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("byClass")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "byClass"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <GraduationCapIcon className="w-3.5 h-3.5" />
                Gán theo Lớp sinh hoạt
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("byStudent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "byStudent"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Thêm từng SV
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs">
              {successMsg}
            </div>
          )}

          {/* Batch Result Report */}
          {batchResult && (
            <div className="mx-6 mt-4 p-4 bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Kết quả xử lý ghi danh:</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  Thành công: {batchResult.successCount} / {batchResult.totalRequested}
                </span>
              </div>
              {batchResult.successStudentCodes.length > 0 && (
                <div className="text-emerald-700 dark:text-emerald-400">
                  ✓ Đã thêm: {batchResult.successStudentCodes.slice(0, 5).join(", ")}
                  {batchResult.successStudentCodes.length > 5 && ` (+${batchResult.successStudentCodes.length - 5} SV khác)`}
                </div>
              )}
              {batchResult.failedReasons.length > 0 && (
                <div className="text-rose-600 dark:text-rose-400">
                  ✗ Không thể thêm ({batchResult.failedCount}):
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                    {batchResult.failedReasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Body Content */}
          <div className="p-6 flex-1 overflow-y-auto min-h-[300px]">
            {/* TAB 1: DANH SÁCH SINH VIÊN HIỆN TẠI */}
            {activeTab === "enrolled" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Tìm sinh viên theo mã, tên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  {enrollments.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      Xuất Excel
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
                    Đang tải danh sách sinh viên...
                  </div>
                ) : filteredEnrollments.length === 0 ? (
                  <EmptyState
                    title="Chưa có sinh viên nào trong lớp"
                    description="Hãy chuyển sang tab 'Gán theo Lớp sinh hoạt' hoặc 'Thêm từng SV' để thêm sinh viên vào lớp học phần này."
                    actionText="Gán sinh viên ngay"
                    onAction={() => setActiveTab("byClass")}
                  />
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3">STT</th>
                          <th className="px-4 py-3">Mã SV</th>
                          <th className="px-4 py-3">Họ và Tên</th>
                          <th className="px-4 py-3">Ngày Ghi Danh</th>
                          <th className="px-4 py-3 text-center">CC / GK / CK</th>
                          <th className="px-4 py-3 text-center">Tổng kết</th>
                          <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredEnrollments.map((enr, idx) => (
                          <tr
                            key={enr.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                          >
                            <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-2.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                              {enr.studentCode}
                            </td>
                            <td className="px-4 py-2.5 text-slate-900 dark:text-slate-100 font-semibold">
                              {enr.studentName}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString("vi-VN") : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-300">
                              {enr.attendanceScore ?? "—"} / {enr.midtermScore ?? "—"} / {enr.finalScore ?? "—"}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {enr.totalScore != null ? (
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {enr.totalScore.toFixed(1)}{" "}
                                  {enr.letterGrade && `(${enr.letterGrade})`}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => setDeletingEnrollment(enr)}
                                className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition"
                                title="Xóa sinh viên khỏi lớp"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GÁN THEO LỚP SINH HOẠT */}
            {activeTab === "byClass" && (
              <div className="space-y-6 max-w-xl mx-auto py-4">
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-sm">
                    <GraduationCapIcon className="w-4 h-4" />
                    Gán toàn bộ Lớp Hành chính vào Lớp Học phần
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Hệ thống sẽ tự động quét tất cả sinh viên thuộc Lớp sinh hoạt đã chọn và ghi danh vào lớp học phần này (tự động bỏ qua các sinh viên đã có trong lớp hoặc bị trùng lịch).
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Chọn Lớp sinh hoạt / Niên chế:
                  </label>
                  <select
                    value={selectedClassGroupId}
                    onChange={(e) => setSelectedClassGroupId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Chọn một lớp sinh hoạt --</option>
                    {classGroups.map((cg) => (
                      <option key={cg.id} value={cg.id}>
                        {cg.classCode} - {cg.className} ({cg.academicYear || "Toàn khóa"})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={!selectedClassGroupId || submittingClassGroup}
                  onClick={handleEnrollClassGroup}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition"
                >
                  {submittingClassGroup ? (
                    "Đang xử lý gán lớp..."
                  ) : (
                    <>
                      <UserCheckIcon className="w-4 h-4" />
                      Gán toàn bộ sinh viên lớp này vào Học phần
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: THÊM TỪNG SINH VIÊN */}
            {activeTab === "byStudent" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Tìm sinh viên chưa có trong lớp..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllAvailable}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                    >
                      {selectedStudentIds.length === availableStudents.length && availableStudents.length > 0
                        ? "Bỏ chọn tất cả"
                        : "Chọn tất cả"}
                    </button>
                    <button
                      type="button"
                      disabled={selectedStudentIds.length === 0 || submittingStudents}
                      onClick={handleBatchEnrollStudents}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition"
                    >
                      {submittingStudents ? (
                        "Đang thêm..."
                      ) : (
                        <>
                          <PlusIcon className="w-3.5 h-3.5" />
                          Thêm ({selectedStudentIds.length}) sinh viên
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {availableStudents.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Tất cả sinh viên phù hợp đã có trong lớp học phần hoặc không tìm thấy sinh viên nào.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-[350px] overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 w-10">
                            <input
                              type="checkbox"
                              checked={
                                availableStudents.length > 0 &&
                                selectedStudentIds.length === availableStudents.length
                              }
                              onChange={handleSelectAllAvailable}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                          </th>
                          <th className="px-4 py-3">Mã SV</th>
                          <th className="px-4 py-3">Họ và Tên</th>
                          <th className="px-4 py-3">Lớp Hành chính</th>
                          <th className="px-4 py-3">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {availableStudents.map((s) => {
                          const isSelected = selectedStudentIds.includes(s.id);
                          return (
                            <tr
                              key={s.id}
                              onClick={() => toggleStudentSelection(s.id)}
                              className={`cursor-pointer transition ${
                                isSelected
                                  ? "bg-indigo-50/70 dark:bg-indigo-950/30"
                                  : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                              }`}
                            >
                              <td className="px-4 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // handled by row click
                                  className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="px-4 py-2.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                {s.studentCode}
                              </td>
                              <td className="px-4 py-2.5 text-slate-900 dark:text-slate-100 font-semibold">
                                {s.fullName}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                                {s.classGroupName || "—"}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">{s.email || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={Boolean(deletingEnrollment)}
        title="Xác nhận xóa sinh viên khỏi lớp"
        message={`Bạn có chắc chắn muốn xóa sinh viên ${deletingEnrollment?.studentName} (${deletingEnrollment?.studentCode}) khỏi lớp học phần này?`}
        confirmLabel="Xóa khỏi lớp"
        confirmVariant="danger"
        loading={deleting}
        onCancel={() => setDeletingEnrollment(null)}
        onConfirm={handleDeleteEnrollment}
      />
    </>
  );
}