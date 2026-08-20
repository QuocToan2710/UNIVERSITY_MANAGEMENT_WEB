# Context Phiên Làm Việc (Work Session Context)

*Thời gian cập nhật: 20/08/2026*

---

## 1. Tổng quan hệ thống (System Overview)

- **Frontend Techstack:** React 19, React Router v8, Vite, TypeScript, Tailwind CSS v4.
- **Backend Techstack:** Java Spring Boot 3, Spring Security, JWT, JPA / Hibernate, MySQL.
- **Thư mục Frontend chính:** `D:\My Project\UNIVERSITY_MANAGEMENT\react_tutorial\`
- **Thư mục Backend chính:** `D:\My Project\UNIVERSITY_MANAGEMENT\university-management\`
- **Kiến trúc phân tầng:**
  - `app/routes/`: 16 màn hình chức năng (Tổng quan, Sinh viên, Giảng viên, Môn học, Ngành học, Lớp học phần, Tài khoản, Thông báo, Danh mục Tòa/Tầng/Phòng/Địa giới, Lịch học/Lịch thi/Lịch dạy/Thời khóa biểu matrix, Đăng nhập).
  - `app/components/`: Khung ứng dụng `app-shell.tsx`, `icons.tsx`, thanh tìm kiếm & lọc `search-export-bar.tsx`, phân trang `pagination.tsx`, ma trận `timetable.tsx`, v.v.
  - `app/components/forms/`: 12 Modal Forms tạo mới/chỉnh sửa thực thể.
  - `app/services/`: 13 Domain API services chuẩn hóa (`student.service.ts`, `teacher.service.ts`, `schedule.service.ts`, `notification.service.ts`, v.v.).
  - `app/contexts/`: `theme-context.tsx` quản lý Dark/Light/System theme.
  - `app/app.css`: Design System, CSS Typography & GPU Animation Rules.

---

## 2. Các công việc đã hoàn thành trong phiên làm việc ngày 20/08/2026 (Completed Work)

### A. Kiểm thử & Sửa lỗi Backend (Spring Boot Stability & Tests)
- **Sửa lỗi UserRepository:** Bổ sung phương thức truy vấn `findAllByDeletedFalse()` trong `UserRepository.java` để lọc người dùng còn hiệu lực.
- **Sửa lỗi Unit Test SecurityContext:** Cập nhật `NotificationServiceTest.java` khởi tạo `UsernamePasswordAuthenticationToken` kèm `GrantedAuthority` chuẩn xác theo Spring Security.
- **Kết quả Build & Test:**
  - Chạy `mvn clean test` $\rightarrow$ **7/7 tests PASS (BUILD SUCCESS)**.
  - Chạy `mvn package -DskipTests` $\rightarrow$ **BUILD SUCCESS**.

### B. Nâng cấp Hệ thống Thông báo Thời gian thực (Live Notifications System)
- **Phát sự kiện cập nhật tức thì (`notifications-updated`):** Cơ chế Custom Event đồng bộ trạng thái số lượng thông báo chưa đọc ngay khi gửi thông báo mới hoặc đánh dấu đã đọc.
- **Bộ lọc quyền người nhận thông báo:** Hỗ trợ gửi theo từng nhóm quyền cụ thể: `Tất cả (ALL)`, `Quản trị viên (ADMIN)`, `Giảng viên (TEACHER)`, `Sinh viên (STUDENT)`.
- **Hiệu ứng Chuông thông báo:** Radar ping phát quang đỏ (`animate-ping`) và hoạt ảnh rung chuông (`animate-bounce`) khi có thông báo chưa đọc.

### C. Nâng cấp Giao diện Thời khóa biểu (High-Contrast Timetable Typography)
- Chuyển đổi toàn bộ mốc thời gian, tiết học, ca học trong `timetable.tsx` sang màu đen tuyền đậm nét (`font-mono font-black text-slate-950`), đảm bảo độ tương phản cao và rõ nét tuyệt đối trên bảng lịch.

### D. Nâng cấp Giao diện Đăng nhập & Hiệu ứng Đồ họa (Login Experience & Visuals)
- **Tiêu đề lướt sóng màu sắc:** Hoạt ảnh gradient sweep mượt mà liên tục từ dòng trên (*Quản trị đào tạo*) xuống dòng dưới (*Trực quan & Hiện đại*) với tốc độ êm ái.
- **Hình nền 4K Ultra-HD Masterpiece:** Cập nhật ảnh chụp khuôn viên đại học hiện đại mùa hoa anh đào nở rộ với hồ nước phản chiếu và kiến trúc kính sang trọng (`university-campus-cherry-blossom.jpg`).
- **Hiệu ứng Cánh hoa đào rơi (Sakura Falling Petals):** 12 cánh hoa đào chuyển sắc hồng phấn rơi tản đều tự nhiên trên toàn màn hình với chu kỳ êm dịu (`14s ~ 22s`), thay thế pháo hoa giấy theo yêu cầu.

### E. Thiết kế Logo 3D Mô hình Nguyên tử Khoa học (3D Quantum Atom Model)
- **Hạt nhân trung tâm (`atom-nucleus`):** Khối thủy tinh 3D phát quang với chữ **E** nổi bật, có nhịp thở năng lượng (*nuclear energy pulse*).
- **4 Quỹ đạo Electron 3D quay chéo quanh hạt nhân (`atom-orbital-ring`):** 4 quỹ đạo nét đứt đối xứng hình học hoàn hảo ở các góc $0^\circ, 45^\circ, 90^\circ, 135^\circ$ bao quanh hạt nhân.
- **4 Hạt Electron phát quang (`atom-electron`):** Mang các sắc màu neon (*Cyan, Purple, Sky, Emerald*) chuyển động tuần hoàn liên tục trong không gian 3D.
- Đồng bộ hoàn toàn trên cả **Logo trang Login** và **Logo Sidebar/Header** (`icons.tsx`).

### F. Tối ưu hóa Hiệu năng Đồ họa Toàn diện (Zero-Lag 60 FPS)
- Cách ly phần cứng đồ họa GPU qua `transform: translate3d(...)`, `backface-visibility: hidden` và `contain: strict`.
- Loại bỏ các bộ lọc nặng gây giọt khung hình, đảm bảo ứng dụng load tức thì và chạy siêu mượt mà.
- Hỗ trợ chế độ tiết kiệm tài nguyên `@media (prefers-reduced-motion: reduce)`.

---

## 3. Trạng thái kiểm tra (Verification Status)

- **Backend Tests:** 7/7 tests passed (BUILD SUCCESS).
- **Frontend Build (`npm run build`):** Built client & SSR server successfully in 1.17s (0 errors).

---

## 4. Hướng dẫn tiếp tục phát triển (Next Steps)

1. Giữ vững chuẩn Design System và token màu sắc nhất quán giữa chế độ Sáng và Tối.
2. Kiểm tra lại bằng lệnh `npm run build` và `mvn test` sau mỗi lần nâng cấp tính năng mới.
