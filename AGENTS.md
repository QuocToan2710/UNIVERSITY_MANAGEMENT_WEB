# Hướng dẫn làm việc cho AI agents

## Công nghệ và cấu trúc

- Ứng dụng dùng React 19, React Router 8, Vite, TypeScript và Tailwind CSS 4.
- Mã nguồn ứng dụng nằm trong `app/`.
- Route được khai báo tại `app/routes.ts`; các trang nằm trong `app/routes/`.
- Component dùng chung đặt tại `app/components/`; gọi API ở `app/lib/api.ts`; kiểu dữ liệu ở `app/types/`.

## Quy ước thay đổi

- Ưu tiên TypeScript và component React function.
- Giữ giao diện tiếng Việt nhất quán với các trang hiện có.
- Tái sử dụng `apiRequest` thay vì gọi `fetch` trực tiếp khi làm việc với backend.
- Không đưa token, mật khẩu, URL private hoặc dữ liệu nhạy cảm vào mã nguồn hay tài liệu.
- Chỉ thay đổi các file liên quan trực tiếp đến yêu cầu; không ghi đè thay đổi sẵn có của người dùng.

## Kiểm tra trước khi bàn giao

- Chạy `npm run typecheck` sau thay đổi TypeScript khi phù hợp.
- Chạy `npm run lint` sau thay đổi mã nguồn khi phù hợp.
- Dùng `npm run dev` khi cần kiểm tra giao diện; không chạy production build trong phiên phát triển thông thường.

## Lịch sử và quyết định

- Dùng Git commits cho lịch sử thay đổi.
- Chỉ tạo tài liệu quyết định kỹ thuật khi quyết định đó ảnh hưởng lâu dài đến kiến trúc hoặc vận hành.
