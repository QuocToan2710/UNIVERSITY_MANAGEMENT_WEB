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
import { exportToExcel } from "../lib/excel";
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
      const [u, avail, myEnr, stuList] = await Promise.all([
        apiRequest<User>("/users/myInfo").catch(() => null),
        enrollmentService.getAvailableClasses(
          selectedSemester === "ALL" ? "" : selectedSemester,
          selectedAcademicYear === "ALL" ? "" : selectedAcademicYear
        ).catch(() => []),
        enrollmentService.getMyRegistrations(
          selectedSemester === "ALL" ? "" : selectedSemester,
          selectedAcademicYear === "ALL" ? "" : selectedAcademicYear
        ).catch(() => []),
        apiListRequest<Student>("/students?size=100").catch(() => []),
      ]);

      setCurrentUser(u);
      setAvailableClasses(avail || []);
      setMyEnrollments(myEnr || []);
      setStudents(stuList || []);
      if (stuList && stuList.length > 0 && selectedStudentId === "") {
        setSelectedStudentId(stuList[0].id);
      }
    } catch (reason: any) {
      const err = reason as ApiError;
      if (err.status === 401) navigate("/login");
      else setError(err.message || "Không thể tải dữ liệu đăng ký học phần.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [selectedSemester, selectedAcademicYear]);

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
    } catch (err: any) {
      setError(err?.message || "Đăng ký học phần thất bại.");
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
    try {
      await enrollmentService.cancelRegistrationById(cancelingEnrollment.id);
      setSuccessMsg(`Đã hủy đăng ký môn: ${cancelingEnrollment.subjectClassName || cancelingEnrollment.subjectName}`);
      setCancelingEnrollment(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Không thể hủy đăng ký học phần.");
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
      description="Đăng ký môn học, kiểm tra thời khóa biểu và theo dõi học phần đã đăng ký."
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
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sinh viên chọn lớp học phần phù hợp với lộ trình đào tạo và kiểm tra sĩ số lớp.
                </p>
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
                <table className="w-full min-w-[800px] text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-6 py-4">Mã LHP</th>
                      <th className="px-6 py-4">Tên Lớp Học Phần</th>
                      <th className="px-6 py-4">Môn Học</th>
                      <th className="px-6 py-4 text-center">Tín Chỉ</th>
                      <th className="px-6 py-4">Giảng Viên</th>
                      <th className="px-6 py-4">Lịch Học & Phòng</th>
                      <th className="px-6 py-4 text-center">Sĩ Số</th>
                      <th className="px-6 py-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
                    {visibleAvailableClasses.map((item) => {
                      const isFull = item.maxCapacity > 0 && item.currentCapacity >= item.maxCapacity;
                      const isReg = item.isEnrolled;
                      const isProcessing = registeringId === item.id;
                      const capacityPct = item.maxCapacity > 0 ? Math.min(100, Math.round((item.currentCapacity / item.maxCapacity) * 100)) : 0;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isReg
                              ? "bg-blue-50/40 dark:bg-cyan-950/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="px-6 py-4 font-bold font-mono text-blue-600 dark:text-cyan-400">
                            {item.subjectClassCode}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                            {item.name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.subjectName}</span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              ({item.subjectCode})
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {item.credit} TC
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {item.teacherName || <span className="italic text-slate-400">Chưa phân công</span>}
                          </td>
                          <td className="px-6 py-4">
                            {item.schedules && item.schedules.length > 0 ? (
                              <div className="space-y-1">
                                {item.schedules.map((s, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                    <span className="font-bold text-blue-600 dark:text-cyan-400">
                                      Thứ {s.dayOfWeek}:
                                    </span>
                                    <span>
                                      {s.startTime?.slice(0, 5)} - {s.endTime?.slice(0, 5)}
                                    </span>
                                    {s.room && (
                                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">
                                        {s.room}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Chưa xếp lịch</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {item.currentCapacity} / {item.maxCapacity || 50}
                              </div>
                              <div className="w-16 mx-auto bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    isFull ? "bg-red-500" : capacityPct >= 80 ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${capacityPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isReg ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                <CheckIcon size={14} />
                                Đã ĐK
                              </span>
                            ) : isFull ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                                Hết chỗ
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => void handleRegister(item)}
                                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
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
                <table className="w-full min-w-[800px] text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-6 py-4">STT</th>
                      <th className="px-6 py-4">Mã LHP</th>
                      <th className="px-6 py-4">Tên Lớp Học Phần</th>
                      <th className="px-6 py-4">Môn Học</th>
                      <th className="px-6 py-4 text-center">Số TC</th>
                      <th className="px-6 py-4">Ngày Đăng Ký</th>
                      <th className="px-6 py-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
                    {myEnrollments.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-bold font-mono text-blue-600 dark:text-cyan-400">
                          {item.subjectClassCode}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                          {item.subjectClassName}
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          {item.subjectName} ({item.subjectCode})
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {item.credit || 0} TC
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString("vi-VN") : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setCancelingEnrollment(item)}
                            className="px-3 py-1 rounded-xl text-red-600 hover:bg-red-500/10 text-xs font-semibold inline-flex items-center gap-1 transition"
                          >
                            <TrashIcon size={14} />
                            Hủy môn
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-950/60 font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-white/10">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                        Tổng cộng ({myEnrollments.length} môn):
                      </td>
                      <td className="px-6 py-4 text-center text-blue-600 dark:text-cyan-400">
                        {totalRegisteredCredits} TC
                      </td>
                      <td colSpan={2}></td>
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
        message={`Bạn có chắc chắn muốn rút khỏi lớp học phần ${cancelingEnrollment?.subjectClassName} (${cancelingEnrollment?.subjectClassCode})?`}
        confirmLabel="Hủy đăng ký"
        confirmVariant="danger"
        loading={canceling}
        onCancel={() => setCancelingEnrollment(null)}
        onConfirm={handleCancelRegistration}
      />
    </AppShell>
  );
}