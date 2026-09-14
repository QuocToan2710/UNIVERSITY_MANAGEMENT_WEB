import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { PermissionGate } from "../components/permission-gate";
import { apiListRequest, apiRequest, ApiError } from "../lib/api";
import { getCachedUser } from "../lib/auth";
import { formatCurrency } from "../lib/formatters";
import { isAdmin, isStudent, isTeacher } from "../lib/permission";
import { attendanceService } from "../services/attendance.service";
import { gradeService } from "../services/grade.service";
import { scheduleService } from "../services/schedule.service";
import { tuitionService } from "../services/tuition.service";
import type { StudentAttendanceSummary } from "../types/attendance";
import type { StudentTranscript } from "../types/grade";
import type { Course, Teacher, User } from "../types/management";
import type { ClassScheduleResponse, WeekDay } from "../types/response/schedule.response";
import type { Student } from "../types/student";
import type { StudentTuitionSummary } from "../types/tuition";
import {
  ArrowRightIcon,
  BanknotesIcon,
  BookOpenIcon,
  ClipboardCheckIcon,
  CourseIcon,
  DashboardIcon,
  GradeIcon,
  RoomIcon,
  ScheduleIcon,
  StudentIcon,
  TeacherIcon,
  TranscriptIcon,
  UsersIcon,
} from "../components/icons";

export function meta() {
  return [
    { title: "Bảng điều khiển Tổng quan" },
    { name: "description", content: "Bảng điều khiển tổng quan" },
  ];
}

const DAY_MAPPING: Record<number, WeekDay> = {
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
  0: "SUNDAY",
};

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => getCachedUser<User>());
  const [userLoading, setUserLoading] = useState(!user);

  useEffect(() => {
    apiRequest<User>("/users/myInfo")
      .then((u) => {
        setUser(u);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => {
        setUserLoading(false);
      });
  }, [navigate]);

  const userRoleType = useMemo(() => {
    if (!user) return "GUEST";
    if (isAdmin(user)) return "ADMIN";
    if (isTeacher(user)) return "TEACHER";
    if (isStudent(user)) return "STUDENT";
    return "GENERIC";
  }, [user]);

  return (
    <AppShell
      title="Tổng quan"
      description=""
    >
      {userLoading ? (
        <DashboardSkeleton />
      ) : userRoleType === "STUDENT" ? (
        <StudentDashboard user={user!} />
      ) : userRoleType === "TEACHER" ? (
        <TeacherDashboard user={user!} />
      ) : userRoleType === "ADMIN" ? (
        <AdminDashboard user={user!} />
      ) : (
        <AdaptiveGenericDashboard user={user!} />
      )}
    </AppShell>
  );
}

