export const ROLES = {
  ADMIN: "ROLE_ADMIN",
  TEACHER: "ROLE_TEACHER",
  STUDENT: "ROLE_STUDENT",
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_SEMESTER = "HK1";
export const DEFAULT_ACADEMIC_YEAR = "2025-2026";

export const SEMESTER_OPTIONS = [
  { value: "HK1", label: "Học kỳ 1" },
  { value: "HK2", label: "Học kỳ 2" },
  { value: "HK3", label: "Học kỳ Hè (HK3)" },
];

export const TOKEN_KEY = "access_token";
export const THEME_KEY = "theme_preference";
