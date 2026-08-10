import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("students", "routes/students.tsx"),
  route("teachers", "routes/teachers.tsx"),
  route("courses", "routes/courses.tsx"),
  route("class-groups", "routes/class-groups.tsx"),
  route("schedule", "routes/schedule.tsx"),
  route("users", "routes/users.tsx"),
] satisfies RouteConfig;

