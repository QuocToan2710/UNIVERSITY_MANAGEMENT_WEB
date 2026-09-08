/**
 * Frontend Error Messages Mapping Dictionary
 * Maps standardized error code strings (dot-separated) from backend ErrorCode enum to user-friendly Vietnamese messages.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // === Common & System ===
  "error.common.uncategorized": "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.",
  "error.common.invalid.key": "Tham số hoặc dữ liệu yêu cầu không hợp lệ.",
  "error.common.data.integrity.violation": "Dữ liệu bị ràng buộc hoặc đã tồn tại trong hệ thống.",
  "error.common.invalid.json.body": "Định dạng dữ liệu gửi lên không đúng chuẩn JSON.",
  "error.common.invalid.param.type": "Tham số trong đường dẫn không đúng định dạng.",
  "error.common.method.not.supported": "Phương thức HTTP không được hỗ trợ cho chức năng này.",
  "error.common.resource.not.found": "Không tìm thấy dữ liệu yêu cầu.",

  // === Authentication & Security ===
  "error.auth.invalid.credentials": "Tên đăng nhập hoặc mật khẩu không chính xác.",
  "error.auth.unauthenticated": "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
  "error.auth.forbidden": "Bạn không có quyền thực hiện thao tác này.",
  "error.auth.otp.invalid": "Mã OTP không chính xác. Vui lòng kiểm tra lại.",
  "error.auth.otp.expired": "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",

  // === User & Account ===
  "error.user.already.exists": "Tài khoản người dùng đã tồn tại trong hệ thống.",
  "error.user.username.invalid": "Tên đăng nhập không đúng định dạng hoặc quá ngắn.",
  "error.user.password.invalid": "Mật khẩu không đúng định dạng hoặc quá ngắn.",
  "error.user.not.found": "Không tìm thấy tài khoản người dùng.",
  "error.user.invalid.dob": "Ngày sinh không hợp lệ hoặc chưa đủ tuổi.",
  "error.role.not.found": "Vai trò (Role) không tồn tại.",
  "error.email.not.found": "Email không tồn tại trong hệ thống.",
  "error.email.send.failed": "Không thể gửi email xác nhận. Vui lòng thử lại sau.",
  "error.email.already.exists": "Email này đã được sử dụng bởi người dùng khác.",

  // === Master Data: Student, Teacher, Major, Class ===
  "error.student.not.found": "Không tìm thấy thông tin sinh viên.",
  "error.teacher.not.found": "Không tìm thấy thông tin giảng viên.",
  "error.course.not.found": "Không tìm thấy môn học / học phần.",
  "error.course.already.exists": "Môn học / học phần này đã tồn tại.",
  "error.class.group.not.found": "Không tìm thấy lớp sinh hoạt.",
  "error.class.group.already.exists": "Mã lớp sinh hoạt đã tồn tại.",
  "error.department.not.found": "Không tìm thấy khoa / viện.",
  "error.major.not.found": "Không tìm thấy chuyên ngành đào tạo.",
  "error.building.not.found": "Không tìm thấy tòa nhà.",
  "error.room.not.found": "Không tìm thấy phòng học.",
  "error.subject.not.found": "Không tìm thấy môn học.",
  "error.subject.class.not.found": "Không tìm thấy lớp học phần.",
  "error.subject.class.already.exists": "Lớp học phần đã tồn tại.",
  "error.province.not.found": "Không tìm thấy tỉnh / thành phố.",
  "error.district.not.found": "Không tìm thấy quận / huyện.",
  "error.ward.not.found": "Không tìm thấy phường / xã.",

  // === Schedule & Timetable ===
  "error.schedule.not.found": "Không tìm thấy lịch học / thời khóa biểu.",
  "error.schedule.teacher.conflict": "Giảng viên đã có lịch dạy khác trong khung giờ này.",
  "error.schedule.room.conflict": "Phòng học đã có lớp sử dụng trong khung giờ này.",
  "error.schedule.time.invalid": "Thời gian kết thúc phải sau thời gian bắt đầu.",

  // === Course Registration & Enrollment ===
  "error.enrollment.not.found": "Không tìm thấy bản ghi đăng ký học phần.",
  "error.enrollment.already.exists": "Sinh viên đã đăng ký lớp học phần này trước đó.",
  "error.enrollment.capacity.full": "Lớp học phần đã đủ sĩ số tối đa, không thể đăng ký thêm.",
  "error.enrollment.schedule.conflict": "Trùng lịch học với một môn học khác đã đăng ký.",

  // === Grades & Examination ===
  "error.grade.locked": "Bảng điểm lớp học phần này đã bị khóa, không thể chỉnh sửa.",
  "error.grade.invalid.score": "Điểm số phải nằm trong thang điểm từ 0.0 đến 10.0.",
  "error.grade.not.submitted": "Điểm phải được nộp trước khi công bố.",

  // === Attendance ===
  "error.attendance.session.not.found": "Không tìm thấy buổi điểm danh này."
};

/**
 * Helper to resolve friendly error message from error code string or fallback
 */
export function resolveErrorMessage(errorCode?: string): string {
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  return errorCode || "Đã có lỗi xảy ra. Vui lòng thử lại!";
}