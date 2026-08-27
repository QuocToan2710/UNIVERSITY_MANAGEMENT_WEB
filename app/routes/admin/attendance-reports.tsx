import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import {
  UserXIcon,
  SearchIcon,
  RefreshIcon,
  ExportIcon,
  AlertTriangleIcon,
  CalendarIcon,
  BuildingIcon,
  StudentIcon,
  BellIcon,
} from "../../components/icons";
import { apiListRequest, apiRequest, ApiError } from "../../lib/api";
import { attendanceService } from "../../services/attendance.service";
import type { BannedStudent } from "../../types/attendance";
import type { User } from "../../types/management";
import { exportToExcel } from "../../lib/excel";

type SubjectClassOption = {
  id: number;
  subjectClassCode: string;
  name: string;
  semester?: string;
  academicYear?: string;
};

export function meta() {
  return [
    { title: "EduManage | Báo cáo cấm thi" },
    { name: "description", content: "Thống kê danh sách sinh viên bị cấm thi kết thúc học phần do vi phạm chuyên cần" },
  ];
}

/**
 * ActionDropdown 3 chấm (...) cho Báo cáo cấm thi
 */
function ActionDropdown({
  onViewDetails,
  onSendReminder,
}: {
  onViewDetails?: () => void;
  onSendReminder?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleScroll() {
      setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 90;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      const top = openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4;
      const left = Math.max(10, rect.right - 176);
      setCoords({ top, left });
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all shadow-xs active:scale-95 cursor-pointer"
        title="Tùy chọn hành động"
      >
        <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
          className="w-44 origin-top-right rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 text-left"
        >
          {onViewDetails && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onViewDetails();
              }}
              className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-2"
            >
              <StudentIcon size={14} className="text-cyan-500" />
              <span>Xem chi tiết vi phạm</span>
            </button>
          )}

          {onSendReminder && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSendReminder();
              }}
              className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-2"
            >
              <BellIcon size={14} className="text-amber-500" />
              <span>Gửi thông báo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AttendanceReports() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bannedList, setBannedList] = useState<BannedStudent[]>([]);
  const [classes, setClasses] = useState<SubjectClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [semester, setSemester] = useState("HK1");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  // Detail Modal
  const [detailItem, setDetailItem] = useState<BannedStudent | null>(null);

  const rawRoles = (currentUser?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const isAdmin = rawRoles.some((r) => r.includes("ADMIN"));
  const isTeacher = rawRoles.some((r) => r.includes("TEACHER"));

  useEffect(() => {
    async function init() {
      try {
        const user = await apiRequest<User>("/users/myInfo");
        setCurrentUser(user);
        const uRoles = (user.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
        if (!uRoles.some((r) => r.includes("ADMIN") || r.includes("TEACHER"))) {
          navigate("/", { replace: true });
          return;
        }
      } catch {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const scList = await apiListRequest<SubjectClassOption>("/subject-classes");
        setClasses(Array.isArray(scList) ? scList : []);
      } catch {
        // ignore
      }

      loadBannedStudents();
    }
    init();
  }, [navigate]);

  async function loadBannedStudents() {
    try {
      setLoading(true);
      setError("");
      const data = await attendanceService.getBannedStudents(
        semester,
        academicYear,
        selectedClassId ? Number(selectedClassId) : undefined
      );
      setBannedList(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi khi tải danh sách cấm thi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Filtered List
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return bannedList;
    const q = searchTerm.toLowerCase();
    return bannedList.filter(
      (s) =>
        s.studentCode.toLowerCase().includes(q) ||
        s.studentName.toLowerCase().includes(q) ||
        s.subjectClassName.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q) ||
        (s.classGroupName && s.classGroupName.toLowerCase().includes(q))
    );
  }, [bannedList, searchTerm]);

  // Aggregate Stats
  const kpiStats = useMemo(() => {
    const totalBanned = bannedList.length;
    const uniqueStudents = new Set(bannedList.map((b) => b.studentId)).size;
    const uniqueClasses = new Set(bannedList.map((b) => b.subjectClassId)).size;
    const avgAbsence =
      totalBanned > 0
        ? (bannedList.reduce((acc, curr) => acc + (curr.absenceRate || 0), 0) / totalBanned).toFixed(1)
        : "0.0";
    return { totalBanned, uniqueStudents, uniqueClasses, avgAbsence };
  }, [bannedList]);

  // Export to Excel
  function handleExportExcel() {
    if (bannedList.length === 0) return;
    const data = filteredList.map((item, idx) => ({
      STT: idx + 1,
      "Mã sinh viên": item.studentCode,
      "Họ và tên": item.studentName,
      Email: item.studentEmail || "-",
      "Lớp sinh hoạt": item.classGroupName || "-",
      "Mã lớp HP": item.subjectClassCode,
      "Tên môn học": item.subjectName,
      "Học kỳ": item.semester,
      "Năm học": item.academicYear,
      "Số buổi vắng": item.absentSessions,
      "Tỷ lệ vắng (%)": `${item.absenceRate}%`,
      "Điểm chuyên cần": item.attendanceScore,
      "Lý do cấm thi": item.reason,
    }));
    exportToExcel(data, `DanhSachCamThi_${semester}_${academicYear}`);
  }

  function handleSendReminder(item: BannedStudent) {
    setSuccessMsg(`Đã gửi thông báo nhắc nhở quyết định cấm thi đến sinh viên ${item.studentName} (${item.studentCode}).`);
  }

  return (
    <AppShell
      title="Báo cáo Cấm thi & Chuyên cần"
      description="Thống kê danh sách sinh viên bị cấm thi kết thúc học phần do vi phạm quy chế chuyên cần"
    >
      <div className="space-y-6">
        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-xs">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700 font-bold ml-4">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center justify-between shadow-xs">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Học kỳ:</label>
              <select
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <option value="ALL">Tất cả học kỳ</option>
                <option value="HK1">Học kỳ 1 (HK1)</option>
                <option value="HK2">Học kỳ 2 (HK2)</option>
                <option value="HK3">Học kỳ hè (HK3)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Năm học:</label>
              <select
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                <option value="ALL">Tất cả năm</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lớp HP:</label>
              <select
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-xs truncate"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Tất cả lớp học phần</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.subjectClassCode}] {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadBannedStudents}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Lọc danh sách
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial">
              <SearchIcon size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã SV, tên SV, môn..."
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={handleExportExcel}
              disabled={bannedList.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <ExportIcon size={15} />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={loadBannedStudents}
              disabled={loading}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshIcon size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 4 Clean KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="size-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <UserXIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Lượt cấm thi</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{kpiStats.totalBanned}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <StudentIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Số sinh viên vi phạm</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{kpiStats.uniqueStudents}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <BuildingIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Lớp HP có SV cấm thi</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{kpiStats.uniqueClasses}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <AlertTriangleIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tỷ lệ vắng trung bình</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{kpiStats.avgAbsence}%</div>
            </div>
          </div>
        </div>

        {/* Banned Table */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserXIcon size={18} className="text-rose-500" />
              <span>Danh sách sinh viên bị Cấm thi học phần</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filteredList.length} trường hợp
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshIcon size={24} className="animate-spin text-cyan-500" />
              <span className="text-xs">Đang tải danh sách cấm thi...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
              <CalendarIcon size={32} className="text-slate-400 dark:text-slate-600" />
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Không có sinh viên nào bị cấm thi</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Tất cả sinh viên đều duy trì tỷ lệ chuyên cần tốt hoặc chưa có buổi học nào vượt ngưỡng 20%.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã SV & Họ tên</th>
                    <th className="py-3 px-4">Lớp sinh hoạt</th>
                    <th className="py-3 px-4">Lớp học phần & Môn</th>
                    <th className="py-3 px-4 text-center">Số buổi vắng</th>
                    <th className="py-3 px-4 text-center">Tỷ lệ vắng</th>
                    <th className="py-3 px-4 text-center">Điểm CC</th>
                    <th className="py-3 px-4">Lý do & Quy chế</th>
                    <th className="py-3 px-4 w-20 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.map((item, idx) => (
                    <tr key={item.enrollmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{item.studentName}</div>
                        <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">{item.studentCode}</div>
                        {item.studentEmail && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.studentEmail}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {item.classGroupName || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{item.subjectName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">[{item.subjectClassCode}] {item.subjectClassName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {item.absentSessions} / {item.totalSessions} buổi
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                          {item.absenceRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                        {item.attendanceScore !== undefined ? item.attendanceScore.toFixed(1) : "0.0"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                        {item.reason}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <ActionDropdown
                          onViewDetails={() => setDetailItem(item)}
                          onSendReminder={() => handleSendReminder(item)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal View Detail */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1.5">
              <UserXIcon size={18} className="text-rose-500" />
              <span>Chi tiết vi phạm chuyên cần</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Hồ sơ vi phạm quy chế dự thi của sinh viên.
            </p>

            <div className="space-y-2.5 text-xs mb-5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between">
                <span className="text-slate-500">Sinh viên:</span>
                <strong className="text-slate-900 dark:text-slate-100">{detailItem.studentName} ({detailItem.studentCode})</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between">
                <span className="text-slate-500">Lớp sinh hoạt:</span>
                <span className="text-slate-700 dark:text-slate-300">{detailItem.classGroupName || "-"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between">
                <span className="text-slate-500">Học phần:</span>
                <span className="text-slate-700 dark:text-slate-300">{detailItem.subjectName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between">
                <span className="text-slate-500">Số buổi vắng:</span>
                <strong className="text-rose-600 dark:text-rose-400">{detailItem.absentSessions} / {detailItem.totalSessions} buổi ({detailItem.absenceRate}%)</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between">
                <span className="text-slate-500">Điểm chuyên cần:</span>
                <strong className="text-rose-600 dark:text-rose-400">{detailItem.attendanceScore} (Khóa điểm thi)</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                <span className="text-rose-700 dark:text-rose-300 font-semibold block mb-0.5">Kết luận kỷ luật:</span>
                <span className="text-rose-600 dark:text-rose-400">{detailItem.reason}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
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
