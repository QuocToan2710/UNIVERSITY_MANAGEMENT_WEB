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
          apiListRequest<Student>("/students"),
          apiListRequest<Teacher>("/teachers"),
          apiListRequest<Course>("/courses"),
          apiListRequest<User>("/users").catch((reason: ApiError) => {
            if (reason.status === 403) return null;
            throw reason;
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
          label="Khóa học"
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
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan-400" />
                <h2 className="font-bold text-lg text-white">Sinh viên trong hệ thống</h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">Dữ liệu hồ sơ học viên cập nhật mới nhất từ API Student.</p>
            </div>
            <Link
              to="/students"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
            >
              <span>Xem tất cả sinh viên</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          <div className="mt-6 space-y-3.5">
            {loading ? (
              <p className="py-6 text-center text-xs text-slate-400">Đang tải dữ liệu hệ thống…</p>
            ) : students.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Chưa có sinh viên nào trong hệ thống.</p>
            ) : (
              students.slice(0, 4).map((student) => <StudentPreview key={student.id} student={student} />)
            )}
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl flex flex-col">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-indigo-400" />
            <h2 className="font-bold text-lg text-white">Truy cập nhanh</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">Chuyển hướng tức thì đến các danh mục quản lý.</p>

          <div className="mt-6 grid gap-3.5 my-auto">
            <QuickLink to="/students" label="Quản lý sinh viên" desc="Danh sách hồ sơ & chỉnh sửa" Icon={StudentIcon} color="cyan" />
            <QuickLink to="/teachers" label="Quản lý giảng viên" desc="Hồ sơ & chuyên môn giảng dạy" Icon={TeacherIcon} color="violet" />
            <QuickLink to="/courses" label="Quản lý khóa học" desc="Tín chỉ & danh sách học phần" Icon={CourseIcon} color="amber" />
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
      badge: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]",
      hover: "hover:border-cyan-400/40",
    },
    violet: {
      badge: "border-violet-400/30 bg-violet-500/10 text-violet-300 shadow-[0_0_15px_rgba(167,139,250,0.25)]",
      hover: "hover:border-violet-400/40",
    },
    amber: {
      badge: "border-amber-400/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.25)]",
      hover: "hover:border-amber-400/40",
    },
    emerald: {
      badge: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.25)]",
      hover: "hover:border-emerald-400/40",
    },
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1 ${styles[theme].hover}`}
    >
      <div className="flex items-center justify-between">
        <div className={`grid size-12 place-items-center rounded-2xl border ${styles[theme].badge}`}>
          <Icon size={22} />
        </div>
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Live Data</span>
      </div>
      <p className="mt-5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-white">{value}</p>
      <p className="mt-3 text-[11px] text-slate-400">{detail}</p>
    </article>
  );
}

function StudentPreview({ student }: { student: Student }) {
  const initials = student.fullName.split(" ").filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-3.5 transition-colors hover:border-white/15">
      <div className="flex items-center gap-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-bold text-xs text-slate-950 shadow-md">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">{student.fullName}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Mã SV: <span className="text-cyan-300 font-medium">{student.studentCode}</span> · {student.email}
          </p>
        </div>
      </div>
      <span className="hidden sm:inline-block rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300">
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
    cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
    violet: "border-violet-400/30 bg-violet-500/10 text-violet-300",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition-all duration-200 hover:border-cyan-400/40 hover:bg-slate-900/80 hover:shadow-lg"
    >
      <div className="flex items-center gap-3.5">
        <div className={`grid size-11 shrink-0 place-items-center rounded-xl border ${badgeColors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">{label}</p>
          <p className="text-xs text-slate-400">{desc}</p>
        </div>
      </div>
      <div className="grid size-8 place-items-center rounded-xl border border-white/10 bg-slate-900 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:border-cyan-400/30 group-hover:text-cyan-300">
        <ArrowRightIcon size={14} />
      </div>
    </Link>
  );
}

