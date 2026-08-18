# Context Phiên Làm Việc (Work Session Context)

*Thời gian cập nhật: 19/08/2026*

---

## 1. Tổng quan hệ thống (System Overview)

- **Frontend Techstack:** React 19, React Router v8, Vite, TypeScript, Tailwind CSS v4.
- **Backend Techstack:** Java Spring Boot, MySQL/PostgreSQL, JWT Authentication.
- **Thư mục Frontend chính:** `D:\My Project\UNIVERSITY_MANAGEMENT\react_tutorial\`
- **Kiến trúc phân tầng Frontend:**
  - `app/routes/`: 16 màn hình chức năng (Tổng quan, Sinh viên, Giảng viên, Môn học, Ngành học, Lớp học phần, Tài khoản, Danh mục Tòa/Tầng/Phòng, Lịch học/Lịch thi/Lịch dạy/Thời khóa biểu matrix).
  - `app/components/`: Khung ứng dụng `app-shell.tsx`, thanh tìm kiếm & lọc `search-export-bar.tsx`, phân trang `pagination.tsx`, ma trận `timetable.tsx`, v.v.
  - `app/components/forms/`: 12 Modal Forms tạo mới/chỉnh sửa thực thể.
  - `app/services/`: 12 Domain API services chuẩn hóa (`student.service.ts`, `teacher.service.ts`, `schedule.service.ts`, v.v.).
  - `app/contexts/`: `theme-context.tsx` quản lý Dark/Light/System theme.
  - `app/app.css`: Design System & CSS Typography Rules.

---

## 2. Các công việc đã hoàn thành trong phiên làm việc (Completed Work)

### A. Chuẩn hóa cấu trúc thư mục & Services Layer
- Dọn dẹp các thư mục rác cũ (`react_tutorial/app/welcome/`, file trùng lặp `app/routes/rooms.tsx`).
- Tách tầng gọi API thành 12 module service chuẩn hóa trong `app/services/`.

### B. Giải quyết tận gốc lỗi Theme & Màu sắc trên Tailwind CSS v4
- **Kích hoạt Class-based Dark Mode:** Đã cấu hình `@custom-variant dark (&:where(.dark, .dark *));` trong `app.css`. Nhờ đó khi người dùng chọn Chế độ Sáng (`html.light`), toàn bộ các class `dark:*` bị vô hiệu hóa ngay lập tức và đồng bộ 100% trên toàn màn hình (không còn bị hệ điều hành ép dark mode).
- **Chuẩn hóa hệ màu nền (Surface Hierarchy):**
  - **Level 0 (Canvas):** Nền toàn trang sử dụng duy nhất `bg-slate-50` (Sáng) và `bg-[#070e1e]` (Tối).
  - **Level 1 (Cards, Sidebar, Header, Tables, Modals):** Nền trắng sạch `bg-white` với viền `border-slate-200` ở Chế độ Sáng và `bg-slate-900` viền `border-white/10` ở Chế độ Tối.
  - **Level 2 (Sub-containers, Search bars, Table Headers):** Nền `bg-white` / `bg-slate-100` viền `border-slate-200`.

### C. Khắc phục triệt để lỗi Chữ trắng trên Nền sáng (High Contrast Typography)
- Rà soát và chuyển đổi toàn bộ `text-white` không có tiền tố `dark:` trên tất cả 16 màn hình và 12 Modal Forms sang `text-slate-900 dark:text-white` hoặc `text-slate-800 dark:text-slate-200`.
- Xóa bỏ bộ chọn CSS tổng quát đè màu `[class*="bg-gradient-to"] > span` trong `app.css`.
- Nút bấm Gradient (`button[class*="bg-gradient"]`, `a[class*="bg-gradient"]`) được bảo toàn chữ trắng tinh khiết `text-white` trên cả hai chế độ.

### D. Nâng cấp Menu Điều hướng & Popup Tài khoản
- **Trạng thái Active/Focus của Menu Sidebar (Tổng quan, Lịch học, Lớp học phần, v.v.):** Khi chọn, hiển thị nền `bg-sky-100` với viền `border-sky-400`, chữ **`text-sky-950 font-extrabold`** và icon `text-sky-800` sắc nét, dễ nhìn.
- **Popup Tài khoản:** Chữ "Thông tin tài khoản" và "Đổi mật khẩu & Bảo mật" sử dụng `text-slate-800 dark:text-slate-200`, khi hover chuyển `text-cyan-700`.
- **Nút "Bộ lọc nâng cao":** Xóa lỗi gán class `dark:bg-white`, hỗ trợ đổi màu chính xác giữa Sáng và Tối.

---

## 3. Trạng thái kiểm tra (Verification Status)

- **TypeScript (`npm run typecheck`):** Passed (0 errors).
- **Vite Build (`npm run build`):** Built client & SSR server successfully (165 modules transformed, 0 errors).

---

## 4. Hướng dẫn tiếp tục phát triển (Next Steps)

1. Mọi component mới cần tuân thủ Design Token:
   - Thẻ Card/Bảng: `bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white`.
   - Ô nhập liệu: `bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-white/10`.
   - Nút gradient: Giữ `text-white`.
2. Kiểm tra lại bằng lệnh `npm run typecheck` sau mỗi lần cập nhật code.
