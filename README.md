# EduManage

Ứng dụng quản lý đào tạo xây dựng bằng React Router, React, TypeScript, Vite và Tailwind CSS.

## Chức năng hiện có

- Đăng nhập và lưu access token trên trình duyệt.
- Quản lý sinh viên, giảng viên, khóa học và người dùng.
- Giao diện tổng quan cho hệ thống quản lý đào tạo.

## Yêu cầu

- Node.js 20 trở lên.
- Backend API chạy tại `http://localhost:8080` (cấu hình hiện tại trong `app/lib/api.ts`).

## Khởi chạy

```bash
npm install
npm run dev
```

Mở `http://localhost:5173` trong trình duyệt.

## Kiểm tra mã nguồn

```bash
npm run typecheck
npm run lint
```

## Cấu trúc chính

```text
app/
├── components/  # Thành phần giao diện dùng chung
├── lib/         # Tiện ích và lớp gọi API
├── routes/      # Các trang theo route
├── types/       # Kiểu dữ liệu TypeScript
└── routes.ts    # Khai báo route của ứng dụng
```

## Ghi chú cho AI agents

Xem [AGENTS.md](AGENTS.md) để biết quy ước làm việc trong dự án.
