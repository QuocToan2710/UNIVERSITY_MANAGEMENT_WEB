import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import { Link, useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { ApiError, apiListRequest, apiRequest } from "../lib/api";
import type { Course, Teacher, User } from "../types/management";
import type { Student } from "../types/student";
import {
  ArrowRightIcon,
  CourseIcon,
  StudentIcon,
  TeacherIcon,
  UsersIcon,
} from "../components/icons";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "EduManage | Tổng quan" },
    { name: "description", content: "Hệ thống quản lý đào tạo thông minh 3D" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [studentData, teacherData, courseData, userData] = await Promise.all([
          apiListRequest<Student>("/students").catch(() => []),
          apiListRequest<Teacher>("/teachers").catch(() => []),
          apiListRequest<Course>("/courses").catch(() => []),
          apiListRequest<User>("/users").catch((reason: ApiError) => {
            if (reason.status === 403) return null;
            return null;
          }),
        ]);
        setStudents(studentData);
        setTeachers(teacherData);
        setCourses(courseData);
        setUserCount(userData?.length ?? null);
      } catch (reason) {
        const apiError = reason as ApiError;
        if (apiError.status === 401) navigate("/login");
        else setError(apiError.message || "Không thể tải số liệu tổng quan.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell title="Tổng quan hệ thống" description="Theo dõi chỉ số đào tạo và lối truy cập nhanh trên nền tảng 3D.">
      {error && (
        <p className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-300 backdrop-blur-md">
          {error}
        </p>
      )}

      {/* Grid of Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng sinh viên"
          value={loading ? "…" : String(students.length)}
          detail="Dữ liệu đồng bộ /students"
          Icon={StudentIcon}
          theme="cyan"
        />
        <StatCard
          label="Giảng viên"
          value={loading ? "…" : String(teachers.length)}
          detail="Dữ liệu đồng bộ /teachers"
          Icon={TeacherIcon}
          theme="violet"
        />
        <StatCard
          label="Môn học"
          value={loading ? "…" : String(courses.length)}
          detail="Dữ liệu đồng bộ /courses"
          Icon={CourseIcon}
          theme="amber"
        />
        <StatCard
          label="Tài khoản quản trị"
          value={loading ? "…" : userCount === null ? "—" : String(userCount)}
          detail={userCount === null ? "Yêu cầu quyền ADMIN" : "Dữ liệu đồng bộ /users"}
          Icon={UsersIcon}
          theme="emerald"
        />
      </div>

      {/* Main Grid View */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Recent Students Table Section */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-500 animate-pulse" />
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">Sinh viên trong hệ thống</h2>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Dữ liệu hồ sơ học viên cập nhật mới nhất từ API Student.</p>
            </div>
            <Link
              to="/students"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 dark:border-cyan-400/30 bg-cyan-50 dark:bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-all"
            >
              <span>Xem tất cả sinh viên</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          <div className="mt-6 space-y-3.5">
            {loading ? (
              <p className="py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium">Đang tải dữ liệu hệ thống…</p>
            ) : students.length === 0 ? (
              <p className="py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-500 dark:text-slate-400 font-medium">Chưa có sinh viên nào trong hệ thống.</p>
            ) : (
              students.slice(0, 4).map((student) => <StudentPreview key={student.id} student={student} />)
            )}
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl flex flex-col">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-indigo-500" />
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Truy cập nhanh</h2>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">Chuyển hướng tức thì đến các danh mục quản lý.</p>

          <div className="mt-6 grid gap-3.5 my-auto">
            <QuickLink to="/students" label="Quản lý sinh viên" desc="Danh sách hồ sơ & chỉnh sửa" Icon={StudentIcon} color="cyan" />
            <QuickLink to="/teachers" label="Quản lý giảng viên" desc="Hồ sơ & chuyên môn giảng dạy" Icon={TeacherIcon} color="violet" />
            <QuickLink to="/courses" label="Quản lý môn học" desc="Tín chỉ & danh sách học phần" Icon={CourseIcon} color="amber" />
            <QuickLink to="/users" label="Quản lý tài khoản" desc="Phân quyền Admin & Users" Icon={UsersIcon} color="emerald" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  detail,
  Icon,
  theme,
}: {
  label: string;
  value: string;
  detail: string;
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
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm dark:shadow-xl transition-all duration-300 hover:-translate-y-1 ${styles[theme].hover}`}
    >
      <div className="flex items-center justify-between">
        <div className={`grid size-12 place-items-center rounded-2xl border ${styles[theme].badge}`}>
          <Icon size={22} />
        </div>
        <span className="text-[10px] font-extrabold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Live Data</span>
      </div>
      <p className="mt-5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
      <p className="mt-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}

function StudentPreview({ student }: { student: Student }) {
  const initials = student.fullName ? student.fullName.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() : "SV";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/40 p-3.5 transition-colors hover:border-cyan-300 dark:hover:border-white/15">
      <div className="flex items-center gap-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 font-black text-xs text-white shadow-md">
          {initials}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{student.fullName}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            Mã SV: <span className="text-cyan-700 dark:text-cyan-300 font-bold font-mono">{student.studentCode}</span> · {student.email}
          </p>
        </div>
      </div>
      <span className="hidden sm:inline-block rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
        {student.gender}
      </span>
    </div>
  );
}

function QuickLink({
  to,
  label,
  desc,
  Icon,
  color,
}: {
  to: string;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  color: "cyan" | "violet" | "amber" | "emerald";
}) {
  const badgeColors = {
    cyan: "border-cyan-300 dark:border-cyan-400/30 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300",
    violet: "border-purple-300 dark:border-violet-400/30 bg-purple-50 dark:bg-violet-500/10 text-purple-800 dark:text-violet-300",
    amber: "border-amber-300 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300",
    emerald: "border-emerald-300 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  };

  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-50 dark:bg-slate-950/40 p-4 transition-all duration-200 hover:border-cyan-400 hover:bg-white dark:hover:bg-white dark:bg-slate-900/80 shadow-2xs dark:shadow-lg"
    >
      <div className="flex items-center gap-3.5">
        <div className={`grid size-11 shrink-0 place-items-center rounded-xl border ${badgeColors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">{label}</p>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{desc}</p>
        </div>
      </div>
      <div className="grid size-8 place-items-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:border-cyan-400 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 shadow-2xs">
        <ArrowRightIcon size={14} />
      </div>
    </Link>
  );
}
