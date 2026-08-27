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
  ENROLLMENTS: {
    BASE: "/enrollments",
    REGISTER: "/enrollments/register",
    MY_REGISTRATIONS: "/enrollments/my-registrations",
    AVAILABLE_CLASSES: "/enrollments/available-classes",
    CANCEL: (subjectClassId: string | number) => `/enrollments/cancel/${subjectClassId}`,
    SUBJECT_CLASS: (subjectClassId: string | number) => `/enrollments/subject-class/${subjectClassId}`,
    BATCH: "/enrollments/batch",
    CLASS_GROUP: "/enrollments/class-group",
  },
  ATTENDANCE: {
    BASE: "/attendance",
    SESSIONS: "/attendance/sessions",
    AUTO_GENERATE: "/attendance/sessions/auto-generate",
    SESSION_RECORDS: (sessionId: string | number) => `/attendance/sessions/${sessionId}/records`,
    SUBMIT_SESSION: (sessionId: string | number) => `/attendance/sessions/${sessionId}/submit`,
    MY_SUMMARY: "/attendance/my-summary",
    MY_DETAILS: "/attendance/my-details",
    BANNED_STUDENTS: "/attendance/banned-students",
  },
} as const;
