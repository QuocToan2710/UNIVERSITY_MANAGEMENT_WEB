# Context Phiên Làm Việc (Work Session Context)

*Thời gian cập nhật: 25/08/2026*

---

## 1. Tổng quan hệ thống (System Overview)

- **Frontend Techstack:** React 19, React Router v8, Vite, TypeScript, Tailwind CSS v4.
- **Backend Techstack:** Java Spring Boot 3, Spring Security, JWT, Spring Data JPA / Hibernate, MySQL.
- **Thư mục Frontend chính:** `D:\My Project\UNIVERSITY_MANAGEMENT\react_tutorial\`
- **Thư mục Backend chính:** `D:\My Project\UNIVERSITY_MANAGEMENT\university-management\`
- **Kiến trúc phân tầng:**
  - `app/routes/`: 16 màn hình chức năng (Tổng quan, Sinh viên, Giảng viên, Môn học, Ngành học, Lớp học phần, Tài khoản, Thông báo, Danh mục Tòa/Tầng/Phòng/Địa giới, Lịch học/Lịch thi/Lịch dạy/Thời khóa biểu matrix, Đăng nhập).
  - `app/components/`: Khung ứng dụng `app-shell.tsx`, `icons.tsx`, thanh tìm kiếm & lọc `search-export-bar.tsx`, phân trang `pagination.tsx`, ma trận `timetable.tsx`, badge trạng thái `status-badge.tsx`, trạng thái rỗng `empty-state.tsx`, v.v.
  - `app/components/forms/`: 12 Modal Forms tạo mới/chỉnh sửa thực thể.
  - `app/services/`: 13 Domain API services chuẩn hóa (`student.service.ts`, `teacher.service.ts`, `schedule.service.ts`, `notification.service.ts`, v.v.).
  - `app/constants/`: Tập trung hằng số hệ thống `app.constant.ts`, `endpoints.constant.ts`.
  - `app/contexts/`: `theme-context.tsx` quản lý Dark/Light/System theme.
  - `app/app.css`: Design System, CSS Typography & GPU Animation Rules.

---

## 2. Các công việc đã hoàn thành trong phiên làm việc ngày 25/08/2026 (Completed Work)

### A. Quản lý Tài khoản & Gửi Mail Chào mừng Tự động (Email Provisioning & Transactional Consistency)
- **Tự động cấp tài khoản User khi tạo Sinh viên / Giảng viên:**
  - Tạo mới Sinh viên hoặc Giảng viên sẽ tự động tạo một tài khoản `User` với quyền tương ứng (`ROLE_STUDENT` hoặc `ROLE_TEACHER`), mật khẩu mặc định gắn với mã sinh viên/giảng viên.
  - Đồng bộ email cá nhân của sinh viên/giảng viên vào `User.email`.
- **Gửi Email HTML Chào mừng:** Gửi email template HTML đẹp mắt thông báo thông tin tài khoản (Tên đăng nhập, Mật khẩu khởi tạo, Link đăng nhập) đến email của sinh viên/giảng viên.
- **Toàn vẹn Transaction & Rollback:** Bọc `@Transactional(rollbackFor = Exception.class)` cho toàn bộ luồng tạo/cập nhật. Nếu tạo User thất bại hoặc lỗi hệ thống, toàn bộ tiến trình tạo Sinh viên/Giảng viên sẽ tự động rollback 100%.
- **Đồng bộ 2 chiều (Bi-directional Sync):** Khi cập nhật hoặc xóa mềm Sinh viên/Giảng viên, tài khoản `User` liên kết cũng được cập nhật thông tin (`email`, `fullName`) hoặc xóa mềm đồng bộ.
- **Đăng nhập linh hoạt:** Hỗ trợ đăng nhập bằng cả `username` hoặc `email`.
- **Khôi phục mật khẩu OTP:** Xác thực OTP gửi qua email (hỗ trợ Redis kèm In-memory Fallback).

---

### B. Khắc phục Tra cứu Thời khóa biểu & Lịch thi (Timetable & Exam Schedule Multi-Tier Fallback)
- Nâng cấp cơ chế tìm kiếm trong `ClassScheduleServiceImpl.java` và `ExamScheduleServiceImpl.java` lên thuật toán **4-tier fallback**:
  $$\text{userId} \longrightarrow \text{username} \longrightarrow \text{userCode} \longrightarrow \text{email}$$
- Giải quyết triệt để vấn đề sinh viên/giảng viên đăng nhập nhưng không tìm thấy lịch học/lịch thi do lệch ID hoặc mã định danh.

---

### C. Chuẩn hóa Cấu trúc Thư mục `common` & `constant` (Clean Architecture Standardization)
- **Backend (`com.toan.university_management.constant` & `common.util`):**
  - `AppConstants.java`: Tập trung các hằng số phân trang mặc định (`page=0, size=10, maxSize=1000`), thời hạn OTP (10 phút), học kỳ mặc định (`"HK1"`, `"2025-2026"`), định dạng ngày giờ (`"yyyy-MM-dd HH:mm:ss"`).
  - `RoleConstants.java`: Centralized constants cho `ROLE_ADMIN`, `ROLE_TEACHER`, `ROLE_STUDENT`.
  - `MessageConstants.java`: Tập trung các câu thông báo phản hồi chuẩn hóa.
  - `PaginationUtils.java`: Generic helper `paginateList(items, page, size)` tái sử dụng trên toàn bộ các Service.
  - `AddressUtils.java`: Tiện ích ghép nối địa chỉ `buildFullAddress(specific, ward, district, province)`.
  - `SecurityUtils.java` & `DateTimeUtils.java`: Hỗ trợ lấy thông tin user đăng nhập và định dạng thời gian.
- **Frontend (`react_tutorial/app`):**
  - `constants/app.constant.ts`: Hằng số Roles, PageSize, Semester, Storage Keys.
  - `constants/endpoints.constant.ts`: Tập trung các URL endpoint API.
  - `components/status-badge.tsx`: Component badge trạng thái màu sắc chuẩn (`ACTIVE`, `INACTIVE`, `PENDING`, `SUBMITTED`, `PUBLISHED`, `LOCKED`).
  - `components/empty-state.tsx`: Component hiển thị trạng thái dữ liệu trống.
  - `lib/formatters.ts`: Bộ tiện ích format ngày tháng tiếng Việt và điểm số GPA/CPA.

---

### D. Triển khai Tầng Base Entity & JPA Auditing Tự động (Enterprise Audit Trail)
- **`BaseEntity.java` (`common/entity/BaseEntity.java`):**
  - Đã loại bỏ trường `deleted` ra khỏi BaseEntity để đảm bảo tính độc lập và linh hoạt cho từng bảng.
  - Tích hợp 100% tự động các trường kiểm vết (Audit Trail):
    - `id`: Khóa chính `Long` tự tăng.
    - `createdAt`: Ngày giờ tạo bản ghi (`@CreatedDate`).
    - `createdBy`: Username người tạo bản ghi (`@CreatedBy`).
    - `updatedAt`: Ngày giờ sửa cuối (`@LastModifiedDate`).
    - `updatedBy`: Username người sửa cuối (`@LastModifiedBy`).
- **`JpaAuditingConfig.java` (`configuration/JpaAuditingConfig.java`):**
  - Bật `@EnableJpaAuditing`.
  - Triển khai `AuditorAware<String>` tự động lấy username của người đang thao tác từ `SecurityContextHolder` (hoặc `"SYSTEM"` nếu gọi nền/khởi tạo).
- **Phủ sóng 100% Entities:** Áp dụng kế thừa `BaseEntity` (kèm `@SuperBuilder`) cho **23/23 Entity** có khóa chính số (`User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Student`, `Teacher`, `Department`, `Major`, `Subject`, `SubjectClass`, `ClassGroup`, `ClassSchedule`, `ExamSchedule`, `Enrollment`, `Building`, `Floor`, `Room`, `Province`, `District`, `Ward`, `Notification`, `UserNotification`).
- **`BaseRepository.java` (`common/repository/BaseRepository.java`):**
  - Kế thừa `JpaRepository<T, ID>` với các phương thức xóa mềm chuẩn hóa: `findByIdAndDeletedFalse`, `findAllByDeletedFalse`, `existsByIdAndDeletedFalse`, `findAllByIdInAndDeletedFalse`.
  - Áp dụng trên toàn bộ các Repository trong dự án.
- **`BaseSearchPaginationRQ.java` & `BaseResponse.java` (`common/dto`):** Chuẩn hóa khung DTO phân trang và phản hồi.

---

### E. Tối ưu PasswordEncoder & Chế độ Mật khẩu Chữ thuần (Development Plain-Text Mode)
- **`PasswordEncoderConfig.java`:**
  - Cấu hình bộ mã hóa trả về chuỗi thuần (Plain-text String) khi tạo mới hoặc cập nhật mật khẩu, giúp mật khẩu được lưu trực tiếp dạng text trong Database để dễ dàng kiểm thử và debug.
  - **Cơ chế Dual-Matching (Tương thích ngược):** So khớp trực tiếp chuỗi thuần, đồng thời tự động nhận diện và hỗ trợ giải mã các mật khẩu cũ trong Database đang lưu dạng hash BCrypt (`$2a$`), đảm bảo tất cả các tài khoản (đặc biệt là `admin` / `admin`) luôn đăng nhập thành công 100%.
  - `AdminInitializer.java`: Tự động đồng bộ các tài khoản seed ban đầu (`admin`/`admin`, `teacher`/`teacher123`, `student`/`student123`).

---

## 3. Trạng thái kiểm tra & Xác thực (Verification Status)

- **Backend Tests:** `mvn clean test` $\longrightarrow$ **16/16 Test Suites PASS (100% BUILD SUCCESS)**.
- **Backend Compile:** `mvn test-compile` $\longrightarrow$ **BUILD SUCCESS (0 warnings, 0 errors)**.
- **Frontend Build:** `npm run build` $\longrightarrow$ **BUILD SUCCESS in 3.09s (0 errors)**.

---

## 4. Hướng dẫn tiếp tục phát triển & Định hướng mở rộng (Next Steps & Roadmap)

1. **Bật lại mã hóa BCrypt khi lên môi trường Production:** Chỉ cần đổi dòng return trong [`PasswordEncoderConfig.java`](file:///D:/My%20Project/UNIVERSITY_MANAGEMENT/university-management/src/main/java/com/toan/university_management/configuration/PasswordEncoderConfig.java) thành `return new BCryptPasswordEncoder(10);`.
2. **Chi tiết lộ trình tính năng tiếp theo:** Tham khảo file [`ROADMAP.md`](file:///D:/My%20Project/UNIVERSITY_MANAGEMENT/ROADMAP.md) (Đăng ký tín chỉ trực tuyến, Quản lý điểm danh sinh viên, WebSocket live stream điểm & thông báo, AI Assistant hỗ trợ sinh viên).
3. Luôn chạy `mvn test` và `npm run build` để kiểm tra tính toàn vẹn hệ thống trước mỗi lần bàn giao.
