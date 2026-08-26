import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import {
  BanknotesIcon,
  CheckIcon,
  CloseIcon,
  CreditCardIcon,
  DownloadIcon,
  RefreshIcon,
  SearchIcon,
  StudentIcon,
  TimeIcon,
} from "../../components/icons";
import { apiListRequest, apiRequest, ApiError } from "../../lib/api";
import { exportToExcel } from "../../lib/excel";
import { tuitionService } from "../../services/tuition.service";
import type {
  RecordPaymentPayload,
  StudentTuitionSummary,
  TuitionDashboardSummary,
  TuitionStatus,
} from "../../types/tuition";
import type { ClassGroup, User } from "../../types/management";

export function meta() {
  return [
    { title: "EduManage | Quản lý & Tra cứu Học phí" },
    { name: "description", content: "Theo dõi chi tiết công nợ học phí, biểu giá tín chỉ và lịch sử nộp tiền" },
  ];
}

/**
 * Dropdown menu 3 chấm (...) cho cột Thao tác (đồng bộ với Thời khóa biểu)
 */
function ActionDropdown({
  onView,
  onPay,
  canPay = false,
}: {
  onView?: () => void;
  onPay?: () => void;
  canPay?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs active:scale-95 cursor-pointer"
        title="Tùy chọn hành động"
      >
        <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-1 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-left">
          {onView && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onView();
              }}
              className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-2"
            >
              Xem chi tiết
            </button>
          )}

          {canPay && onPay && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onPay();
              }}
              className="w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer flex items-center gap-2"
            >
              Thu học phí
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function TuitionPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Common filter state
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("2024-2025");

  // Student view state
  const [mySummary, setMySummary] = useState<StudentTuitionSummary | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  // Admin view state
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<number | "">("");
  const [selectedStatus, setSelectedStatus] = useState<TuitionStatus | "">("");
  const [adminSearch, setAdminSearch] = useState("");
  const [studentsTuition, setStudentsTuition] = useState<StudentTuitionSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [dashboard, setDashboard] = useState<TuitionDashboardSummary | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Modals state
  const [viewingStudentSummary, setViewingStudentSummary] = useState<StudentTuitionSummary | null>(null);
  const [paymentModalStudent, setPaymentModalStudent] = useState<StudentTuitionSummary | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Chuyển khoản");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentDiscount, setPaymentDiscount] = useState<number>(0);
  const [paymentNote, setPaymentNote] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const rawRoles = (currentUser?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoles = rawRoles.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoles.includes("ADMIN") || (currentUser?.username || "").toLowerCase() === "admin";
  const isStaff = userRoles.includes("STAFF") || userRoles.includes("ACCOUNTANT") || isAdmin;

  // 1. Initial user & metadata load
  useEffect(() => {
    async function initUser() {
      try {
        const u = await apiRequest<User>("/users/myInfo");
        setCurrentUser(u);
      } catch (err: any) {
        if (err?.status === 401) navigate("/login");
      }
    }
    void initUser();
  }, []);

  // 2. Load ClassGroups for Admin filter
  useEffect(() => {
    if (isStaff) {
      apiListRequest<ClassGroup>("/class-groups?size=100")
        .then((res) => setClassGroups(res || []))
        .catch(() => {});
    }
  }, [isStaff]);

  // 3. Load Data depending on Role
  async function loadData() {
    setError("");
    if (isStaff) {
      setLoadingAdmin(true);
      try {
        const [dash, pageData] = await Promise.all([
          tuitionService.getDashboardSummary(selectedSemester, selectedAcademicYear).catch(() => null),
          tuitionService.getAllStudentsTuition({
            semester: selectedSemester,
            academicYear: selectedAcademicYear,
            classGroupId: selectedClassGroupId,
            status: selectedStatus,
            search: adminSearch,
          }).catch(() => ({ content: [], totalElements: 0, totalPages: 1 })),
        ]);
        setDashboard(dash);
        setStudentsTuition(pageData.content || []);
        setTotalElements(pageData.totalElements || 0);
      } catch (err: any) {
        setError(err?.message || "Lỗi khi tải dữ liệu học phí.");
      } finally {
        setLoadingAdmin(false);
      }
    } else {
      setLoadingStudent(true);
      try {
        const summary = await tuitionService.getMyTuitionSummary(selectedSemester, selectedAcademicYear);
        setMySummary(summary);
      } catch (err: any) {
        setError(err?.message || "Không thể tải phiếu báo học phí cá nhân.");
      } finally {
        setLoadingStudent(false);
      }
    }
  }

  useEffect(() => {
    if (currentUser) {
      void loadData();
    }
  }, [currentUser, selectedSemester, selectedAcademicYear, selectedClassGroupId, selectedStatus, adminSearch]);

  // Open Payment Modal
  function handleOpenPaymentModal(studentSummary: StudentTuitionSummary) {
    setPaymentModalStudent(studentSummary);
    setPaymentAmount(studentSummary.balanceAmount > 0 ? studentSummary.balanceAmount : 0);
    setPaymentDiscount(studentSummary.discountAmount || 0);
    setPaymentMethod("Chuyển khoản");
    setPaymentRef(`TT_${studentSummary.studentCode}_${Date.now().toString().slice(-6)}`);
    setPaymentNote("");
  }

  // Submit Payment Record
  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentModalStudent || paymentAmount <= 0) return;

    setRecordingPayment(true);
    setError("");
    setSuccessMsg("");
    try {
      const payload: RecordPaymentPayload = {
        studentId: paymentModalStudent.studentId,
        semester: selectedSemester,
        academicYear: selectedAcademicYear,
        paymentAmount: Number(paymentAmount),
        discountAmount: Number(paymentDiscount),
        paymentMethod,
        transactionReference: paymentRef,
        note: paymentNote,
      };
      await tuitionService.recordPayment(payload);
      setSuccessMsg(`Đã ghi nhận thanh toán ${paymentAmount.toLocaleString("vi-VN")} đ cho sinh viên ${paymentModalStudent.fullName} (${paymentModalStudent.studentCode}).`);
      setPaymentModalStudent(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Không thể ghi nhận thanh toán học phí.");
    } finally {
      setRecordingPayment(false);
    }
  }

  // Export Excel for Student
  function handleExportStudentExcel() {
    if (!mySummary) return;
    exportToExcel(
      (mySummary.items || []) as unknown as Record<string, unknown>[],
      `Phieu_Bao_Hoc_Phi_${mySummary.studentCode}_HK${selectedSemester}_${selectedAcademicYear}`,
      "HocPhi",
      [
        { key: "subjectCode", header: "Mã Môn Học" },
        { key: "subjectName", header: "Tên Môn Học" },
        { key: "subjectClassCode", header: "Mã Lớp Học Phần" },
        { key: "subjectClassName", header: "Tên Lớp Học Phần" },
        { key: "credit", header: "Số Tín Chỉ" },
        { key: "pricePerCredit", header: "Đơn Giá / TC" },
        { key: "totalAmount", header: "Thành Tiền (VNĐ)" },
        { key: "status", header: "Trạng Thái" },
      ]
    );
  }

  // Export Excel for Admin
  function handleExportAdminExcel() {
    exportToExcel(
      studentsTuition as unknown as Record<string, unknown>[],
      `Bao_Cao_Cong_No_Hoc_Phi_HK${selectedSemester}_${selectedAcademicYear}`,
      "CongNoHocPhi",
      [
        { key: "studentCode", header: "Mã Sinh Viên" },
        { key: "fullName", header: "Họ và Tên" },
        { key: "classGroupName", header: "Lớp Sinh Hoạt" },
        { key: "majorName", header: "Ngành Học" },
        { key: "totalCredits", header: "Tổng Số TC" },
        { key: "totalAmount", header: "Tổng Học Phí (VNĐ)" },
        { key: "discountAmount", header: "Miễn Giảm (VNĐ)" },
        { key: "paidAmount", header: "Đã Thanh Toán (VNĐ)" },
        { key: "balanceAmount", header: "Còn Nợ (VNĐ)" },
        { key: "statusDescription", header: "Trạng Thái" },
        { key: "dueDate", header: "Hạn Nộp" },
      ]
    );
  }

  // Helper status badge
  function renderStatusBadge(status: TuitionStatus) {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckIcon size={13} />
            Đã nộp đủ
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-cyan-400 text-xs font-bold">
            Nộp một phần
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold">
            Quá hạn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
            Chưa nộp
          </span>
        );
    }
  }

  return (
    <AppShell
      title="Quản lý & Tra cứu Học phí"
      description={
        isStaff
          ? "Tổng hợp công nợ học phí toàn trường, theo dõi thu chi và ghi nhận thanh toán."
          : "Tra cứu phiếu báo học phí cá nhân theo từng học kỳ, biểu giá tín chỉ và hạn nộp tiền."
      }
    >
      <div className="space-y-6">
        {/* Main Card Container */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header Controls Bar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                <BanknotesIcon size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                  {isStaff ? "Quản Lý Học Phí Toàn Trường" : "Phiếu Báo Học Phí Cá Nhân"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Đơn giá quy định: <strong className="text-slate-800 dark:text-slate-200">450.000 VNĐ / tín chỉ</strong>
                </p>
              </div>
            </div>

            {/* Semester & Year Filter Selectors (Visible to Both) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Học kỳ:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
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

          {/* ========================================================================= */}
          {/* VIEW 1: SINH VIÊN (STUDENT VIEW) - STRICTLY PERSONAL */}
          {/* ========================================================================= */}
          {!isStaff && (
            <div className="p-6 space-y-6">
              {loadingStudent ? (
                <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
                  Đang tải phiếu báo học phí cá nhân...
                </div>
              ) : !mySummary ? (
                <EmptyState
                  title="Không tìm thấy thông tin học phí"
                  description="Chưa có dữ liệu học phí cho học kỳ này."
                />
              ) : (
                <div className="space-y-6">
                  {/* Student Info Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 grid place-items-center font-bold">
                        <StudentIcon size={20} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Sinh viên:</div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {mySummary.fullName}{" "}
                          <span className="font-mono text-blue-600 dark:text-cyan-400">({mySummary.studentCode})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400">Lớp:</span>{" "}
                        <strong>{mySummary.classGroupName || mySummary.classGroupCode || "Chưa phân lớp"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Ngành:</span>{" "}
                        <strong>{mySummary.majorName || "Chưa cập nhật"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Trạng thái:</span>{" "}
                        {renderStatusBadge(mySummary.status)}
                      </div>
                    </div>
                  </div>

                  {/* 3 Summary Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/40">
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng học phí phát sinh</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {mySummary.totalAmount.toLocaleString("vi-VN")} <span className="text-xs font-normal text-slate-400">VNĐ</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {mySummary.totalCredits} tín chỉ × 450.000 đ
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                      <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Đã thanh toán</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {mySummary.paidAmount.toLocaleString("vi-VN")} <span className="text-xs font-normal text-emerald-500/70">VNĐ</span>
                      </div>
                      {mySummary.discountAmount > 0 && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                          (Miễn giảm: {mySummary.discountAmount.toLocaleString("vi-VN")} đ)
                        </div>
                      )}
                    </div>

                    <div className="p-5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                      <div className="text-xs font-medium text-red-700 dark:text-red-400">Còn phải nộp (Công nợ)</div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                        {mySummary.balanceAmount.toLocaleString("vi-VN")} <span className="text-xs font-normal text-red-500/70">VNĐ</span>
                      </div>
                      <div className="text-[11px] text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <TimeIcon size={12} />
                        Hạn nộp: {mySummary.dueDate || "Đang cập nhật"}
                      </div>
                    </div>
                  </div>

                  {/* Course Fee Breakdown Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Chi Tiết Các Học Phần Phát Sinh Học Phí ({(mySummary.items || []).length} môn)
                      </h3>
                      {(mySummary.items || []).length > 0 && (
                        <button
                          type="button"
                          onClick={handleExportStudentExcel}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <DownloadIcon size={14} />
                          Xuất Phiếu Báo (Excel)
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <table className="w-full min-w-[700px] text-left text-xs table-auto">
                        <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
                          <tr>
                            <th className="w-12 px-3 py-3.5 text-center">STT</th>
                            <th className="w-28 px-4 py-3.5">Mã LHP</th>
                            <th className="px-4 py-3.5 min-w-[180px]">Tên Lớp Học Phần</th>
                            <th className="px-4 py-3.5 min-w-[160px]">Môn Học</th>
                            <th className="w-20 px-3 py-3.5 text-center">Số TC</th>
                            <th className="w-28 px-4 py-3.5 text-right">Đơn Giá / TC</th>
                            <th className="w-32 px-4 py-3.5 text-right">Thành Tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
                          {(mySummary.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-5 py-8 text-center text-slate-400 italic">
                                Sinh viên chưa đăng ký lớp học phần nào trong học kỳ này.
                              </td>
                            </tr>
                          ) : (
                            mySummary.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                <td className="px-4 py-3 font-bold font-mono text-blue-600 dark:text-cyan-400">
                                  {item.subjectClassCode}
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                                  {item.subjectClassName}
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                  {item.subjectName} <span className="text-slate-400 font-mono text-[11px]">({item.subjectCode})</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    {item.credit} TC
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                  {item.pricePerCredit.toLocaleString("vi-VN")} đ
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                  {item.totalAmount.toLocaleString("vi-VN")} đ
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-950/60 font-bold text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-white/10">
                          <tr>
                            <td colSpan={4} className="px-4 py-3.5 text-right text-slate-600 dark:text-slate-400">
                              Tổng cộng:
                            </td>
                            <td className="px-3 py-3.5 text-center text-blue-600 dark:text-cyan-400 font-extrabold">
                              {mySummary.totalCredits} TC
                            </td>
                            <td className="px-4 py-3.5"></td>
                            <td className="px-4 py-3.5 text-right text-slate-900 dark:text-slate-100 font-extrabold text-sm">
                              {mySummary.totalAmount.toLocaleString("vi-VN")} đ
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: ADMIN / KẾ TOÁN (ADMIN & STAFF MANAGEMENT VIEW) */}
          {/* ========================================================================= */}
          {isStaff && (
            <div className="space-y-6">
              {/* Dashboard KPI Overview */}
              {dashboard && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="p-4 sm:px-6">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tổng học phí phát sinh</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {dashboard.totalTuitionExpected.toLocaleString("vi-VN")} <span className="text-xs font-normal text-slate-400">VNĐ</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {dashboard.totalStudents} sinh viên ({dashboard.totalCreditsEnrolled} TC)
                    </div>
                  </div>

                  <div className="p-4 sm:px-6">
                    <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Tổng thực thu</div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {dashboard.totalTuitionCollected.toLocaleString("vi-VN")} <span className="text-xs font-normal text-emerald-500/70">VNĐ</span>
                    </div>
                    <div className="text-[11px] text-emerald-600/80 mt-0.5">
                      {dashboard.paidCount} SV nộp đủ, {dashboard.partiallyPaidCount} nộp 1 phần
                    </div>
                  </div>

                  <div className="p-4 sm:px-6">
                    <div className="text-[11px] font-medium text-red-600 dark:text-red-400">Tổng công nợ còn lại</div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                      {dashboard.totalTuitionDebt.toLocaleString("vi-VN")} <span className="text-xs font-normal text-red-500/70">VNĐ</span>
                    </div>
                    <div className="text-[11px] text-red-500/80 mt-0.5">
                      {dashboard.unpaidCount} SV chưa nộp, {dashboard.overdueCount} quá hạn
                    </div>
                  </div>

                  <div className="p-4 sm:px-6">
                    <div className="text-[11px] font-medium text-blue-600 dark:text-cyan-400">Tỷ lệ thu hồi học phí</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-cyan-400 mt-1">
                      {dashboard.collectionRatePercent}%
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-blue-600 dark:bg-cyan-400"
                        style={{ width: `${Math.min(100, dashboard.collectionRatePercent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Search & Filters Bar */}
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Class Group Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Lớp SV:</span>
                    <select
                      value={selectedClassGroupId}
                      onChange={(e) => setSelectedClassGroupId(e.target.value ? Number(e.target.value) : "")}
                      className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[150px]"
                    >
                      <option value="" className="text-slate-900">Tất cả lớp</option>
                      {classGroups.map((cg) => (
                        <option key={cg.id} value={cg.id} className="text-slate-900">
                          {cg.classCode} - {cg.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Trạng thái:</span>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as TuitionStatus | "")}
                      className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="" className="text-slate-900">Tất cả</option>
                      <option value="UNPAID" className="text-slate-900">Chưa nộp</option>
                      <option value="PARTIALLY_PAID" className="text-slate-900">Nộp một phần</option>
                      <option value="PAID" className="text-slate-900">Đã nộp đủ</option>
                      <option value="OVERDUE" className="text-slate-900">Quá hạn</option>
                    </select>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Mã SV, họ tên, email..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                    />
                    <SearchIcon size={14} className="text-slate-400 absolute left-2.5 top-2" />
                  </div>
                </div>

                {studentsTuition.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportAdminExcel}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition self-start lg:self-auto"
                  >
                    <DownloadIcon size={16} />
                    Xuất Báo Cáo Công Nợ (Excel)
                  </button>
                )}
              </div>

              {/* Admin Student Tuition Table */}
              <div className="overflow-x-auto">
                {loadingAdmin ? (
                  <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
                    Đang tải danh sách học phí sinh viên...
                  </div>
                ) : studentsTuition.length === 0 ? (
                  <div className="p-6">
                    <EmptyState
                      title="Không tìm thấy sinh viên nào"
                      description="Không có sinh viên nào khớp với bộ lọc học kỳ, lớp hoặc trạng thái hiện tại."
                    />
                  </div>
                ) : (
                  <table className="w-full min-w-[900px] text-left text-xs table-auto">
                    <thead className="bg-slate-100 dark:bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-cyan-300 border-b border-slate-200 dark:border-white/10">
                      <tr>
                        <th className="w-12 px-3 py-3.5 text-center">STT</th>
                        <th className="w-28 px-4 py-3.5">Mã SV</th>
                        <th className="px-4 py-3.5 min-w-[160px]">Họ và Tên</th>
                        <th className="px-4 py-3.5 w-32">Lớp Sinh Hoạt</th>
                        <th className="w-18 px-3 py-3.5 text-center">Số TC</th>
                        <th className="w-32 px-4 py-3.5 text-right">Tổng Học Phí</th>
                        <th className="w-32 px-4 py-3.5 text-right">Đã Nộp</th>
                        <th className="w-32 px-4 py-3.5 text-right">Còn Nợ</th>
                        <th className="w-28 px-3 py-3.5 text-center">Trạng Thái</th>
                        <th className="w-16 px-3 py-3.5 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-800 dark:text-slate-300">
                      {studentsTuition.map((st, index) => (
                        <tr
                          key={st.studentId}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-3 py-3 text-center text-slate-400 font-medium">{index + 1}</td>
                          <td className="px-4 py-3 font-bold font-mono text-blue-600 dark:text-cyan-400">
                            {st.studentCode}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                            {st.fullName}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {st.classGroupName || st.classGroupCode || "—"}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {st.totalCredits} TC
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                            {st.totalAmount.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                            {st.paidAmount.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-bold">
                            {st.balanceAmount.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-3 py-3 text-center">
                            {renderStatusBadge(st.status)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <ActionDropdown
                              onView={() => setViewingStudentSummary(st)}
                              onPay={() => handleOpenPaymentModal(st)}
                              canPay={true}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: GHI NHẬN NỘP TIỀN HỌC PHÍ (RECORD PAYMENT MODAL) */}
      {/* ========================================================================= */}
      {paymentModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 grid place-items-center font-bold">
                  <BanknotesIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Ghi Nhận Thu Học Phí
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {paymentModalStudent.fullName} ({paymentModalStudent.studentCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {/* Debt Summary Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Tổng học phí:</span>
                  <strong className="text-slate-900 dark:text-slate-100 text-sm">
                    {paymentModalStudent.totalAmount.toLocaleString("vi-VN")} đ
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Số tiền còn nợ:</span>
                  <strong className="text-red-600 dark:text-red-400 text-sm">
                    {paymentModalStudent.balanceAmount.toLocaleString("vi-VN")} đ
                  </strong>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số tiền thu (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Payment Method & Ref */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hình thức nộp
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Tiền mặt">Tiền mặt tại quầy</option>
                    <option value="Quẹt thẻ POS">Quẹt thẻ POS</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã tham chiếu / Biên lai
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú giao dịch
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nộp đợt 1 / chuyển qua ngân hàng..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={recordingPayment || paymentAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
                >
                  {recordingPayment ? "Đang xử lý..." : "Xác nhận thu tiền"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: XEM CHI TIẾT PHIẾU BÁO HỌC PHÍ CỦA SINH VIÊN */}
      {/* ========================================================================= */}
      {viewingStudentSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Bảng Kê Học Phí Chi Tiết
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {viewingStudentSummary.fullName} ({viewingStudentSummary.studentCode}) - {viewingStudentSummary.classGroupName || "Chưa phân lớp"}
                </p>
              </div>
              <button
                onClick={() => setViewingStudentSummary(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Financial summary bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Tổng học phí ({viewingStudentSummary.totalCredits} TC):</span>
                  <strong className="text-slate-900 dark:text-slate-100 text-sm">
                    {viewingStudentSummary.totalAmount.toLocaleString("vi-VN")} đ
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Đã thanh toán:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {viewingStudentSummary.paidAmount.toLocaleString("vi-VN")} đ
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Còn nợ:</span>
                  <strong className="text-red-600 dark:text-red-400 text-sm">
                    {viewingStudentSummary.balanceAmount.toLocaleString("vi-VN")} đ
                  </strong>
                </div>
              </div>

              {/* Items table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">STT</th>
                      <th className="px-4 py-2.5">Mã LHP</th>
                      <th className="px-4 py-2.5">Tên Lớp Học Phần</th>
                      <th className="px-4 py-2.5 text-center">Số TC</th>
                      <th className="px-4 py-2.5 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(viewingStudentSummary.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">
                          Chưa có học phần nào được đăng ký trong kỳ.
                        </td>
                      </tr>
                    ) : (
                      viewingStudentSummary.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5 font-mono text-blue-600 dark:text-cyan-400 font-bold">
                            {item.subjectClassCode}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">
                            {item.subjectClassName}
                          </td>
                          <td className="px-4 py-2.5 text-center">{item.credit} TC</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                            {item.totalAmount.toLocaleString("vi-VN")} đ
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {viewingStudentSummary.notes && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold">Lịch sử giao dịch:</span> {viewingStudentSummary.notes}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingStudentSummary(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}