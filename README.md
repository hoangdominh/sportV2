# Ứng dụng quản lý chia tiền nhóm

MVP Next.js App Router theo `requirement.md`: đăng nhập bằng NextAuth Credentials, lưu MongoDB Atlas, chia tiền đều, tối ưu settlement, QR chuyển khoản và phân quyền admin/member.

## Chạy local

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

Biến môi trường bắt buộc: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Cấu hình `BANK_BIN`, `BANK_ACCOUNT_NO`, `BANK_ACCOUNT_NAME` để QR chuyển khoản đúng tài khoản nhận tiền.

## Quyền

- `admin`: xem dashboard, tạo buổi mới, đổi trạng thái giao dịch đã/chưa chuyển.
- `member`: đăng nhập và chỉ xem dashboard, chi tiết buổi, QR và trạng thái.

## Luồng chính

1. Admin chạy `npm run seed` để tạo user.
2. Admin vào `/events/new`, chọn người tham gia và số tiền mỗi người đã ứng.
3. Hệ thống tính tổng tiền, mức chia đều, balance từng người và danh sách chuyển khoản tối ưu.
4. Thành viên vào `/events/[id]` để xem QR và trạng thái thanh toán.
