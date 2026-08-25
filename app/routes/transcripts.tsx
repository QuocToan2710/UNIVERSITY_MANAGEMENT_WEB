import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppShell } from "../components/app-shell";
import { apiListRequest, apiRequest, ApiError } from "../lib/api";
import { gradeService } from "../services/grade.service";
import type { StudentTranscript } from "../types/grade";
import type { Student } from "../types/student";
import type { User } from "../types/management";
import { exportToExcel } from "../lib/excel";

export function meta() {
  return [
    { title: "EduManage | Bảng điểm & Kết quả học tập" },
    { name: "description", content: "Tra cứu điểm GPA, CPA và bảng điểm cá nhân" },
  ];
}

export default function Transcripts() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [transcript, setTranscript] = useState<StudentTranscript | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [error, setError] = useState("");

  const rawRoles = (currentUser?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
  const userRoles = rawRoles.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
  const isAdmin = userRoles.includes("ADMIN") || (currentUser?.username || "").toLowerCase() === "admin";
  const isTeacher = userRoles.includes("TEACHER") || (currentUser?.username || "").toLowerCase().startsWith("teacher");
  const isAdminOrTeacher = isAdmin || isTeacher;

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const u = await apiRequest<User>("/users/myInfo").catch(() => null);
        setCurrentUser(u);

        const rList = (u?.roles || []).map((r) => (r.roleCode || r.name || "").toUpperCase());
        const rolesFlat = rList.flatMap((r) => [r, r.replace(/^ROLE_/, "")]);
        const userIsAdminOrTeacher =
          rolesFlat.includes("ADMIN") ||
          rolesFlat.includes("TEACHER") ||
          (u?.username || "").toLowerCase() === "admin" ||
          (u?.username || "").toLowerCase().startsWith("teacher");

        if (userIsAdminOrTeacher) {
          const studentList = await apiListRequest<Student>("/students?size=1000").catch(async () =>
            apiListRequest<Student>("/students")
          );
          setStudents(studentList);
          if (studentList.length > 0) {
            const firstId = Number(studentList[0].id);
            setSelectedStudentId(firstId);
            const data = await gradeService.getStudentTranscript(firstId);
            setTranscript(data);
          } else {
            setTranscript(null);
          }
        } else {
          // Student role
          const data = await gradeService.getMyTranscript();
          setTranscript(data);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.status === 401) navigate("/login");
        else setError(apiErr.message || "Không thể tải bảng điểm.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleSelectStudent = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setLoadingTranscript(true);
    setError("");
    try {
      const data = await gradeService.getStudentTranscript(studentId);
      setTranscript(data);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Không thể tải bảng điểm của sinh viên đã chọn.");
    } finally {
      setLoadingTranscript(false);
    }
  };

  const handleExportExcel = () => {
    if (!transcript) return;
    const allCourses: any[] = [];
    transcript.semesters.forEach((sem) => {
      sem.courses.forEach((c) => {
        allCourses.push({
          "Học kỳ": sem.semester,
          "Năm học": sem.academicYear,
          "Mã môn": c.subjectCode || c.subjectClassCode || "",
          "Tên môn học": c.subjectName || c.subjectClassName || "",
          "Số tín chỉ": c.credit ?? "",
          "Điểm CC": c.attendanceScore ?? "",
          "Điểm GK": c.midtermScore ?? "",
          "Điểm CK": c.finalScore ?? "",
          "Tổng kết (Hệ 10)": c.totalScore ?? "",
          "Điểm Chữ": c.letterGrade ?? "",
          "Điểm Hệ 4": c.gradePoint4 ?? "",
          "Kết quả": c.status === "PASSED" ? "Đạt" : "Chưa đạt",
          "Ghi chú": c.note || "",
        });
      });
    });

    exportToExcel(
      allCourses,
      `Bang_Diem_${transcript.studentCode}_${transcript.fullName.replace(/\s+/g, "_")}`,
      "BangDiem"
    );
  };

  return (
    <AppShell
      title="Bảng điểm & Kết quả học tập"
      description="Tra cứu điểm học phần, tính điểm GPA học kỳ, điểm tích lũy CPA và xếp loại học lực."
    >
      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm text-red-600 dark:text-red-300 backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Admin / Teacher Student Picker */}
      {isAdminOrTeacher && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Chọn Sinh Viên Tra Cứu Bảng Điểm
            </label>
            {students.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">Chưa có dữ liệu sinh viên trong trường.</p>
            ) : (
              <select
                value={selectedStudentId || ""}
                onChange={(e) => void handleSelectStudent(Number(e.target.value))}
                className="min-w-[280px] rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentCode} - {s.fullName} ({s.gender || "—"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {transcript && (
            <button
              onClick={handleExportExcel}
              className="self-start sm:self-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Xuất Bảng Điểm Excel
            </button>
          )}
        </div>
      )}

      {loading || loadingTranscript ? (
        <div className="my-16 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
          Đang tải kết quả học tập…
        </div>
      ) : !transcript ? (
        <div className="my-16 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
          Chưa tìm thấy dữ liệu điểm của sinh viên này.
        </div>
      ) : (
        <>
          {/* Student Profile & Summary Header */}
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 backdrop-blur-xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 font-black text-xl text-white shadow-lg">
                  {transcript.fullName
                    ? transcript.fullName.split(" ").filter(Boolean).slice(-2).map((p) => p[0]).join("").toUpperCase()
                    : "SV"}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{transcript.fullName}</h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                    Mã SV: <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{transcript.studentCode}</span> · Lớp: <span className="font-bold">{transcript.className || "Chưa xếp lớp"}</span> · Ngành: <span className="font-bold">{transcript.majorName || "Chưa phân ngành"}</span>
                  </p>
                </div>
              </div>

              {!isAdminOrTeacher && (
                <button
                  onClick={handleExportExcel}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Tải Bảng Điểm
                </button>
              )}
            </div>

            {/* Academic KPIs */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AcademicCard
                label="Điểm tích lũy CPA (Hệ 4)"
                value={transcript.cumulativeCpa4 !== null && transcript.cumulativeCpa4 !== undefined ? `${transcript.cumulativeCpa4} / 4.0` : "—"}
                detail="Điểm chuẩn xét tốt nghiệp"
                theme="cyan"
              />
              <AcademicCard
                label="Điểm tích lũy (Hệ 10)"
                value={transcript.cumulativeGpa10 !== null && transcript.cumulativeGpa10 !== undefined ? `${transcript.cumulativeGpa10} / 10.0` : "—"}
                detail="Thang điểm truyền thống"
                theme="violet"
              />
              <AcademicCard
                label="Số tín chỉ tích lũy"
                value={`${transcript.totalEarnedCredits} / ${transcript.totalRegisteredCredits}`}
                detail={`Tỷ lệ hoàn thành: ${transcript.totalRegisteredCredits > 0 ? Math.round((transcript.totalEarnedCredits / transcript.totalRegisteredCredits) * 100) : 0}%`}
                theme="emerald"
              />
              <AcademicCard
                label="Xếp loại học lực"
                value={transcript.academicRank || "Chưa xếp loại"}
                detail="Căn cứ theo thang điểm 4.0"
                theme="amber"
              />
            </div>
          </div>

          {/* Semesters Transcript Breakdown */}
          <div className="mt-8 space-y-6">
            {transcript.semesters.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-8 text-center text-xs font-bold text-slate-500">
                Sinh viên chưa có học phần nào được ghi nhận điểm.
              </div>
            ) : (
              transcript.semesters.map((sem, semIdx) => (
                <section
                  key={semIdx}
                  className="overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 backdrop-blur-xl shadow-sm"
                >
                  {/* Semester Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-black text-xs">
                        {semIdx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {sem.semester} · Năm học {sem.academicYear}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-500">
                          Tổng số tín chỉ đăng ký: <span className="font-bold">{sem.semesterCredits}</span> · Tín chỉ đạt: <span className="font-bold text-emerald-600 dark:text-emerald-400">{sem.semesterEarnedCredits}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-cyan-300 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 px-3.5 py-1.5 text-xs">
                        <span className="font-bold text-cyan-900 dark:text-cyan-300">GPA Kỳ (Hệ 4): </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {sem.semesterGpa4 !== null && sem.semesterGpa4 !== undefined ? sem.semesterGpa4 : "—"}
                        </span>
                      </div>
                      <div className="rounded-xl border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 px-3.5 py-1.5 text-xs">
                        <span className="font-bold text-purple-900 dark:text-purple-300">GPA Kỳ (Hệ 10): </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {sem.semesterGpa10 !== null && sem.semesterGpa10 !== undefined ? sem.semesterGpa10 : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course Grades Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/40 dark:bg-slate-950/20">
                          <th className="py-3 px-4 w-12 text-center">STT</th>
                          <th className="py-3 px-4">Mã môn</th>
                          <th className="py-3 px-4">Tên môn học</th>
                          <th className="py-3 px-4 text-center">Tín chỉ</th>
                          <th className="py-3 px-4 text-center">Chuyên cần</th>
                          <th className="py-3 px-4 text-center">Giữa kỳ</th>
                          <th className="py-3 px-4 text-center">Cuối kỳ</th>
                          <th className="py-3 px-4 text-center">Tổng (Hệ 10)</th>
                          <th className="py-3 px-4 text-center">Điểm chữ</th>
                          <th className="py-3 px-4 text-center">Hệ 4</th>
                          <th className="py-3 px-4 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                        {sem.courses.map((c, cIdx) => (
                          <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-center text-slate-400 font-bold">{cIdx + 1}</td>
                            <td className="py-3 px-4 font-mono font-bold text-cyan-700 dark:text-cyan-300">
                              {c.subjectCode || c.subjectClassCode || "—"}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {c.subjectName || c.subjectClassName || "—"}
                            </td>
                            <td className="py-3 px-4 text-center font-bold">{c.credit ?? "—"}</td>
                            <td className="py-3 px-4 text-center font-mono">{c.attendanceScore !== null && c.attendanceScore !== undefined ? c.attendanceScore : "—"}</td>
                            <td className="py-3 px-4 text-center font-mono">{c.midtermScore !== null && c.midtermScore !== undefined ? c.midtermScore : "—"}</td>
                            <td className="py-3 px-4 text-center font-mono">{c.finalScore !== null && c.finalScore !== undefined ? c.finalScore : "—"}</td>
                            <td className="py-3 px-4 text-center font-mono font-black text-sm text-slate-900 dark:text-white">
                              {c.totalScore !== null && c.totalScore !== undefined ? c.totalScore : "—"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <GradeBadge letter={c.letterGrade} />
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                              {c.gradePoint4 !== null && c.gradePoint4 !== undefined ? c.gradePoint4 : "—"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {c.status === "PASSED" ? (
                                <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                                  Đạt
                                </span>
                              ) : c.status === "FAILED" ? (
                                <span className="inline-block rounded-full bg-red-100 dark:bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-800 dark:text-red-300">
                                  Học lại
                                </span>
                              ) : (
                                <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                  Đang học
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}

function GradeBadge({ letter }: { letter?: string | null }) {
  if (!letter) return <span className="text-slate-400">—</span>;
  let style = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
  if (letter.startsWith("A")) style = "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-black";
  else if (letter.startsWith("B")) style = "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold";
  else if (letter.startsWith("C")) style = "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-bold";
  else if (letter.startsWith("D")) style = "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold";
  else if (letter === "F") style = "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 font-black";

  return <span className={`inline-block rounded-md px-2 py-0.5 font-mono text-xs ${style}`}>{letter}</span>;
}

function AcademicCard({
  label,
  value,
  detail,
  theme,
}: {
  label: string;
  value: string;
  detail: string;
  theme: "cyan" | "violet" | "emerald" | "amber";
}) {
  const styles = {
    cyan: "border-cyan-300 dark:border-cyan-500/30 bg-cyan-50/60 dark:bg-cyan-500/10 text-cyan-900 dark:text-cyan-300",
    violet: "border-purple-300 dark:border-violet-500/30 bg-purple-50/60 dark:bg-violet-500/10 text-purple-900 dark:text-violet-300",
    emerald: "border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300",
    amber: "border-amber-300 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[theme]}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1.5 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-medium text-slate-500">{detail}</p>
    </div>
  );
}