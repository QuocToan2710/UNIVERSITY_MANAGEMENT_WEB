import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ConfirmModal } from "../components/confirm-modal";
import { EmptyState } from "../components/empty-state";
import {
  BookOpenIcon,
  CheckIcon,
  CloseIcon,
  CourseIcon,
  DownloadIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
} from "../components/icons";
import { apiListRequest, apiRequest, ApiError } from "../lib/api";
import { getCachedUser } from "../lib/auth";
import { exportToExcel } from "../lib/excel";
import { formatDateTime } from "../lib/formatters";
import { enrollmentService } from "../services/enrollment.service";
import type { AvailableSubjectClass, EnrollmentRecord } from "../types/enrollment";
import type { Student, User } from "../types/management";

export function meta() {
  return [
    { title: "EduManage | Đăng ký học phần" },
    { name: "description", content: "Cổng đăng ký tín chỉ và theo dõi lớp học phần trực tuyến" },
  ];
}

const MAX_CREDITS_PER_SEMESTER = 24;

export default function CourseRegistration() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCachedUser<User>());

  // Admin testing student selector
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | "">("");

  // Filter state (default "ALL" to show all open classes immediately)
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("ALL");

  const [availableClasses, setAvailableClasses] = useState<AvailableSubjectClass[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [cancelingEnrollment, setCancelingEnrollment] = useState<EnrollmentRecord | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelModalError, setCancelModalError] = useState("");

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"available" | "registered">("available");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const rawRoles = (currentUser?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoles = rawRoles.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoles.includes("ADMIN") || (currentUser?.username || "").toLowerCase() === "admin";

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const targetStuId = isAdmin && selectedStudentId !== "" ? Number(selectedStudentId) : undefined;
      const [u, avail, myEnr, stuList] = await Promise.all([
        apiRequest<User>("/users/myInfo").catch(() => null),
        enrollmentService.getAvailableClasses(
          selectedSemester === "ALL" ? "" : selectedSemester,
          selectedAcademicYear === "ALL" ? "" : selectedAcademicYear,
          targetStuId
        ).catch(() => []),
        enrollmentService.getMyRegistrations(
          selectedSemester === "ALL" ? "" : selectedSemester,
          selectedAcademicYear === "ALL" ? "" : selectedAcademicYear,
          targetStuId
        ).catch(() => []),
        apiListRequest<Student>("/students?size=100").catch(() => []),
      ]);

      setCurrentUser(u);
      setAvailableClasses(avail || []);
      setMyEnrollments(myEnr || []);
      setStudents(stuList || []);
      if (stuList && stuList.length > 0 && selectedStudentId === "") {
        setSelectedStudentId(Number(stuList[0].id));
      }
    } catch (reason: unknown) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải dữ liệu đăng ký học phần.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [selectedSemester, selectedAcademicYear, selectedStudentId]);

  // Open cancel modal with cleaned error
  function openCancelModal(enrollment: EnrollmentRecord) {
    setCancelModalError("");
    setCancelingEnrollment(enrollment);
  }

  // Statistics
  const totalRegisteredCredits = useMemo(() => {
    return myEnrollments.reduce((sum, item) => sum + (item.credit || 0), 0);
  }, [myEnrollments]);


  // Filter available classes
  const visibleAvailableClasses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return availableClasses;
    return availableClasses.filter((c) => {
      const haystack = `${c.subjectCode || ""} ${c.subjectName || ""} ${c.subjectClassCode || ""} ${c.name || ""} ${c.teacherName || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [availableClasses, search]);

  // Handle register
  async function handleRegister(subjectClass: AvailableSubjectClass) {
    if (totalRegisteredCredits + (subjectClass.credit || 0) > MAX_CREDITS_PER_SEMESTER) {
      setError(`Vượt quá số tín chỉ tối đa trong học kỳ (${MAX_CREDITS_PER_SEMESTER} tín chỉ).`);
      return;
    }

    setRegisteringId(subjectClass.id);
    setError("");
    setSuccessMsg("");
    try {
      const targetStuId = isAdmin && selectedStudentId !== "" ? Number(selectedStudentId) : undefined;
      await enrollmentService.registerClass(subjectClass.id, targetStuId);
      setSuccessMsg(`Đăng ký thành công học phần: ${subjectClass.name} (${subjectClass.subjectClassCode})`);
      await loadData();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr?.message || "Đăng ký học phần thất bại.");
    } finally {
      setRegisteringId(null);
    }
  }

  // Handle cancel registration
  async function handleCancelRegistration() {
    if (!cancelingEnrollment) return;
    setCanceling(true);
    setError("");
    setSuccessMsg("");
    setCancelModalError("");
    try {
      await enrollmentService.cancelRegistrationById(cancelingEnrollment.id);
      setSuccessMsg(`Đã hủy đăng ký môn: ${cancelingEnrollment.subjectClassName || cancelingEnrollment.subjectName}`);
      setCancelingEnrollment(null);
      await loadData();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const msg = apiErr?.message || "Không thể hủy đăng ký học phần.";
      setCancelModalError(msg);
      setError(msg);
    } finally {
      setCanceling(false);
    }
  }

  function handleExportExcel() {
    exportToExcel(
      myEnrollments as unknown as Record<string, unknown>[],
      `Phieu_Dang_Ky_Hoc_Phan`,
      "DangKyHocPhan",
      [
        { key: "subjectCode", header: "Mã Môn Học" },
        { key: "subjectName", header: "Tên Môn Học" },
        { key: "subjectClassCode", header: "Mã Lớp Học Phần" },
        { key: "subjectClassName", header: "Tên Lớp Học Phần" },
        { key: "credit", header: "Số Tín Chỉ" },
        { key: "semester", header: "Học Kỳ" },
        { key: "academicYear", header: "Năm Học" },
        { key: "enrolledAt", header: "Thời Gian Đăng Ký" },
      ]
    );
  }

  return (
    <AppShell
      title="Đăng ký học phần"
      description=""
    >
      <div className="space-y-6">
        {/* Main Card Container */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header Controls Bar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-blue-400/30 bg-blue-500/10 text-blue-600 dark:text-cyan-300 font-bold">
                <CourseIcon size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                  Cổng Đăng Ký Học Phần
                </h2>
              </div>
            </div>

            {/* Semester & Year Filter Selectors */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {isAdmin && students.length > 0 && (
                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-cyan-300">Hồ sơ SV (Admin):</span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : "")}
                    className="bg-transparent text-xs font-bold text-blue-900 dark:text-cyan-200 focus:outline-none cursor-pointer max-w-[200px]"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id} className="text-slate-900">
                        {s.studentCode} - {s.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Học kỳ:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="text-slate-900">Tất cả</option>
                  <option value="1" className="text-slate-900">Học kỳ 1</option>
                  <option value="2" className="text-slate-900">Học kỳ 2</option>
                  <option value="3" className="text-slate-900">Học kỳ Hè</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Năm học:</span>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="text-slate-900">Tất cả</option>
                  <option value="2024-2025" className="text-slate-900">2024-2025</option>
                  <option value="2025-2026" className="text-slate-900">2025-2026</option>
                  <option value="2026-2027" className="text-slate-900">2026-2027</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => void loadData()}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                title="Làm mới dữ liệu"
              >
                <RefreshIcon size={16} />
              </button>
            </div>
          </div>

          {/* Minimalist Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="p-4 sm:px-6">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tín chỉ đã đăng ký</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-baseline gap-1">
                <span className="text-blue-600 dark:text-cyan-400">{totalRegisteredCredits}</span>
                <span className="text-xs font-normal text-slate-400">/ {MAX_CREDITS_PER_SEMESTER} TC</span>
              </div>
            </div>

            <div className="p-4 sm:px-6">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Số môn đã đăng ký</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {myEnrollments.length} <span className="text-xs font-normal text-slate-400">lớp học phần</span>
              </div>
            </div>

            <div className="p-4 sm:px-6">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tình trạng đăng ký</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang trong thời hạn đăng ký
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-300 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
                <CloseIcon size={16} />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-300 flex items-center justify-between">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-600">
                <CloseIcon size={16} />
              </button>
            </div>
          )}

          {/* Navigation Tabs & Search Controls */}
          <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-start">
              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "available"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <BookOpenIcon size={16} />
                Lớp Học Phần Đang Mở ({availableClasses.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("registered")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "registered"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <CheckIcon size={16} />
                Lớp Đã Đăng Ký ({myEnrollments.length})
              </button>
            </div>

            {activeTab === "available" && (
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Tìm môn học, lớp HP, giảng viên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                />
                <SearchIcon size={16} className="text-slate-400 absolute left-3 top-2.5" />
              </div>
            )}

            {activeTab === "registered" && myEnrollments.length > 0 && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition"
              >
                <DownloadIcon size={16} />
                Xuất Phiếu Đăng Ký (Excel)
              </button>
            )}
          </div>

          {/* TAB 1: DANH SÁCH LỚP HỌC PHẦN ĐANG MỞ */}
          {activeTab === "available" && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
                  Đang tải danh sách học phần...
                </div>
              ) : visibleAvailableClasses.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="Không có lớp học phần nào"
                    description="Hiện tại chưa có lớp học phần nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm."
                  />
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-6 py-3.5">Học phần / Môn học</th>
                      <th className="px-6 py-3.5">Lịch học & Giảng viên</th>
                      <th className="px-6 py-3.5 text-center w-36">Sĩ số</th>
                      <th className="px-6 py-3.5 text-right w-32">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
                    {visibleAvailableClasses.map((item) => {
                      const isFull = item.maxCapacity > 0 && item.currentCapacity >= item.maxCapacity;
                      const isReg = item.isEnrolled;
                      const isProcessing = registeringId === item.id;
                      const capacityPct = item.maxCapacity > 0 ? Math.min(100, Math.round((item.currentCapacity / item.maxCapacity) * 100)) : 0;
                      const remaining = Math.max(0, (item.maxCapacity || 50) - item.currentCapacity);

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isReg
                              ? "bg-blue-50/40 dark:bg-cyan-950/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          {/* 1. Học phần / Môn học */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {item.subjectName}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400 border border-blue-200/70 dark:border-blue-800/50">
                                {item.credit} TC
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">
                                {item.subjectClassCode}
                              </span>
                              <span>·</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                              <span>·</span>
                              <span className="font-mono text-slate-400">({item.subjectCode})</span>
                            </div>
                          </td>

                          {/* 2. Lịch học & Giảng viên */}
                          <td className="px-6 py-4">
                            {item.schedules && item.schedules.length > 0 ? (
                              <div className="space-y-1">
                                {item.schedules.map((s, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-xs">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      Thứ {s.dayOfWeek}:
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                      {s.startTime?.slice(0, 5)} - {s.endTime?.slice(0, 5)}
                                    </span>
                                    {s.room && (
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300">
                                        {s.room}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Chưa xếp lịch</span>
                            )}
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="text-slate-400">GV:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {item.teacherName || <span className="italic text-slate-400">Chưa phân công</span>}
                              </span>
                            </div>
                          </td>

                          {/* 3. Sĩ số */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                <span className={`size-1.5 rounded-full ${isFull ? "bg-rose-500" : capacityPct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} />
                                <span>{item.currentCapacity} / {item.maxCapacity || 50}</span>
                              </div>
                              <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    isFull ? "bg-rose-500" : capacityPct >= 80 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${capacityPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {isFull ? "Hết chỗ" : `Còn ${remaining} chỗ`}
                              </span>
                            </div>
                          </td>

                          {/* 4. Thao tác */}
                          <td className="px-6 py-4 text-right">
                            {isReg ? (() => {
                              const matched = myEnrollments.find(
                                (e) => e.subjectClassId === item.id || (item.enrollmentId && e.id === item.enrollmentId)
                              );
                              const isCompletedOrGraded =
                                matched?.finalScore != null ||
                                matched?.status === "PASSED" ||
                                matched?.status === "FAILED" ||
                                matched?.gradeStatus === "LOCKED" ||
                                matched?.gradeStatus === "PUBLISHED";
                              return (
                                <div className="inline-flex items-center justify-end gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                    <CheckIcon size={14} />
                                    {isCompletedOrGraded ? "Đã hoàn thành" : "Đã ĐK"}
                                  </span>
                                  {(!isCompletedOrGraded || isAdmin) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const target: EnrollmentRecord = matched || {
                                          id: item.enrollmentId || 0,
                                          studentId: typeof selectedStudentId === "number" ? selectedStudentId : 0,
                                          subjectClassId: item.id,
                                          subjectClassName: item.name,
                                          subjectClassCode: item.subjectClassCode,
                                          subjectName: item.subjectName,
                                        };
                                        openCancelModal(target);
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                                      title={isCompletedOrGraded ? "Hủy bản ghi (Quyền Admin)" : "Hủy đăng ký lớp này"}
                                    >
                                      <TrashIcon size={13} />
                                      {isCompletedOrGraded ? "Hủy (Admin)" : "Hủy"}
                                    </button>
                                  )}
                                </div>
                              );
                            })() : isFull ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-semibold">
                                Hết chỗ
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => void handleRegister(item)}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessing ? "Đang ĐK..." : "Đăng ký"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: DANH SÁCH LỚP ĐÃ ĐĂNG KÝ */}
          {activeTab === "registered" && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
                  Đang tải danh sách học phần đã đăng ký...
                </div>
              ) : myEnrollments.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="Chưa có học phần nào được đăng ký"
                    description="Hãy chuyển sang tab 'Lớp Học Phần Đang Mở' để chọn môn và đăng ký học phần."
                    actionText="Xem danh sách môn mở"
                    onAction={() => setActiveTab("available")}
                  />
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-6 py-3.5 w-12 text-center">STT</th>
                      <th className="px-6 py-3.5">Học phần / Môn học</th>
                      <th className="px-6 py-3.5 w-48">Thời gian đăng ký</th>
                      <th className="px-6 py-3.5 text-right w-32">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
                    {myEnrollments.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {item.subjectName}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400 border border-blue-200/70 dark:border-blue-800/50">
                              {item.credit || 0} TC
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">
                              {item.subjectClassCode}
                            </span>
                            <span>·</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{item.subjectClassName}</span>
                            <span>·</span>
                            <span className="font-mono text-slate-400">({item.subjectCode})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            {item.enrolledAt ? formatDateTime(item.enrolledAt) : "—"}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            <span className="size-1 rounded-full bg-emerald-500" />
                            Đã ghi nhận tín chỉ
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.finalScore != null ||
                          item.status === "PASSED" ||
                          item.status === "FAILED" ||
                          item.gradeStatus === "LOCKED" ||
                          item.gradeStatus === "PUBLISHED" ? (
                            isAdmin ? (
                              <button
                                type="button"
                                onClick={() => openCancelModal(item)}
                                className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                                title="Hủy bản ghi đăng ký với quyền Quản trị viên"
                              >
                                <TrashIcon size={14} />
                                Hủy (Admin)
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs font-medium"
                                title="Học phần đã có điểm hoặc đã hoàn thành, không thể hủy"
                              >
                                Đã có điểm
                              </span>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => openCancelModal(item)}
                              className="px-3.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <TrashIcon size={14} />
                              Hủy môn
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-950/60 font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-white/10">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                        Tổng cộng ({myEnrollments.length} môn):
                      </td>
                      <td className="px-6 py-4 text-blue-600 dark:text-cyan-400 font-extrabold text-sm">
                        {totalRegisteredCredits} TC
                      </td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Cancel Registration Modal */}
      <ConfirmModal
        open={Boolean(cancelingEnrollment)}
        title="Xác nhận hủy đăng ký học phần"
        message={`Bạn có chắc chắn muốn rút khỏi lớp học phần ${cancelingEnrollment?.subjectClassName || cancelingEnrollment?.subjectName} (${cancelingEnrollment?.subjectClassCode})?`}
        error={cancelModalError}
        confirmLabel="Hủy đăng ký"
        confirmVariant="danger"
        loading={canceling}
        onCancel={() => {
          setCancelingEnrollment(null);
          setCancelModalError("");
        }}
        onConfirm={handleCancelRegistration}
      />
    </AppShell>
  );
}