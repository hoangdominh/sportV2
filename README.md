# Ứng dụng quản lý chia tiền nhóm

MVP Next.js App Router theo `requirement.md`: đăng nhập bằng NextAuth Credentials, lưu MongoDB Atlas, chia tiền đều, tối ưu settlement, QR chuyển khoản và phân quyền admin/member.

## Chạy local

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

## Chạy trên Windows

Yêu cầu: **Node.js 20.6+** (khuyến nghị Node 20 LTS hoặc 22 LTS).

1. Tải và cài Node.js từ https://nodejs.org/
2. Mở PowerShell hoặc Command Prompt trong thư mục project
3. Cài dependencies:
   ```powershell
   npm install
   ```
4. Tạo file `.env` từ `.env.example` và điền thông tin:
   ```powershell
   copy .env.example .env
   ```
   Mở `.env` và điền:
   - `MONGODB_URI`: connection string từ MongoDB Atlas
   - `NEXTAUTH_SECRET`: chuỗi ngẫu nhiên (ví dụ: `openssl rand -base64 32`)
   - `NEXTAUTH_URL`: `http://localhost:3000`
5. Seed tài khoản mặc định:
   ```powershell
   npm run seed
   ```
6. Chạy dev server:
   ```powershell
   npm run dev
   ```
7. Mở trình duyệt: http://localhost:3000

**Lưu ý MongoDB Atlas:**
- Vào Atlas → Network Access → thêm IP của máy Windows (hoặc `0.0.0.0/0` để cho phép mọi IP)
- Đảm bảo cluster đang **Resume** (không Paused)

Biến môi trường bắt buộc: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Cấu hình `BANK_BIN`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` để QR chuyển khoản đúng tài khoản nhận tiền.

## Quyền

- `admin`: xem dashboard, tạo buổi mới, đổi trạng thái giao dịch đã/chưa chuyển.
- `member`: đăng nhập và chỉ xem dashboard, chi tiết buổi, QR và trạng thái.

## Luồng chính

1. Admin chạy `npm run seed` để tạo user.
2. Admin vào `/events/new`, chọn người tham gia và số tiền mỗi người đã ứng.
3. Hệ thống tính tổng tiền, mức chia đều, balance từng người và danh sách chuyển khoản tối ưu.
4. Thành viên vào `/events/[id]` để xem QR và trạng thái thanh toán.
