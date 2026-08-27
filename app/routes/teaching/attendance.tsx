import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../../components/app-shell";
import { ConfirmModal } from "../../components/confirm-modal";
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

/**
 * Dropdown menu 3 chấm (...) cho cột Thao tác chuẩn hóa toàn hệ thống
 */
function ActionDropdown({
  onTakeAttendance,
  onEdit,
  onDelete,
  isCompleted,
}: {
  onTakeAttendance: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isCompleted?: boolean;
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
      const dropdownHeight = 130;
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
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onTakeAttendance();
            }}
            className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-2"
          >
            <UserCheckIcon size={14} className="text-emerald-500" />
            <span>{isCompleted ? "Sửa điểm danh" : "Điểm danh"}</span>
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-2"
            >
              <CalendarIcon size={14} className="text-cyan-500" />
              <span>Chỉnh sửa buổi</span>
            </button>
          )}

          {onDelete && (
            <div className="border-t border-slate-100 dark:border-slate-800 my-0.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>✕</span>
                <span>Xóa buổi học</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
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

  // Edit / Add Single Session Modal
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [formSessionNumber, setFormSessionNumber] = useState(1);
  const [formSessionDate, setFormSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [formSessionRoom, setFormSessionRoom] = useState("");
  const [formSessionTopic, setFormSessionTopic] = useState("");
  const [formLessonCount, setFormLessonCount] = useState(3);
  const [savingSession, setSavingSession] = useState(false);

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

      setSuccessMsg(`Đã chốt điểm danh buổi ${activeSession.sessionNumber} thành công!`);
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

  // Open Edit Session Modal
  function handleOpenEditSession(session: AttendanceSession) {
    setEditingSessionId(session.id);
    setFormSessionNumber(session.sessionNumber);
    setFormSessionDate(session.sessionDate);
    setFormSessionRoom(session.room || "");
    setFormSessionTopic(session.topic || "");
    setFormLessonCount(session.lessonCount || 3);
    setSessionModalOpen(true);
  }

  // Open Add Single Session Modal
  function handleOpenAddSession() {
    setEditingSessionId(null);
    setFormSessionNumber(sessions.length + 1);
    setFormSessionDate(new Date().toISOString().split("T")[0]);
    setFormSessionRoom(selectedClass ? "" : "");
    setFormSessionTopic("");
    setFormLessonCount(3);
    setSessionModalOpen(true);
  }

  // Save or Update Session
  async function handleSaveSession() {
    if (!selectedClassId) return;
    try {
      setSavingSession(true);
      setError("");
      if (editingSessionId) {
        await attendanceService.updateSession(editingSessionId, {
          subjectClassId: selectedClassId,
          sessionNumber: formSessionNumber,
          sessionDate: formSessionDate,
          room: formSessionRoom,
          topic: formSessionTopic,
          lessonCount: formLessonCount,
        });
        setSuccessMsg(`Đã cập nhật Buổi học số ${formSessionNumber} thành công!`);
      } else {
        await attendanceService.createSession({
          subjectClassId: selectedClassId,
          sessionNumber: formSessionNumber,
          sessionDate: formSessionDate,
          room: formSessionRoom,
          topic: formSessionTopic,
          lessonCount: formLessonCount,
        });
        setSuccessMsg(`Đã thêm Buổi học số ${formSessionNumber} thành công!`);
      }
      setSessionModalOpen(false);
      await loadSessions(selectedClassId);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi khi lưu buổi học";
      setError(msg);
    } finally {
      setSavingSession(false);
    }
  }

  // Delete Session
  function handleDeleteSession(session: AttendanceSession) {
    setConfirmModal({
      open: true,
      title: "Xóa buổi học",
      message: `Bạn có chắc chắn muốn xóa "${session.name}"? Dữ liệu điểm danh của buổi này sẽ bị xóa.`,
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
      description="Quản lý các buổi học, điểm danh sinh viên và theo dõi điều kiện chuyên cần"
    >
      <div className="space-y-6">
        {/* Top Alerts */}
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

        {/* Filter & Action Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="sm:w-80">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Chọn Lớp học phần
              </label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                value={selectedClassId || ""}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                disabled={loadingClasses}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.subjectClassCode}] {c.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedClass && (
              <div className="flex items-center gap-2 self-start sm:self-center sm:mt-5 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                  {selectedClass.semester || "HK1"} • {selectedClass.academicYear || "2025-2026"}
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
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <CalendarIcon size={16} />
              <span>Sinh tự động 15 buổi TKB</span>
            </button>

            <button
              onClick={handleOpenAddSession}
              disabled={!selectedClassId}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
            >
              <PlusIcon size={16} />
              <span>Thêm buổi học</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={sessions.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              title="Xuất Excel"
            >
              <ExportIcon size={16} />
              <span>Xuất Excel</span>
            </button>

            <button
              onClick={() => selectedClassId && loadSessions(selectedClassId)}
              disabled={loadingSessions}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
              title="Làm mới"
            >
              <RefreshIcon size={16} className={loadingSessions ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 3 Clean KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-4 shadow-xs">
            <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng số buổi học</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{overallStats.totalSessions}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-4 shadow-xs">
            <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Đã chốt điểm danh</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{overallStats.completedSessions}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/70 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center gap-4 shadow-xs">
            <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ClockIcon size={20} />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Chưa điểm danh</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{overallStats.pendingSessions}</div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ClipboardCheckIcon size={18} className="text-cyan-600 dark:text-cyan-400" />
              <span>Danh sách các buổi học</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {sessions.length} buổi học
            </span>
          </div>

          {loadingSessions ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshIcon size={24} className="animate-spin text-cyan-500" />
              <span className="text-xs">Đang tải danh sách buổi học...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
              <CalendarIcon size={32} className="text-slate-400 dark:text-slate-600" />
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Chưa có buổi học nào</div>
              <p className="text-xs text-slate-500 max-w-sm">
                Bấm <strong>"Sinh tự động 15 buổi TKB"</strong> hoặc <strong>"Thêm buổi học"</strong> ở phía trên để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Buổi</th>
                    <th className="py-3 px-4">Tên buổi học & Mã</th>
                    <th className="py-3 px-4">Ngày học</th>
                    <th className="py-3 px-4">Phòng</th>
                    <th className="py-3 px-4">Chủ đề</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-center">Sĩ số</th>
                    <th className="py-3 px-4 w-20 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.map((s) => {
                    const isDone = s.status === "COMPLETED";
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                          <span className="inline-flex size-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                            {s.sessionNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{s.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{s.sessionCode}</div>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {s.sessionDate}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                          {s.room || "-"}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title={s.topic || ""}>
                          {s.topic || <span className="text-slate-400 italic">Chưa nhập</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                              <CheckIcon size={12} />
                              <span>Đã chốt</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                              <ClockIcon size={12} />
                              <span>Chưa điểm danh</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isDone ? (
                            <div className="inline-flex items-center gap-1 text-[11px]">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                                {s.presentStudents || 0} Có mặt
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium">
                                {s.absentStudents || 0} Vắng
                              </span>
                              {s.lateStudents ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                                  {s.lateStudents} Muộn
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ActionDropdown
                            isCompleted={isDone}
                            onTakeAttendance={() => handleOpenTakingModal(s)}
                            onEdit={() => handleOpenEditSession(s)}
                            onDelete={() => handleDeleteSession(s)}
                          />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <ClipboardCheckIcon size={14} />
                  <span>Điểm danh Buổi số {activeSession.sessionNumber}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {activeSession.name}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                  <span>Ngày: <strong>{activeSession.sessionDate}</strong></span>
                  <span>Phòng: <strong>{activeSession.room || "-"}</strong></span>
                  <span>Số tiết: <strong>{activeSession.lessonCount} tiết</strong></span>
                </div>
              </div>

              <button
                onClick={() => setTakingModalOpen(false)}
                className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions & Stats Bar */}
            <div className="p-3.5 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                >
                  <CheckIcon size={13} />
                  <span>Tất cả có mặt</span>
                </button>
                <div className="relative">
                  <SearchIcon size={13} className="absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm mã SV, tên..."
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-44 sm:w-56"
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                  Sĩ số: {modalStats.total}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium">
                  Có mặt: {modalStats.present}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                  Muộn: {modalStats.late}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium">
                  Có phép: {modalStats.excused}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium">
                  Vắng: {modalStats.unexcused}
                </span>
              </div>
            </div>

            {/* Topic & Note Inputs */}
            <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Chủ đề bài giảng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 5 - Thiết kế cơ sở dữ liệu"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ghi chú chung</label>
                <input
                  type="text"
                  placeholder="Ghi chú buổi học..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                />
              </div>
            </div>

            {/* Student Roster List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingRecords ? (
                <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshIcon size={20} className="animate-spin text-cyan-500" />
                  <span>Đang tải danh sách sinh viên...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Không tìm thấy sinh viên nào phù hợp
                </div>
              ) : (
                filteredRecords.map((r, idx) => {
                  const isLate = r.status === "LATE";
                  return (
                    <div
                      key={r.studentId}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* Student info */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <span className="text-slate-400 font-mono text-[11px] w-5 text-center">
                          {idx + 1}
                        </span>
                        <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs shrink-0">
                          {r.studentName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {r.studentName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                            <span>{r.studentCode}</span>
                            {r.classGroupName && <span>• {r.classGroupName}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Clean Status Pill Toggles */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.studentId, "PRESENT")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            r.status === "PRESENT"
                              ? "bg-emerald-600 text-white font-bold shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          Có mặt
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.studentId, "LATE")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            r.status === "LATE"
                              ? "bg-amber-600 text-white font-bold shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          Muộn
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.studentId, "EXCUSED")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            r.status === "EXCUSED"
                              ? "bg-blue-600 text-white font-bold shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          Có phép
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(r.studentId, "UNEXCUSED")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            r.status === "UNEXCUSED"
                              ? "bg-rose-600 text-white font-bold shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          Vắng
                        </button>

                        {isLate && (
                          <div className="flex items-center gap-1 ml-1.5">
                            <input
                              type="number"
                              min={1}
                              max={180}
                              className="w-12 bg-slate-50 dark:bg-slate-800 border border-amber-300 dark:border-amber-600 rounded-md px-1.5 py-0.5 text-xs text-amber-700 dark:text-amber-300 text-center font-bold focus:outline-none"
                              value={r.lateMinutes || 15}
                              onChange={(e) => handleLateMinutesChange(r.studentId, Number(e.target.value))}
                            />
                            <span className="text-[11px] text-slate-400">phút</span>
                          </div>
                        )}
                      </div>

                      {/* Note Input */}
                      <div className="min-w-[140px]">
                        <input
                          type="text"
                          placeholder="Lý do / Ghi chú..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          value={r.note || ""}
                          onChange={(e) => handleRecordNoteChange(r.studentId, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <AlertTriangleIcon size={14} className="text-amber-500" />
                <span>Tự động cập nhật điểm chuyên cần & cảnh báo cấm thi khi chốt</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setTakingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  disabled={submittingAttendance || records.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckIcon size={14} />
                  <span>{submittingAttendance ? "Đang lưu..." : "Chốt điểm danh"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Auto Generate Sessions */}
      {autoGenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1.5">
              <CalendarIcon size={18} className="text-cyan-600 dark:text-cyan-400" />
              <span>Sinh tự động các buổi học theo TKB</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Sinh danh sách các buổi học định kỳ cách nhau 1 tuần theo thời khóa biểu.
            </p>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số lượng buổi học
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={autoGenTotal}
                  onChange={(e) => setAutoGenTotal(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ngày bắt đầu tuần học 1
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={autoGenStartDate}
                  onChange={(e) => setAutoGenStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAutoGenOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAutoGenerate}
                disabled={generating}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {generating ? "Đang sinh..." : "Tạo danh sách"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Session */}
      {sessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1.5">
              <CalendarIcon size={18} className="text-cyan-600 dark:text-cyan-400" />
              <span>{editingSessionId ? "Chỉnh sửa buổi học" : "Thêm buổi học"}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {editingSessionId ? "Cập nhật thông tin cho buổi học đã chọn." : "Tạo thêm buổi học lẻ hoặc buổi học bù."}
            </p>

            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số thứ tự buổi</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={formSessionNumber}
                    onChange={(e) => setFormSessionNumber(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày học</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={formSessionDate}
                    onChange={(e) => setFormSessionDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phòng học</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: A1-302"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={formSessionRoom}
                    onChange={(e) => setFormSessionRoom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Số tiết</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={formLessonCount}
                    onChange={(e) => setFormLessonCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Chủ đề bài học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 4 - Ôn tập giữa kỳ"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={formSessionTopic}
                  onChange={(e) => setFormSessionTopic(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSessionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveSession}
                disabled={savingSession}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {savingSession ? "Đang lưu..." : editingSessionId ? "Cập nhật" : "Tạo buổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
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
