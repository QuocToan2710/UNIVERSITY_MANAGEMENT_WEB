import { useEffect, useMemo, useState } from "react";
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
    { title: "EduManage | Báo cáo cấm thi & Chuyên cần" },
    { name: "description", content: "Thống kê danh sách sinh viên bị cấm thi kết thúc học phần do vi phạm chuyên cần" },
  ];
}

export default function AttendanceReports() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bannedList, setBannedList] = useState<BannedStudent[]>([]);
  const [classes, setClasses] = useState<SubjectClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [semester, setSemester] = useState("HK1");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <AppShell
      title="Báo cáo Sinh viên Cấm thi"
      subtitle="Thống kê toàn trường danh sách sinh viên bị cấm thi kết thúc học phần do vi phạm chuyên cần (>20%)"
      icon={<UserXIcon size={24} className="text-rose-500" />}
    >
      <div className="space-y-6">
        {/* Error alert */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-300 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md p-4.5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400">Học kỳ:</label>
              <select
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              <label className="text-xs font-semibold text-slate-400">Năm học:</label>
              <select
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              >
                <option value="ALL">Tất cả năm</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400">Lớp HP:</label>
              <select
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-xs truncate"
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
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
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
                className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={handleExportExcel}
              disabled={bannedList.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <ExportIcon size={15} />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={loadBannedStudents}
              disabled={loading}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshIcon size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <UserXIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Lượt cấm thi</div>
              <div className="text-2xl font-bold text-rose-400 mt-0.5">{kpiStats.totalBanned}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <StudentIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Số sinh viên vi phạm</div>
              <div className="text-2xl font-bold text-slate-100 mt-0.5">{kpiStats.uniqueStudents}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <BuildingIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Lớp HP có SV cấm thi</div>
              <div className="text-2xl font-bold text-amber-400 mt-0.5">{kpiStats.uniqueClasses}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <AlertTriangleIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Tỷ lệ vắng trung bình</div>
              <div className="text-2xl font-bold text-purple-300 mt-0.5">{kpiStats.avgAbsence}%</div>
            </div>
          </div>
        </div>

        {/* Table of Banned Students */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <UserXIcon size={18} className="text-rose-400" />
              <span>Danh sách sinh viên bị Cấm thi học phần</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Tìm thấy {filteredList.length} trường hợp
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshIcon size={28} className="animate-spin text-emerald-400" />
              <span className="text-sm">Đang tải danh sách cấm thi...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <CalendarIcon size={36} className="text-slate-600" />
              <div className="text-base font-medium text-slate-300">Không có sinh viên nào bị cấm thi</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Tất cả sinh viên đều duy trì tỷ lệ chuyên cần tốt hoặc chưa có buổi học nào vượt ngưỡng 20%.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Mã SV & Họ tên</th>
                    <th className="py-3 px-4">Lớp sinh hoạt</th>
                    <th className="py-3 px-4">Lớp học phần & Môn</th>
                    <th className="py-3 px-4 text-center">Số buổi vắng</th>
                    <th className="py-3 px-4 text-center">Tỷ lệ vắng</th>
                    <th className="py-3 px-4 text-center">Điểm CC</th>
                    <th className="py-3 px-4">Lý do & Quy chế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredList.map((item, idx) => (
                    <tr key={item.enrollmentId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100">{item.studentName}</div>
                        <div className="text-xs font-mono text-emerald-400">{item.studentCode}</div>
                        {item.studentEmail && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.studentEmail}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 text-xs">
                        {item.classGroupName || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 text-xs">{item.subjectName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">[{item.subjectClassCode}] {item.subjectClassName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200 text-xs">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">
                          {item.absentSessions} / {item.totalSessions} buổi
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm shadow-rose-950/40">
                          {item.absenceRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400 text-xs">
                        {item.attendanceScore !== undefined ? item.attendanceScore.toFixed(1) : "0.0"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-rose-300 max-w-xs">
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
