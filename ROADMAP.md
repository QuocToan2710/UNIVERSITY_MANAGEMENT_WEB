# Lộ Trình Phát Triển & Định Hướng Mở Rộng Hệ Thống (Roadmap & Feature Extensions)

*Tài liệu định hướng nâng cấp trước buổi Review / Đánh giá Đồ án / Báo cáo Sprint*  
*Cập nhật: 25/08/2026*

---

## 1. Nhóm Nghiệp Vụ Đào Tạo Cốt Lõi (Core Academic Modules)
> **Mục tiêu:** Hoàn thiện vòng đời đào tạo đại học (Từ tuyển sinh -> Xếp lịch -> Đăng ký môn -> Điểm danh -> Nhập điểm -> Bảng điểm/Tốt nghiệp).

- [x] **1.1. Quản lý Điểm & Bảng điểm sinh viên (Grade & Transcript Management) - [ĐÃ HOÀN THÀNH]:**
  - **Mô tả:** Tận dụng entity `Enrollment` (đã có sẵn `attendanceScore`, `midtermScore`, `finalScore`, `totalScore`, `letterGrade`, `gradePoint4`).
  - **Giảng viên & Admin:** Giao diện nhập điểm học phần theo danh sách lớp (`/grades`), biểu đồ phân bổ phổ điểm realtime, tính điểm tự động, xuất file Excel và chuyển trạng thái bảng điểm (`DRAFT -> SUBMITTED -> PUBLISHED -> LOCKED`).
  - **Sinh viên:** Tra cứu bảng điểm cá nhân (`/transcripts`), tính điểm trung bình học kỳ (GPA Thang 10 & Thang 4), điểm tích lũy toàn khóa (CPA), xếp loại học lực (*Xuất sắc, Giỏi, Khá, Trung bình, Yếu*), in bảng điểm kết quả học tập.

- [ ] **1.2. Cổng Đăng ký Tín chỉ Trực tuyến (Student Course Registration Portal):**
  - **Mô tả:** Sinh viên chủ động đăng ký học phần trong đợt đăng ký tín chỉ mở theo kỳ.
  - **Quy tắc kiểm tra (Business Constraints):**
    - Kiểm tra xung đột / trùng lịch học (`ClassSchedule`).
    - Kiểm tra sĩ số tối đa của lớp học phần (`maxCapacity`).
    - Kiểm tra điều kiện môn học tiên quyết (`Prerequisites`).

- [ ] **1.3. Quản lý Điểm danh & Chuyên cần (Attendance & Absence Warning):**
  - Giảng viên điểm danh từng buổi theo lịch dạy.
  - Sinh viên theo dõi tỷ lệ nghỉ học (% vắng), tự động gửi thông báo / cảnh báo nếu vắng quá 20% số tiết (*Cấm thi kết thúc học phần*).

---

## 2. Nhóm Tính Năng Kỹ Thuật & Kiến Trúc (Technical & Architecture Highlights)
> **Mục tiêu:** Tạo điểm nhấn công nghệ và chuẩn mực kỹ thuật (Wow factors) trước hội đồng review.

- [x] **2.1. Kiểm Vết Tự Động Toàn Hệ Thống (JPA Audit Trail & Base Layer) - [ĐÃ HOÀN THÀNH]:**
  - Kế thừa `BaseEntity` trên 100% Entity (23/23 bảng có ID số), tự động ghi nhận `createdAt`, `createdBy`, `updatedAt`, `updatedBy` từ Spring Security Context qua `AuditorAware`.
  - Tầng `BaseRepository<T, ID>` chuẩn hóa các truy vấn xóa mềm (`findAllByDeletedFalse`, `findByIdAndDeletedFalse`, `findAllByIdInAndDeletedFalse`).
  - Chuẩn hóa tầng `common` (`PaginationUtils`, `AddressUtils`, `AppConstants`, `RoleConstants`).

