import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ConfirmModal } from "../../components/confirm-modal";
import { StatusBadge } from "../../components/status-badge";
import {
  ClipboardCheckIcon,
  SearchIcon,
  RefreshIcon,
  ExportIcon,
  PlusIcon,
  CalendarIcon,
  UserCheckIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
} from "../../components/icons";
import { apiListRequest, apiRequest, ApiError } from "../../lib/api";
import { attendanceService } from "../../services/attendance.service";
import type {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
} from "../../types/attendance";
import type { User } from "../../types/management";
import { exportToExcel } from "../../lib/excel";

type SubjectClassOption = {
  id: number;
  subjectClassCode: string;
  name: string;
  semester?: string;
  academicYear?: string;
  subjectId?: number;
  teacherId?: number;
};

export function meta() {
  return [
    { title: "EduManage | Điểm danh học phần" },
    { name: "description", content: "Quản lý buổi học, điểm danh sinh viên và tự động tính điểm chuyên cần" },
  ];
}

export default function TeachingAttendance() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<SubjectClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Attendance Taking Modal State
  const [takingModalOpen, setTakingModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [recordSearch, setRecordSearch] = useState("");

  // Auto Generate Modal
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [autoGenTotal, setAutoGenTotal] = useState(15);
  const [autoGenStartDate, setAutoGenStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);

  // New Single Session Modal
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [newSessionNumber, setNewSessionNumber] = useState(1);
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [newSessionRoom, setNewSessionRoom] = useState("");
  const [newSessionTopic, setNewSessionTopic] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);

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
  const isAdmin = rawRoles.some((r) => r.includes("ADMIN"));
  const isTeacher = rawRoles.some((r) => r.includes("TEACHER"));

  useEffect(() => {
    async function init() {
      try {
        const user = await apiRequest<User>("/users/myInfo");
        setCurrentUser(user);
        const uRoles = (user.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
        if (!uRoles.some((r) => r.includes("ADMIN") || r.includes("TEACHER"))) {
          navigate("/student/attendance", { replace: true });
          return;
        }
      } catch {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoadingClasses(true);
        const res = await apiListRequest<SubjectClassOption>("/subject-classes");
        const list = Array.isArray(res) ? res : [];
        setClasses(list);
        if (list.length > 0) {
          setSelectedClassId(list[0].id);
        }
      } catch {
        setError("Không thể tải danh sách lớp học phần");
      } finally {
        setLoadingClasses(false);
      }
    }
    init();
  }, [navigate]);

  useEffect(() => {
    if (!selectedClassId) {
      setSessions([]);
      return;
    }
    loadSessions(selectedClassId);
  }, [selectedClassId]);

  async function loadSessions(classId: number) {
    try {
      setLoadingSessions(true);
      setError("");
      const data = await attendanceService.getSessionsBySubjectClass(classId);
      setSessions(data || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi khi tải danh sách buổi học";
      setError(msg);
    } finally {
      setLoadingSessions(false);
    }
  }

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Handle open taking modal
  async function handleOpenTakingModal(session: AttendanceSession) {
    setActiveSession(session);
    setSessionTopic(session.topic || "");
    setSessionNote(session.note || "");
    setTakingModalOpen(true);
    setRecordSearch("");
    try {
      setLoadingRecords(true);
      const recs = await attendanceService.getSessionRecords(session.id);
      setRecords(recs || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi khi tải bảng điểm danh";
      setError(msg);
    } finally {
      setLoadingRecords(false);
    }
  }

  // Handle Mark All Present
  function handleMarkAllPresent() {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: "PRESENT",
        lateMinutes: 0,
      }))
    );
  }

  // Handle change individual student status
  function handleStatusChange(studentId: number, status: AttendanceStatus) {
    setRecords((prev) =>
      prev.map((r) =>
        r.studentId === studentId
          ? {
              ...r,
              status,
              lateMinutes: status === "LATE" ? (r.lateMinutes || 15) : 0,
            }
          : r
      )
    );
  }

  function handleLateMinutesChange(studentId: number, mins: number) {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, lateMinutes: mins } : r))
    );
  }

  function handleRecordNoteChange(studentId: number, note: string) {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r))
    );
  }

  // Handle Submit Attendance
  async function handleSubmitAttendance() {
    if (!activeSession) return;
    try {
      setSubmittingAttendance(true);
      setError("");
      await attendanceService.submitAttendance(activeSession.id, {
        records: records.map((r) => ({
          studentId: r.studentId,
          enrollmentId: r.enrollmentId,
          status: r.status,
          lateMinutes: r.lateMinutes,
          note: r.note,
        })),
        topic: sessionTopic,
        note: sessionNote,
      });

      setSuccessMsg(`Đã chốt điểm danh buổi ${activeSession.sessionNumber} và tính lại điểm chuyên cần thành công!`);
      setTakingModalOpen(false);
      if (selectedClassId) {
        await loadSessions(selectedClassId);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi khi chốt điểm danh";
      setError(msg);
    } finally {
      setSubmittingAttendance(false);
    }
  }

  // Auto Generate Sessions
  async function handleAutoGenerate() {
    if (!selectedClassId) return;
    try {
      setGenerating(true);
      setError("");
      await attendanceService.autoGenerateSessions({
        subjectClassId: selectedClassId,
        totalSessions: autoGenTotal,
        startDate: autoGenStartDate,
      });
      setSuccessMsg(`Đã sinh tự động ${autoGenTotal} buổi học theo lịch học thành công!`);
      setAutoGenOpen(false);
      await loadSessions(selectedClassId);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi khi sinh tự động buổi học";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }

  // Create Single Session
  async function handleCreateSession() {
    if (!selectedClassId) return;
    try {
      setCreatingSession(true);
      setError("");
      await attendanceService.createSession({
        subjectClassId: selectedClassId,
        sessionNumber: newSessionNumber,
        sessionDate: newSessionDate,
        room: newSessionRoom,
        topic: newSessionTopic,
        lessonCount: 3,
      });
      setSuccessMsg(`Đã tạo Buổi học số ${newSessionNumber} thành công!`);
      setNewSessionOpen(false);
      await loadSessions(selectedClassId);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi khi tạo buổi học";
      setError(msg);
    } finally {
      setCreatingSession(false);
    }
  }

  // Delete Session
  function handleDeleteSession(session: AttendanceSession) {
    setConfirmModal({
      open: true,
      title: "Xóa buổi học",
      message: `Bạn có chắc chắn muốn xóa "${session.name}"? Tất cả bản ghi điểm danh của buổi này sẽ bị xóa.`,
      confirmLabel: "Xóa buổi học",
      confirmVariant: "danger",
      action: async () => {
        try {
          await attendanceService.deleteSession(session.id);
          setSuccessMsg(`Đã xóa "${session.name}" thành công!`);
          if (selectedClassId) {
            await loadSessions(selectedClassId);
          }
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : "Lỗi khi xóa buổi học";
          setError(msg);
        }
      },
    });
  }

  // Filtered records in modal
  const filteredRecords = useMemo(() => {
    if (!recordSearch.trim()) return records;
    const q = recordSearch.toLowerCase();
    return records.filter(
      (r) =>
        r.studentCode.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        (r.classGroupName && r.classGroupName.toLowerCase().includes(q))
    );
  }, [records, recordSearch]);

  // Modal stats
  const modalStats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === "PRESENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const excused = records.filter((r) => r.status === "EXCUSED").length;
    const unexcused = records.filter((r) => r.status === "UNEXCUSED").length;
    return { total, present, late, excused, unexcused };
  }, [records]);

  // Overall class stats
  const overallStats = useMemo(() => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === "COMPLETED").length;
    const pendingSessions = sessions.filter((s) => s.status === "PENDING").length;
    return { totalSessions, completedSessions, pendingSessions };
  }, [sessions]);

  // Export Excel
  function handleExportExcel() {
    if (!selectedClass || sessions.length === 0) return;
    const exportData = sessions.map((s, idx) => ({
      STT: idx + 1,
      "Mã buổi": s.sessionCode,
      "Tên buổi học": s.name,
      "Ngày học": s.sessionDate,
      "Phòng học": s.room || "-",
      "Chủ đề": s.topic || "-",
      "Trạng thái": s.status === "COMPLETED" ? "Đã chốt điểm danh" : "Chưa điểm danh",
      "Sĩ số": s.totalStudents || 0,
      "Có mặt": s.presentStudents || 0,
      "Vắng mặt": s.absentStudents || 0,
      "Đi muộn": s.lateStudents || 0,
    }));
    exportToExcel(exportData, `DiemDanh_${selectedClass.subjectClassCode}`);
  }

  return (
    <AppShell
      title="Điểm danh & Chuyên cần"
      subtitle="Quản lý buổi học, điểm danh sinh viên và tự động tính điểm chuyên cần theo quy chế"
      icon={<ClipboardCheckIcon size={24} className="text-emerald-500" />}
    >
      <div className="space-y-6">
        {/* Top alerts */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-300 font-bold ml-4">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-300 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Control & Selector Header */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="sm:w-80">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Chọn Lớp học phần
              </label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                value={selectedClassId || ""}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                disabled={loadingClasses}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.subjectClassCode}] {c.name} {c.semester ? `(${c.semester} - ${c.academicYear})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedClass && (
              <div className="flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-6 text-xs text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  {selectedClass.semester || "HK1"} - {selectedClass.academicYear || "2025-2026"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setAutoGenStartDate(new Date().toISOString().split("T")[0]);
                setAutoGenOpen(true);
              }}
              disabled={!selectedClassId}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CalendarIcon size={16} />
              <span>Sinh tự động 15 buổi TKB</span>
            </button>

            <button
              onClick={() => {
                setNewSessionNumber(sessions.length + 1);
                setNewSessionDate(new Date().toISOString().split("T")[0]);
                setNewSessionRoom("");
                setNewSessionTopic("");
                setNewSessionOpen(true);
              }}
              disabled={!selectedClassId}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <PlusIcon size={16} />
              <span>Thêm buổi học lẻ / bù</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={sessions.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              title="Xuất danh sách buổi học ra Excel"
            >
              <ExportIcon size={16} />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={() => selectedClassId && loadSessions(selectedClassId)}
              disabled={loadingSessions}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshIcon size={16} className={loadingSessions ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 3 KPI Widget Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <CalendarIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng số buổi học</div>
              <div className="text-2xl font-bold text-slate-100 mt-0.5">{overallStats.totalSessions}</div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Đã chốt điểm danh</div>
              <div className="text-2xl font-bold text-emerald-400 mt-0.5">{overallStats.completedSessions}</div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 p-4.5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <ClockIcon size={24} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Buổi học sắp tới</div>
              <div className="text-2xl font-bold text-amber-400 mt-0.5">{overallStats.pendingSessions}</div>
            </div>
          </div>
        </div>

        {/* Sessions List Table */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <ClipboardCheckIcon size={18} className="text-emerald-400" />
              <span>Danh sách các buổi học của lớp</span>
            </h3>
            <span className="text-xs text-slate-400">
              Hiển thị {sessions.length} buổi học
            </span>
          </div>

          {loadingSessions ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshIcon size={28} className="animate-spin text-emerald-400" />
              <span className="text-sm">Đang tải danh sách buổi học...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <CalendarIcon size={36} className="text-slate-600" />
              <div className="text-base font-medium text-slate-300">Chưa có buổi học nào được tạo</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Hãy bấm nút <strong>"Sinh tự động 15 buổi TKB"</strong> hoặc <strong>"Thêm buổi học lẻ"</strong> ở góc trên để bắt đầu điểm danh.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Buổi</th>
                    <th className="py-3 px-4">Mã buổi & Tên</th>
                    <th className="py-3 px-4">Ngày học</th>
                    <th className="py-3 px-4">Phòng</th>
                    <th className="py-3 px-4">Chủ đề bài giảng</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-center">Thống kê điểm danh</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sessions.map((s) => {
                    const isDone = s.status === "COMPLETED";
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-xs">
                            {s.sessionNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-100">{s.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{s.sessionCode}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">
                          {s.sessionDate}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {s.room || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={s.topic || ""}>
                          {s.topic || <span className="text-slate-600 italic">Chưa có chủ đề</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckIcon size={12} />
                              <span>Đã chốt</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <ClockIcon size={12} />
                              <span>Chưa điểm danh</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isDone ? (
                            <div className="inline-flex items-center gap-1.5 text-xs">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium" title="Có mặt">
                                {s.presentStudents || 0} Có mặt
                              </span>
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium" title="Vắng mặt">
                                {s.absentStudents || 0} Vắng
                              </span>
                              {s.lateStudents ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium" title="Đi muộn">
                                  {s.lateStudents} Muộn
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenTakingModal(s)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                                isDone
                                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
                              }`}
                            >
                              <UserCheckIcon size={14} />
                              <span>{isDone ? "Sửa điểm danh" : "Điểm danh ngay"}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteSession(s)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Xóa buổi học"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Taking Attendance Sheet */}
      {takingModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ClipboardCheckIcon size={14} />
                  <span>Điểm danh Buổi số {activeSession.sessionNumber}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5">
                  {activeSession.name}
                </h2>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>📅 Ngày: <strong>{activeSession.sessionDate}</strong></span>
                  <span>🏛️ Phòng: <strong>{activeSession.room || "Chưa xếp"}</strong></span>
                  <span>⏱️ Số tiết: <strong>{activeSession.lessonCount} tiết</strong></span>
                </div>
              </div>

              <button
                onClick={() => setTakingModalOpen(false)}
                className="size-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Action & Stat Bar */}
            <div className="p-4 bg-slate-800/20 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <CheckIcon size={14} />
                  <span>⚡ Đánh dấu tất cả Có mặt</span>
                </button>
                <div className="relative">
                  <SearchIcon size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã SV, tên..."
                    className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-60"
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                  Sĩ số: {modalStats.total}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Có mặt: {modalStats.present}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  Muộn: {modalStats.late}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  Có phép: {modalStats.excused}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                  Vắng: {modalStats.unexcused}
                </span>
              </div>
            </div>

            {/* Topic & Note Header */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/80 border-b border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Chủ đề bài giảng buổi này</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 5 - Spring Data JPA & Transactions"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Ghi chú chung của buổi học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kiểm tra 15 phút đầu giờ"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                />
              </div>
            </div>

            {/* Students Attendance List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingRecords ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <RefreshIcon size={24} className="animate-spin text-emerald-400" />
                  <span className="text-xs">Đang tải danh sách sinh viên...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  Không tìm thấy sinh viên nào phù hợp
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredRecords.map((r, idx) => {
                    const isLate = r.status === "LATE";
                    return (
                      <div
                        key={r.studentId}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          r.status === "PRESENT"
                            ? "bg-slate-800/40 border-slate-700/60"
                            : r.status === "LATE"
                            ? "bg-amber-500/5 border-amber-500/30"
                            : r.status === "EXCUSED"
                            ? "bg-blue-500/5 border-blue-500/30"
                            : "bg-rose-500/5 border-rose-500/30"
                        }`}
                      >
                        {/* Student info */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <span className="text-xs font-mono text-slate-500 w-5 text-center">
                            {idx + 1}
                          </span>
                          <div className="size-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">
                            {r.studentName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-100">
                              {r.studentName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                              <span>{r.studentCode}</span>
                              {r.classGroupName && <span>• {r.classGroupName}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.studentId, "PRESENT")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              r.status === "PRESENT"
                                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/40 font-bold"
                                : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                            }`}
                          >
                            🟢 Có mặt
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.studentId, "LATE")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              r.status === "LATE"
                                ? "bg-amber-600 text-white shadow-sm shadow-amber-900/40 font-bold"
                                : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                            }`}
                          >
                            🟡 Muộn
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.studentId, "EXCUSED")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              r.status === "EXCUSED"
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-900/40 font-bold"
                                : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                            }`}
                          >
                            🔵 Có phép
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(r.studentId, "UNEXCUSED")}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              r.status === "UNEXCUSED"
                                ? "bg-rose-600 text-white shadow-sm shadow-rose-900/40 font-bold"
                                : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                            }`}
                          >
                            🔴 Vắng
                          </button>

                          {isLate && (
                            <div className="flex items-center gap-1 ml-2">
                              <input
                                type="number"
                                min={1}
                                max={180}
                                className="w-14 bg-slate-800 border border-amber-500/40 rounded-lg px-2 py-0.5 text-xs text-amber-300 text-center font-bold focus:outline-none"
                                value={r.lateMinutes || 15}
                                onChange={(e) => handleLateMinutesChange(r.studentId, Number(e.target.value))}
                              />
                              <span className="text-[11px] text-amber-400">phút</span>
                            </div>
                          )}
                        </div>

                        {/* Note Input */}
                        <div className="min-w-[150px]">
                          <input
                            type="text"
                            placeholder="Ghi chú lý do..."
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            value={r.note || ""}
                            onChange={(e) => handleRecordNoteChange(r.studentId, e.target.value)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-800/40 flex items-center justify-between">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <AlertTriangleIcon size={14} className="text-amber-400" />
                <span>Hệ thống sẽ tự động cập nhật điểm chuyên cần & gửi cảnh báo cấm thi</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTakingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={submittingAttendance || records.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckIcon size={16} />
                  <span>{submittingAttendance ? "Đang lưu..." : "Lưu & Chốt điểm danh"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Auto Generate Sessions */}
      {autoGenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <CalendarIcon size={20} className="text-emerald-400" />
              <span>Sinh tự động các buổi học theo TKB</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Hệ thống sẽ dựa vào Lịch học (Thứ, Tiết, Phòng) của lớp để sinh danh sách các buổi học cách nhau 1 tuần.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số lượng buổi học cần sinh
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={autoGenTotal}
                  onChange={(e) => setAutoGenTotal(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ngày bắt đầu tuần học thứ nhất
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={autoGenStartDate}
                  onChange={(e) => setAutoGenStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAutoGenOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAutoGenerate}
                disabled={generating}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {generating ? "Đang sinh..." : "Tạo danh sách buổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Single / Makeup Session */}
      {newSessionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <PlusIcon size={20} className="text-emerald-400" />
              <span>Thêm Buổi Học Lẻ / Học Bù</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Nhập thông tin cho buổi học bổ sung ngoài lịch học chính thức.
            </p>

            <div className="space-y-3.5 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Số thứ tự buổi</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={newSessionNumber}
                    onChange={(e) => setNewSessionNumber(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ngày diễn ra</label>
                  <input
                    type="date"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phòng học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: A1-302"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={newSessionRoom}
                  onChange={(e) => setNewSessionRoom(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chủ đề bài học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Học bù nội dung ôn tập thi"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  value={newSessionTopic}
                  onChange={(e) => setNewSessionTopic(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setNewSessionOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateSession}
                disabled={creatingSession}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {creatingSession ? "Đang tạo..." : "Tạo buổi học"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={async () => {
          await confirmModal.action();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />
    </AppShell>
  );
}
