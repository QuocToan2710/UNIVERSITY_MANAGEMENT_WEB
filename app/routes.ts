import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("students", "routes/students.tsx"),
  route("teachers", "routes/teachers.tsx"),
  route("courses", "routes/courses.tsx"),
  route("majors", "routes/majors.tsx"),
  route("categories/buildings", "routes/categories/buildings.tsx"),
  route("categories/floors", "routes/categories/floors.tsx"),
  route("categories/rooms", "routes/categories/rooms.tsx"),
  route("class-groups", "routes/class-groups.tsx"),
  route("schedule", "routes/schedule.tsx"),
  route("schedule/timetable", "routes/schedules/timetable.tsx"),
  route("schedule/class", "routes/schedules/class.tsx"),
  route("schedule/exam", "routes/schedules/exam.tsx"),
  route("schedule/teaching", "routes/schedules/teaching.tsx"),
  route("users", "routes/users.tsx"),
] satisfies RouteConfig;