- [x] **2.2. Cơ Chế Cấp Tài Khoản & Gửi Mail Chào Mừng Tự Động - [ĐÃ HOÀN THÀNH]:**
  - Tự động tạo tài khoản User và gửi email HTML chào mừng kèm thông tin đăng nhập khi tạo mới Sinh viên / Giảng viên.
  - Bọc `@Transactional(rollbackFor = Exception.class)` đảm bảo tính toàn vẹn và Atomic Rollback nếu tạo User thất bại.
  - Khôi phục mật khẩu an toàn bằng OTP gửi qua email (Redis + Memory Fallback).

- [ ] **2.3. Import / Export Dữ liệu Hàng loạt bằng Excel (Bulk Excel Data Processing):**
  - Tải file Excel mẫu (*Template*) và upload danh sách Sinh viên, Giảng viên, Danh mục Phòng học, Lịch thi.
  - Tích hợp thư viện Apache POI, kiểm tra và hiển thị chi tiết dòng lỗi nếu có dữ liệu không hợp lệ.

- [ ] **2.4. Nâng cấp Thông báo Thời gian thực qua WebSocket / SSE:**
  - Thay thế cơ chế Polling hiện tại bằng Spring WebSocket (STOMP) hoặc Server-Sent Events (SSE).
  - Push thông báo tức thì khi có điểm mới, có thông báo khẩn từ Admin hoặc thay đổi phòng học.

- [ ] **2.5. Tích hợp Cổng thanh toán Học phí Giả lập (Payment Gateway Sandbox):**
  - Tích hợp VNPay / MoMo Sandbox cho sinh viên thanh toán học phí học phần trực tuyến kèm hóa đơn điện tử.

- [ ] **2.6. Trợ lý Ảo AI Học vụ (AI Academic Assistant):**
  - Tích hợp Gemini API dưới dạng widget chatbox hỗ trợ sinh viên tra cứu quy chế đào tạo, hướng dẫn thủ tục học vụ và nhắc lịch học.

---

## 3. Nhóm Trải Nghiệm Người Dùng (UX/UI & Analytics)
> **Mục tiêu:** Trực quan hóa dữ liệu và tối ưu hóa luồng trải nghiệm theo từng đối tượng người dùng.

- [ ] **3.1. Dashboard Thống kê & Phân tích Đào tạo (Analytics & Charts):**
  - Bổ sung biểu đồ Recharts vào Dashboard:
    - Phân bổ sinh viên theo Ngành / Khoa.
    - Tỷ lệ sinh viên đạt / trượt học phần theo kỳ.
    - Thống kê tỷ lệ sử dụng phòng học theo thời gian thực.

- [ ] **3.2. Cá nhân hóa Giao diện theo Role (Role-based Portal Experience):**
  - **Sinh viên:** Dashboard tập trung vào Thời khóa biểu hôm nay, Điểm số mới nhất, Học phí cần đóng.
  - **Giảng viên:** Dashboard tập trung vào Lịch dạy trong tuần, Lớp học phần đang phụ trách, Danh sách cần nhập điểm.
  - **Quản trị viên (Admin):** Dashboard quản trị số liệu toàn trường.

---

## 4. Checklist Chuẩn Bị Trước Giờ Review / Demo (Pre-Review Checklist)

- [x] **Dữ liệu mẫu đầy đủ (Rich Seed Data):** `AdminInitializer.java` tự động khởi tạo dữ liệu mẫu phong phú (Khoa, Ngành, Môn học, Lớp học phần, Tòa nhà, Tầng, Phòng học, Thời khóa biểu, Lịch thi, Lớp sinh viên).
- [x] **Tài khoản Demo sẵn sàng:** 3 tài khoản mẫu chuẩn (`admin`/`admin`, `teacher`/`teacher123`, `student`/`student123`).
- [x] **Kịch bản Demo liền mạch (Demo Script):** *Admin quản lý danh mục/phân lịch -> Sinh viên xem thời khóa biểu/bảng điểm -> Giảng viên nhập điểm -> Xuất dữ liệu Excel*.
- [x] **Độ ổn định & Kiểm thử:** `npm run build` và `mvn clean test` **100% PASS (0 errors)**.
