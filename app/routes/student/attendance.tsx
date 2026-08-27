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
    { title: "EduManage | Chuyên cần & Điểm danh cá nhân" },
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
      subtitle="Theo dõi chi tiết số buổi tham gia lớp, tỷ lệ vắng và điều kiện dự thi kết thúc học phần"
      icon={<ClipboardCheckIcon size={24} className="text-emerald-500" />}
    >
      <div className="space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-300 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md p-4.5 rounded-2xl border border-slate-800 shadow-xl">
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
                <option value="ALL">Tất cả các năm</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
              </select>
            </div>

            <button
              onClick={loadAttendance}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Lọc kết quả
            </button>
          </div>

          <button
            onClick={loadAttendance}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors self-end sm:self-center cursor-pointer"
            title="Làm mới"
          >
            <RefreshIcon size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <CalendarIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Học phần đang học</div>
              <div className="text-2xl font-bold text-slate-100 mt-0.5">{kpiStats.total}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Đủ điều kiện thi</div>
              <div className="text-2xl font-bold text-emerald-400 mt-0.5">{kpiStats.safe}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangleIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Nguy cơ cấm thi</div>
              <div className="text-2xl font-bold text-amber-400 mt-0.5">{kpiStats.atRisk}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <UserXIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Bị cấm thi</div>
              <div className="text-2xl font-bold text-rose-400 mt-0.5">{kpiStats.banned}</div>
            </div>
          </div>
        </div>

        {/* Subjects List Grid */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshIcon size={32} className="animate-spin text-emerald-400" />
            <span className="text-sm">Đang tải bảng chuyên cần của bạn...</span>
          </div>
        ) : summaries.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <CalendarIcon size={40} className="text-slate-600" />
            <div className="text-base font-semibold text-slate-200">Không có dữ liệu lớp học phần</div>
            <p className="text-xs text-slate-500 max-w-sm">
              Bạn chưa đăng ký lớp học phần nào trong học kỳ này hoặc giảng viên chưa tạo buổi học.
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
                  className={`rounded-2xl border p-5 backdrop-blur-md transition-all shadow-lg flex flex-col justify-between ${
                    isBanned
                      ? "bg-rose-950/20 border-rose-500/40 shadow-rose-950/20"
                      : isAtRisk
                      ? "bg-amber-950/20 border-amber-500/40 shadow-amber-950/20"
                      : "bg-slate-900/60 border-slate-800 shadow-slate-950/30"
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-xs font-mono text-emerald-400 font-semibold">
                          {item.subjectClassCode}
                        </div>
                        <h3 className="text-base font-bold text-slate-100 mt-0.5 leading-snug">
                          {item.subjectName}
                        </h3>
                        <div className="text-xs text-slate-400 mt-1">
                          GV: <strong className="text-slate-300">{item.teacherName || "Chưa phân công"}</strong> • {item.credits} tín chỉ
                        </div>
                      </div>

                      <div>
                        {isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md shadow-rose-950/50 animate-pulse">
                            🚫 CẤM THI
                          </span>
                        ) : isAtRisk ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            ⚠️ CẢNH BÁO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✅ ĐỦ ĐIỀU KIỆN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Absence Rate Progress Bar */}
                    <div className="space-y-1.5 my-4 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-400">Tỷ lệ vắng học</span>
                        <span
                          className={`font-bold font-mono ${
                            isBanned
                              ? "text-rose-400 text-sm"
                              : isAtRisk
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {absenceRate}% / 20% (Ngưỡng cấm thi)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
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
                        <p className="text-[11px] text-rose-400 font-semibold mt-1">
                          * Bạn đã vắng quá 20% số tiết theo quy chế và bị cấm thi kết thúc học phần này.
                        </p>
                      )}
                      {isAtRisk && (
                        <p className="text-[11px] text-amber-400 font-semibold mt-1">
                          * Bạn đang ở mức nguy cơ cao, nếu vắng thêm sẽ bị cấm thi.
                        </p>
                      )}
                    </div>

                    {/* Detail Counters */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4">
                      <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                        <div className="text-[11px] text-slate-400">Đã học</div>
                        <div className="font-bold text-slate-100 mt-0.5">{item.completedSessions} / {item.totalPlannedSessions}</div>
                      </div>
                      <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                        <div className="text-[11px] text-emerald-400">Có mặt</div>
                        <div className="font-bold text-emerald-300 mt-0.5">{item.attendedSessions}</div>
                      </div>
                      <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        <div className="text-[11px] text-amber-400">Đi muộn</div>
                        <div className="font-bold text-amber-300 mt-0.5">{item.lateSessions}</div>
                      </div>
                      <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                        <div className="text-[11px] text-rose-400">Vắng mặt</div>
                        <div className="font-bold text-rose-300 mt-0.5">{item.unexcusedAbsentSessions + item.excusedAbsentSessions}</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Score & Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-slate-400">Điểm chuyên cần:</span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        {item.attendanceScore !== undefined ? item.attendanceScore.toFixed(1) : "10.0"}
                      </span>
                      <span className="text-xs text-slate-500">/ 10</span>
                    </div>

                    <button
                      onClick={() => handleOpenDetails(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer hover:border-slate-600"
                    >
                      Xem nhật ký từng buổi ➔
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div>
                <div className="text-xs font-mono font-semibold text-emerald-400">
                  {selectedSubject.subjectClassCode}
                </div>
                <h2 className="text-base font-bold text-slate-100 mt-0.5">
                  Nhật ký điểm danh: {selectedSubject.subjectName}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  Điểm chuyên cần dự kiến: <strong className="text-emerald-400">{selectedSubject.attendanceScore} / 10</strong> • Tỷ lệ vắng: <strong>{selectedSubject.absenceRate}%</strong>
                </div>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="size-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {!selectedSubject.records || selectedSubject.records.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Chưa có nhật ký buổi học nào được ghi nhận.
                </div>
              ) : (
                selectedSubject.records.map((rec) => {
                  const status = rec.status;
                  return (
                    <div
                      key={rec.sessionId}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-6 items-center justify-center rounded-md bg-slate-800 text-slate-300 font-bold text-[11px]">
                          {rec.sessionNumber}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-200">
                            Buổi {rec.sessionNumber} ({rec.sessionDate || "Lịch định kỳ"})
                          </div>
                          {rec.note && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {rec.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {status === "PRESENT" ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            🟢 Có mặt
                          </span>
                        ) : status === "LATE" ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            🟡 Muộn {rec.lateMinutes || 15}p
                          </span>
                        ) : status === "EXCUSED" ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            🔵 Có phép
                          </span>
                        ) : status === "UNEXCUSED" ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            🔴 Vắng không phép
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs text-slate-500 bg-slate-800">
                            Chưa học
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-800/40 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
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
