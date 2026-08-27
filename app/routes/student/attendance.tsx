import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import {
  ClipboardCheckIcon,
  RefreshIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  CalendarIcon,
  UserXIcon,
} from "../../components/icons";
import { apiRequest, ApiError } from "../../lib/api";
import { attendanceService } from "../../services/attendance.service";
import type {
  AttendanceRecord,
  StudentAttendanceSummary,
} from "../../types/attendance";
import type { User } from "../../types/management";

export function meta() {
  return [
    { title: "EduManage | Chuyên cần cá nhân" },
    { name: "description", content: "Tra cứu kết quả điểm danh, tỷ lệ vắng và điều kiện dự thi các môn học" },
  ];
}

export default function StudentAttendance() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [summaries, setSummaries] = useState<StudentAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [semester, setSemester] = useState("HK1");
  const [academicYear, setAcademicYear] = useState("2025-2026");

  // Selected subject for detailed session modal
  const [selectedSubject, setSelectedSubject] = useState<StudentAttendanceSummary | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const user = await apiRequest<User>("/users/myInfo");
        setCurrentUser(user);
      } catch {
        navigate("/login", { replace: true });
        return;
      }
      loadAttendance();
    }
    init();
  }, [navigate]);

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");
      const data = await attendanceService.getMyAttendanceSummary(semester, academicYear);
      setSummaries(data || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Không thể tải dữ liệu chuyên cần";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Aggregate Stats
  const kpiStats = useMemo(() => {
    const total = summaries.length;
    const safe = summaries.filter((s) => s.examStatus === "ELIGIBLE").length;
    const atRisk = summaries.filter((s) => s.examStatus === "AT_RISK").length;
    const banned = summaries.filter((s) => s.examStatus === "BANNED").length;
    return { total, safe, atRisk, banned };
  }, [summaries]);

  function handleOpenDetails(item: StudentAttendanceSummary) {
    setSelectedSubject(item);
    setDetailModalOpen(true);
  }

  return (
    <AppShell
      title="Tra cứu Chuyên cần & Điểm danh"
      description="Theo dõi chi tiết số buổi tham gia lớp, tỷ lệ vắng và điều kiện dự thi các môn học"
    >
      <div className="space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-xs">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
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
                <option value="ALL">Tất cả năm học</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
              </select>
            </div>

            <button
              onClick={loadAttendance}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Lọc kết quả
            </button>
          </div>

          <button
            onClick={loadAttendance}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors self-end sm:self-center cursor-pointer"
            title="Làm mới"
          >
            <RefreshIcon size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* 4 Clean KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Học phần đang học</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{kpiStats.total}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Đủ điều kiện thi</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{kpiStats.safe}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangleIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Nguy cơ cấm thi</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{kpiStats.atRisk}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-3.5 shadow-xs">
            <div className="size-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <UserXIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Bị cấm thi</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{kpiStats.banned}</div>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshIcon size={24} className="animate-spin text-cyan-500" />
            <span className="text-xs">Đang tải bảng chuyên cần của bạn...</span>
          </div>
        ) : summaries.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2 shadow-xs">
            <CalendarIcon size={32} className="text-slate-400 dark:text-slate-600" />
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Không có dữ liệu lớp học phần</div>
            <p className="text-xs text-slate-500 max-w-sm">
              Bạn chưa đăng ký lớp học phần nào trong học kỳ này hoặc chưa có buổi học được tạo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaries.map((item) => {
              const isBanned = item.examStatus === "BANNED";
              const isAtRisk = item.examStatus === "AT_RISK";
              const absenceRate = item.absenceRate || 0;

              return (
                <div
                  key={item.enrollmentId}
                  className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                          {item.subjectClassCode}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
                          {item.subjectName}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          GV: <strong className="text-slate-700 dark:text-slate-300">{item.teacherName || "Chưa phân công"}</strong> • {item.credits} tín chỉ
                        </div>
                      </div>

                      <div>
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                            CẤM THI
                          </span>
                        ) : isAtRisk ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                            CẢNH BÁO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            ĐỦ ĐIỀU KIỆN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Clean Progress Bar */}
                    <div className="space-y-1.5 my-3.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Tỷ lệ vắng học</span>
                        <span
                          className={`font-bold font-mono ${
                            isBanned
                              ? "text-rose-600 dark:text-rose-400"
                              : isAtRisk
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {absenceRate}% / 20%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isBanned
                              ? "bg-rose-500"
                              : isAtRisk
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, (absenceRate / 20) * 100)}%` }}
                        />
                      </div>
                      {isBanned && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                          * Đã vượt quá 20% số tiết, bị cấm thi kết thúc học phần.
                        </p>
                      )}
                      {isAtRisk && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                          * Bạn đang ở mức nguy cơ cao, chú ý không vắng thêm.
                        </p>
                      )}
                    </div>

                    {/* Counters */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-400">Đã học</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{item.completedSessions} / {item.totalPlannedSessions}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Có mặt</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{item.attendedSessions}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-amber-600 dark:text-amber-400">Muộn</div>
                        <div className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">{item.lateSessions}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-rose-600 dark:text-rose-400">Vắng</div>
                        <div className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">{item.unexcusedAbsentSessions + item.excusedAbsentSessions}</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Điểm CC:</span>
                      <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                        {item.attendanceScore !== undefined ? item.attendanceScore.toFixed(1) : "10.0"}
                      </span>
                      <span className="text-[11px] text-slate-400">/ 10</span>
                    </div>

                    <button
                      onClick={() => handleOpenDetails(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Chi tiết từng buổi ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Detailed Session Log */}
      {detailModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div>
                <div className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                  {selectedSubject.subjectClassCode}
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Nhật ký điểm danh: {selectedSubject.subjectName}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Điểm chuyên cần: <strong className="text-cyan-600 dark:text-cyan-400">{selectedSubject.attendanceScore} / 10</strong> • Tỷ lệ vắng: <strong>{selectedSubject.absenceRate}%</strong>
                </div>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {!selectedSubject.records || selectedSubject.records.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Chưa có nhật ký buổi học nào được ghi nhận.
                </div>
              ) : (
                selectedSubject.records.map((rec) => {
                  const status = rec.status;
                  return (
                    <div
                      key={rec.sessionId}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          {rec.sessionNumber}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            Buổi {rec.sessionNumber} ({rec.sessionDate || "Lịch định kỳ"})
                          </div>
                          {rec.note && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {rec.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {status === "PRESENT" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            Có mặt
                          </span>
                        ) : status === "LATE" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                            Muộn {rec.lateMinutes || 15}p
                          </span>
                        ) : status === "EXCUSED" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                            Có phép
                          </span>
                        ) : status === "UNEXCUSED" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                            Vắng
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs text-slate-400 bg-slate-100 dark:bg-slate-800">
                            Chưa học
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
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