// ==========================================
// 1. SKELETON LOADER
// ==========================================
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-28 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />

      {/* KPI Cards Skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800/60 lg:col-span-2" />
        <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
      </div>
    </div>
  );
}

// ==========================================
// 2. STUDENT DASHBOARD
// ==========================================
function StudentDashboard({ user }: { user: User }) {
  const [schedules, setSchedules] = useState<ClassScheduleResponse[]>([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState<StudentAttendanceSummary[]>([]);
  const [tuitionSummary, setTuitionSummary] = useState<StudentTuitionSummary | null>(null);
  const [transcript, setTranscript] = useState<StudentTranscript | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentData() {
      try {
        const [schedData, attendData, tuitionData, transData] = await Promise.all([
          scheduleService.getMyClassSchedules("HK1", "2025-2026").catch(() => []),
          attendanceService.getMyAttendanceSummary("HK1", "2025-2026").catch(() => []),
          tuitionService.getMyTuitionSummary("HK1", "2025-2026").catch(() => null),
          gradeService.getMyTranscript().catch(() => null),
        ]);
        setSchedules(schedData || []);
        setAttendanceSummaries(attendData || []);
        setTuitionSummary(tuitionData);
        setTranscript(transData);
      } finally {
        setLoading(false);
      }
    }
    void loadStudentData();
  }, []);

  const todayDayOfWeek: WeekDay = useMemo(() => {
    return DAY_MAPPING[new Date().getDay()] || "MONDAY";
  }, []);

  const todaySchedules = useMemo(() => {
    return schedules.filter((s) => s.dayOfWeek === todayDayOfWeek);
  }, [schedules, todayDayOfWeek]);

  const atRiskAttendances = useMemo(() => {
    return attendanceSummaries.filter((a) => a.absenceRate >= 15);
  }, [attendanceSummaries]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-600/15 via-blue-600/10 to-indigo-600/15 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-base shadow-xs">
              <StudentIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user.fullName || "Sinh viên"}
                </h2>
                <span className="rounded-full bg-cyan-100 dark:bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-400/30">
                  Sinh viên
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Mã SV: <strong className="font-mono text-cyan-700 dark:text-cyan-300">{user.username}</strong> • HK1 (2025 - 2026)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/schedule/timetable"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
            >
              <ScheduleIcon size={16} />
              <span>Thời khóa biểu</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Lịch học hôm nay"
          value={loading ? "…" : `${todaySchedules.length} ca`}
          Icon={ScheduleIcon}
          theme="cyan"
        />
        <StatCard
          label="Điểm tích lũy (CPA)"
          value={loading ? "…" : transcript?.cumulativeCpa4 ? transcript.cumulativeCpa4.toFixed(2) : "—"}
          detail={transcript?.cumulativeGpa10 ? `GPA: ${transcript.cumulativeGpa10.toFixed(2)}` : undefined}
          Icon={GradeIcon}
          theme="violet"
        />
        <StatCard
          label="Cảnh báo chuyên cần"
          value={loading ? "…" : `${atRiskAttendances.length} môn`}
          detail={atRiskAttendances.length > 0 ? "Nguy cơ cấm thi" : undefined}
          Icon={ClipboardCheckIcon}
          theme={atRiskAttendances.length > 0 ? "amber" : "emerald"}
        />
        <StatCard
          label="Học phí cần đóng"
          value={
            loading
              ? "…"
              : tuitionSummary
              ? formatCurrency(tuitionSummary.balanceAmount)
              : "0 ₫"
          }
          detail={tuitionSummary?.status === "PAID" ? "Đã hoàn thành" : undefined}
          Icon={BanknotesIcon}
          theme={tuitionSummary && tuitionSummary.balanceAmount > 0 ? "amber" : "emerald"}
        />
      </div>

      {/* Main Grid: Left 2 Cols + Right 1 Col */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Today's Schedule & Attendance Alerts */}
        <div className="space-y-8 lg:col-span-2">
          {/* Today's Classes Card */}
          <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-xs dark:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-500 animate-pulse" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Lịch học trong ngày</h3>
              </div>
              <Link
                to="/schedule/timetable"
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                Chi tiết tuần <ArrowRightIcon size={12} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="py-6 text-center text-xs text-slate-400">Đang tải lịch học...</p>
              ) : todaySchedules.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  Không có lịch học hôm nay.
                </div>
              ) : (
                todaySchedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 p-4 transition-all hover:border-cyan-400/40"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-xs border border-cyan-500/20">
                        {s.startPeriod && s.endPeriod ? `Tiết ${s.startPeriod}-${s.endPeriod}` : s.startTime ? s.startTime.slice(0, 5) : "Ca học"}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {s.courseClassName || s.name || "Lớp học phần"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Phòng: <strong className="text-slate-700 dark:text-slate-200">{s.room || "Chưa xếp"}</strong> • GV: {s.teacherName || "Đang cập nhật"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Đang diễn ra
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Attendance Health & Warnings Card */}
          <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-xs dark:shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Theo dõi Chuyên cần</h3>
              </div>
              <Link
                to="/student/attendance"
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                Tra cứu đầy đủ <ArrowRightIcon size={12} />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <p className="py-6 text-center text-xs text-slate-400">Đang tải dữ liệu điểm danh...</p>
              ) : attendanceSummaries.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Chưa có dữ liệu điểm danh học kỳ này.</p>
              ) : (
                attendanceSummaries.slice(0, 4).map((a) => {
                  const isDanger = a.absenceRate >= 20;
                  const isWarning = a.absenceRate >= 10 && a.absenceRate < 20;

                  return (
                    <div
                      key={a.subjectClassId}
                      className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 p-3.5"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {a.subjectName} ({a.subjectClassCode})
                        </span>
                        <span
                          className={`font-black ${
                            isDanger
                              ? "text-rose-600 dark:text-rose-400"
                              : isWarning
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          Vắng: {a.unexcusedAbsentSessions + a.excusedAbsentSessions} buổi ({a.absenceRate.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDanger ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, 100 - a.absenceRate))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Quick Student Links */}
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-xs dark:shadow-xl">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-indigo-500" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Lối tắt học vụ</h3>
            </div>

            <div className="mt-5 space-y-3">
              <QuickLink
                to="/course-registration"
                label="Đăng ký tín chỉ"
                Icon={BookOpenIcon}
                color="cyan"
              />
              <QuickLink
                to="/transcripts"
                label="Bảng điểm học tập"
                Icon={TranscriptIcon}
                color="violet"
              />
              <QuickLink
                to="/finance/tuition"
                label="Học phí & Công nợ"
                Icon={BanknotesIcon}
                color="amber"
              />
              <QuickLink
                to="/student/attendance"
                label="Tra cứu chuyên cần"
                Icon={ClipboardCheckIcon}
                color="emerald"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. TEACHER DASHBOARD
// ==========================================
function TeacherDashboard({ user }: { user: User }) {
  const [schedules, setSchedules] = useState<ClassScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeacherData() {
      try {
        const schedData = await scheduleService.getMyClassSchedules("HK1", "2025-2026").catch(() => []);
        setSchedules(schedData || []);
      } finally {
        setLoading(false);
      }
    }
    void loadTeacherData();
  }, []);

  const todayDayOfWeek: WeekDay = useMemo(() => {
    return DAY_MAPPING[new Date().getDay()] || "MONDAY";
  }, []);

  const todayTeaching = useMemo(() => {
    return schedules.filter((s) => s.dayOfWeek === todayDayOfWeek);
  }, [schedules, todayDayOfWeek]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-cyan-600/15 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-base shadow-xs">
              <TeacherIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {user.fullName || "Giảng viên"}
                </h2>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/30">
                  Giảng viên
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Tài khoản: <strong className="font-mono text-emerald-700 dark:text-emerald-300">{user.username}</strong> • HK1 (2025 - 2026)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/teaching/attendance"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
            >
              <ClipboardCheckIcon size={16} />
              <span>Điểm danh học phần</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ca giảng dạy hôm nay"
          value={loading ? "…" : `${todayTeaching.length} ca`}
          Icon={ScheduleIcon}
          theme="emerald"
        />
        <StatCard
          label="Tổng lớp học phần"
          value={loading ? "…" : String(schedules.length)}
          Icon={BookOpenIcon}
          theme="cyan"
        />
        <StatCard
          label="Quản lý điểm"
          value="Sẵn sàng"
          Icon={GradeIcon}
          theme="violet"
        />
        <StatCard
          label="Điểm danh chuyên cần"
          value="Tự động"
          Icon={ClipboardCheckIcon}
          theme="amber"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Today Teaching Schedule */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-xs dark:shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Lịch giảng dạy hôm nay</h3>
            </div>
            <Link
              to="/schedule/teaching"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              Xem toàn bộ lịch <ArrowRightIcon size={12} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <p className="py-6 text-center text-xs text-slate-400">Đang tải lịch dạy...</p>
            ) : todayTeaching.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Không có lịch giảng dạy hôm nay.
              </div>
            ) : (
              todayTeaching.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 p-4 transition-all hover:border-emerald-400/40"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                      {s.startPeriod && s.endPeriod ? `Tiết ${s.startPeriod}-${s.endPeriod}` : s.startTime ? s.startTime.slice(0, 5) : "Ca dạy"}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {s.courseClassName || s.name || "Lớp học phần"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Phòng: <strong className="text-slate-700 dark:text-slate-200">{s.room || "Chưa xếp"}</strong> • {s.courseClassCode || s.scheduleCode}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/teaching/attendance"
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition cursor-pointer"
                  >
                    Điểm danh
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Col: Quick Teacher Actions */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-xs dark:shadow-xl">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Lối tắt giảng viên</h3>
          </div>

          <div className="mt-5 space-y-3">
            <QuickLink
              to="/teaching/attendance"
              label="Điểm danh sinh viên"
              Icon={ClipboardCheckIcon}
              color="emerald"
            />
            <QuickLink
              to="/grades"
              label="Quản lý điểm"
              Icon={GradeIcon}
              color="violet"
            />
            <QuickLink
              to="/schedule/teaching"
              label="Lịch giảng dạy"
              Icon={ScheduleIcon}
              color="cyan"
            />
            <QuickLink
              to="/students"
              label="Danh sách sinh viên"
              Icon={StudentIcon}
              color="amber"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// ==========================================
// 4. ADMIN DASHBOARD
// ==========================================
function AdminDashboard({ user }: { user: User }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [studentData, teacherData, courseData, userData] = await Promise.all([
          apiListRequest<Student>("/students").catch(() => []),
          apiListRequest<Teacher>("/teachers").catch(() => []),
          apiListRequest<Course>("/courses").catch(() => []),
          apiListRequest<User>("/users").catch(() => []),
        ]);
        setStudents(studentData);
        setTeachers(teacherData);
        setCourses(courseData);
        setUserCount(userData?.length ?? 0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-600/15 via-indigo-600/10 to-cyan-600/15 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-base shadow-xs">
              <UsersIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Quản trị hệ thống
                </h2>
                <span className="rounded-full bg-purple-100 dark:bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-400/30">
                  {user.fullName || "Admin"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/roles"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
            >
              <UsersIcon size={16} />
              <span>Phân quyền vai trò</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng sinh viên"
          value={loading ? "…" : String(students.length)}
          Icon={StudentIcon}
          theme="cyan"
        />
        <StatCard
          label="Tổng giảng viên"
          value={loading ? "…" : String(teachers.length)}
          Icon={TeacherIcon}
          theme="violet"
        />
        <StatCard
          label="Tổng môn học"
          value={loading ? "…" : String(courses.length)}
          Icon={CourseIcon}
          theme="amber"
        />
        <StatCard
          label="Tài khoản người dùng"
          value={loading ? "…" : userCount === null ? "—" : String(userCount)}
          Icon={UsersIcon}
          theme="emerald"
        />
      </div>

      {/* Main Grid View */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Students Table Section */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-xs dark:shadow-2xl lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-cyan-500 animate-pulse" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Sinh viên mới cập nhật</h3>
            </div>
            <Link
              to="/students"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 dark:border-cyan-400/30 bg-cyan-50 dark:bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-all"
            >
              <span>Xem tất cả</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          <div className="mt-6 space-y-3.5">
            {loading ? (
              <p className="py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">Đang tải dữ liệu…</p>
            ) : students.length === 0 ? (
              <p className="py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">Chưa có sinh viên nào trong hệ thống.</p>
            ) : (
              students.slice(0, 5).map((student) => <StudentPreview key={student.id} student={student} />)
            )}
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-xs dark:shadow-2xl flex flex-col">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-indigo-500" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Quản trị & Cấu hình</h3>
          </div>

          <div className="mt-6 grid gap-3.5 my-auto">
            <QuickLink to="/students" label="Quản lý sinh viên" Icon={StudentIcon} color="cyan" />
            <QuickLink to="/teachers" label="Quản lý giảng viên" Icon={TeacherIcon} color="violet" />
            <QuickLink to="/roles" label="Phân quyền vai trò" Icon={UsersIcon} color="amber" />
            <QuickLink to="/categories/buildings" label="Quản trị danh mục" Icon={RoomIcon} color="emerald" />
          </div>
        </section>
      </div>
    </div>
  );
}

// ==========================================
// 5. ADAPTIVE GENERIC DASHBOARD (CUSTOM ROLES)
// ==========================================
function AdaptiveGenericDashboard({ user }: { user: User }) {
  return (
    <div className="space-y-8">
      {/* Dynamic Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-cyan-600/15 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-base shadow-xs">
            <DashboardIcon size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {user.fullName || "Bảng điều khiển"}
              </h2>
              <span className="rounded-full bg-blue-100 dark:bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-400/30">
                {user.roles?.[0]?.name || "Vai trò"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Cards Grid gated by Permissions */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <PermissionGate endpoint="/students/**">
          <StatCard
            label="Sinh viên"
            value="Được cấp quyền"
            Icon={StudentIcon}
            theme="cyan"
          />
        </PermissionGate>

        <PermissionGate endpoint="/teachers/**">
          <StatCard
            label="Giảng viên"
            value="Được cấp quyền"
            Icon={TeacherIcon}
            theme="violet"
          />
        </PermissionGate>

        <PermissionGate endpoint="/tuition-fees/**">
          <StatCard
            label="Học phí"
            value="Được cấp quyền"
            Icon={BanknotesIcon}
            theme="amber"
          />
        </PermissionGate>

        <PermissionGate endpoint="/attendance/**">
          <StatCard
            label="Chuyên cần"
            value="Được cấp quyền"
            Icon={ClipboardCheckIcon}
            theme="emerald"
          />
        </PermissionGate>
      </div>

      {/* Permission-gated Quick Action Panels */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PermissionGate endpoint="/students/**">
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 mb-4">
              <StudentIcon size={18} className="text-cyan-600 dark:text-cyan-400" />
              Mô-đun Sinh viên
            </h4>
            <Link
              to="/students"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
            >
              <span>Truy cập</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </PermissionGate>

        <PermissionGate endpoint="/tuition-fees/**">
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 mb-4">
              <BanknotesIcon size={18} className="text-amber-600 dark:text-amber-400" />
              Mô-đun Học phí
            </h4>
            <Link
              to="/finance/tuition"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
            >
              <span>Truy cập</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </PermissionGate>

        <PermissionGate endpoint="/master-data/**">
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 mb-4">
              <RoomIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
              Mô-đun Danh mục
            </h4>
            <Link
              to="/categories/buildings"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
            >
              <span>Truy cập</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </PermissionGate>
      </div>
    </div>
  );
}

// ==========================================
// SHARED HELPER COMPONENTS
// ==========================================
function StatCard({
  label,
  value,
  detail,
  Icon,
  theme,
}: {
  label: string;
  value: string;
  detail?: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  theme: "cyan" | "violet" | "amber" | "emerald";
}) {
  const styles = {
    cyan: {
      badge: "border-cyan-300 dark:border-cyan-400/30 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 shadow-xs dark:shadow-[0_0_15px_rgba(34,211,238,0.25)]",
      hover: "hover:border-cyan-400",
    },
    violet: {
      badge: "border-purple-300 dark:border-violet-400/30 bg-purple-50 dark:bg-violet-500/10 text-purple-800 dark:text-violet-300 shadow-xs dark:shadow-[0_0_15px_rgba(167,139,250,0.25)]",
      hover: "hover:border-purple-400",
    },
    amber: {
      badge: "border-amber-300 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 shadow-xs dark:shadow-[0_0_15px_rgba(251,191,36,0.25)]",
      hover: "hover:border-amber-400",
    },
    emerald: {
      badge: "border-emerald-300 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 shadow-xs dark:shadow-[0_0_15px_rgba(52,211,153,0.25)]",
      hover: "hover:border-emerald-400",
    },
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-xs dark:shadow-xl transition-all duration-300 hover:-translate-y-1 ${styles[theme].hover}`}
    >
      <div className="flex items-center justify-between">
        <div className={`grid size-12 place-items-center rounded-2xl border ${styles[theme].badge}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
      {detail ? (
        <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">{detail}</p>
      ) : null}
    </article>
  );
}

function StudentPreview({ student }: { student: Student }) {
  const initials = student.fullName
    ? student.fullName
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "SV";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/60 dark:bg-slate-950/40 p-3.5 transition-all hover:border-slate-300 dark:hover:border-white/15">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black text-white shadow-xs">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900 dark:text-white text-sm">{student.fullName}</p>
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Mã SV: {student.studentCode} • Lớp: {student.classGroupName || "Chưa xếp"}
          </p>
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-cyan-50 dark:bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-400/20">
        {student.majorName || "Chính quy"}
      </span>
    </div>
  );
}

function QuickLink({
  to,
  label,
  Icon,
  color,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  color: "cyan" | "violet" | "amber" | "emerald";
}) {
  const colorMap = {
    cyan: "hover:border-cyan-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
    violet: "hover:border-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-400",
    amber: "hover:border-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-400",
    emerald: "hover:border-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  };

  return (
    <Link
      to={to}
      className={`group flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/60 dark:bg-slate-950/40 p-3.5 transition-all duration-200 hover:-translate-y-0.5 ${colorMap[color]}`}
    >
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-cyan-500/10 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
          <Icon size={18} />
        </div>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors">{label}</p>
      </div>
      <ArrowRightIcon size={14} className="text-slate-400 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
