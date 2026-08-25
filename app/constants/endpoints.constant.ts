export const API_ENDPOINTS = {
  AUTH: {
    TOKEN: "/auth/token",
    INTROSPECT: "/auth/introspect",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  USERS: {
    BASE: "/users",
    MY_INFO: "/users/myInfo",
    CHANGE_PASSWORD: "/users/change-password",
  },
  STUDENTS: {
    BASE: "/students",
    SEARCH: "/students/search",
    EXPORT: "/students/export",
  },
  TEACHERS: {
    BASE: "/teachers",
    SEARCH: "/teachers/search",
  },
  GRADES: {
    BASE: "/grades",
    MY_TRANSCRIPT: "/grades/my-transcript",
    STUDENT_TRANSCRIPT: (studentId: string | number) => `/grades/student/${studentId}/transcript`,
    SUBJECT_CLASS: (classId: string | number) => `/grades/subject-classes/${classId}`,
  },
  SCHEDULES: {
    BASE: "/schedules",
    MY: "/schedules/my",
  },
} as const;
