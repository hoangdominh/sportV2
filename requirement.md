# TỔNG HỢP DỰ ÁN: Ứng dụng quản lý chia tiền nhóm

> Tài liệu tổng hợp từ yêu cầu bài toán ban đầu đến phương án kỹ thuật đã chốt.

---

## 1. YÊU CẦU BÀI TOÁN

### 1.1. Bài toán cốt lõi — Chia tiền nhóm (Group Expense Splitting)

Sau mỗi buổi đi ăn / chơi bi-a / chơi thể thao, cần:

- Ghi nhận danh sách người tham gia và số tiền mỗi người đã **chi ra** (ứng trước)
- Tự động tính:
  - **Tổng chi tiêu** của buổi = tổng số tiền tất cả mọi người đã chi
  - **Mức chia đều** = Tổng chi tiêu / số người tham gia
  - **Số dư** mỗi người = Số đã chi − Mức chia đều
    - Dương → được nhận lại tiền
    - Âm → cần chuyển tiền cho người khác
  - **Bảng thanh toán (settlement)**: ai cần chuyển cho ai bao nhiêu, tối ưu số lượng giao dịch

**Ví dụ minh họa:**
> Buổi đi chơi 2 người. Người 1 chi 100k, người 2 chi 200k → Tổng 300k → Mỗi người phải chịu 150k → Người 1 đã chi thiếu 50k so với phần của mình → Người 1 chuyển 50k cho người 2.

### 1.2. Quản lý trạng thái thanh toán

- Hiển thị mã QR chuyển khoản tương ứng với số tiền cần chuyển của từng buổi
- Theo dõi được: người đó **đã chuyển tiền hay chưa** → đổi trạng thái tương ứng

### 1.3. Phân quyền người dùng

- **Admin (chủ dự án)**: xem tất cả + tạo buổi mới + **cập nhật trạng thái đã/chưa thanh toán**
- **Member (người tham gia)**: đăng nhập được vào hệ thống nhưng **chỉ xem**, không có quyền chỉnh sửa/update bất kỳ dữ liệu nào

### 1.4. Giao diện

- Hiện đại, đẹp mắt
- Có trang **Overview / Dashboard** tổng quan (tổng chi tiêu, số buổi, ai đang nợ ai...)

---

## 2. QUÁ TRÌNH RA QUYẾT ĐỊNH (Diễn giải các phương án đã cân nhắc)

| Vấn đề | Các lựa chọn đã xét | Kết luận & Lý do |
|---|---|---|
| Ngôn ngữ / Framework | Node.js riêng + ReactJS riêng, hay gộp | **Next.js** (App Router) — vì chỉ có 1 project, dùng API Routes làm backend luôn, giảm độ phức tạp, deploy 1 lần trên Vercel |
| Database | MongoDB Atlas | **Giữ nguyên MongoDB Atlas (Free M0 - 512MB)** — đã có sẵn cluster, dữ liệu nhóm bạn bè rất nhẹ nên free tier dư sức đáp ứng |
| Checking đã chuyển khoản chưa | (A) Xác nhận thủ công / (B) OCR ảnh biên lai / (C) Webhook ngân hàng (SePay/Casso/PayOS) / (D) Supabase | **Chốt: Xác nhận thủ công (A)** — chỉ admin mới có quyền đổi trạng thái. Supabase bị loại vì nó không có khả năng tự động biết giao dịch ngân hàng, thêm vào sẽ gây dư thừa 1 hệ database (Postgres) không cần thiết khi đã có Mongo |
| QR chuyển khoản | Upload ảnh QR thủ công vs sinh QR bằng code | **Sinh QR VietQR động bằng thư viện `qrcode`** trong code — tránh phải tích hợp thêm dịch vụ lưu trữ ảnh (S3/Cloudinary), giữ 100% miễn phí |
| Phân quyền xem | Public route (ai cũng xem được không cần login) vs Member login chỉ xem | **Chốt: Tất cả đều phải đăng nhập.** Bỏ khái niệm public route. Thêm role `member` chỉ có quyền xem |
| Deploy | Vercel vs Netlify | **Vercel** — vì Next.js là sản phẩm của chính Vercel, tương thích native 100%, không cần adapter/config thêm như Netlify |
| Chi phí | — | **Toàn bộ hệ thống triển khai miễn phí** (Vercel Hobby + MongoDB Atlas M0 + NextAuth self-hosted) |

---

## 3. PHƯƠNG ÁN KỸ THUẬT ĐÃ CHỐT

### 3.1. Kiến trúc tổng thể

```
Next.js (deploy trên Vercel)
  ├── Frontend: React (App Router)
  ├── Backend: API Routes (app/api/...)
  └── Auth: NextAuth.js (Credentials Provider, có role admin/member)
             │
             ▼
     MongoDB Atlas (Free Tier M0)
```

### 3.2. Stack công nghệ

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Framework Full-stack | **Next.js** (App Router) | Front + Back trong 1 project |
| Database | **MongoDB Atlas M0** | Free 512MB, đủ dùng |
| Authentication | **NextAuth.js** (Credentials Provider) | Tự quản lý user, không dùng SaaS auth ngoài |
| Sinh mã QR | Thư viện **`qrcode`** (npm) | Sinh QR VietQR động theo STK + số tiền + nội dung, không cần lưu ảnh tĩnh |
| Hosting | **Vercel** (Hobby - Free) | Tương thích native với Next.js |
| Cập nhật trạng thái thanh toán | **Thủ công**, chỉ admin thao tác qua giao diện | Không tích hợp webhook ngân hàng ở giai đoạn này |

### 3.3. Mô hình phân quyền (Role-Based Access)

| Role | Quyền | Số lượng |
|---|---|---|
| `admin` | Xem tất cả + tạo buổi mới + **cập nhật trạng thái đã/chưa thanh toán** | 1 tài khoản (chủ dự án) |
| `member` | Chỉ **xem** (danh sách buổi, tổng kết, ai nợ ai, trạng thái thanh toán) | Mỗi người trong nhóm 1 tài khoản, do admin tạo sẵn (không tự đăng ký) |

**Nguyên tắc bảo mật quan trọng — chặn 2 lớp:**
1. **UI/Middleware**: ẩn nút hành động, chặn redirect nếu không đúng role khi truy cập route admin
2. **API Route**: bắt buộc kiểm tra `session.user.role === 'admin'` ngay trong từng handler xử lý update — đây là lớp bảo vệ thật sự, vì UI chỉ ẩn nút chứ không ngăn được gọi API trực tiếp

### 3.4. Cấu trúc dữ liệu (định hướng collections MongoDB)

- **Users**: `{ name, username, passwordHash, role: "admin" | "member" }`
- **Events** (buổi đi chơi): `{ name, date, participants[], totalAmount, status }`
- **Transactions** (giao dịch cần chuyển giữa 2 người): `{ eventId, fromUser, toUser, amount, status: "paid" | "unpaid" }`

*(Schema chi tiết sẽ được thiết kế ở bước triển khai tiếp theo)*

### 3.5. Bảng phân quyền theo route

| Route | admin | member |
|---|---|---|
| `/login` | ✅ | ✅ |
| `/dashboard` (tổng quan) | ✅ | ✅ (chỉ xem) |
| `/event/[id]` (chi tiết buổi, QR, trạng thái) | ✅ | ✅ (chỉ xem) |
| `/admin/event/[id]/edit` (tạo buổi, đổi trạng thái) | ✅ | ❌ (redirect / 403) |
| API `PATCH /api/transactions/:id` | ✅ | ❌ 403 Forbidden |

---

## 4. CÁC BƯỚC TRIỂN KHAI TIẾP THEO (đề xuất thứ tự)

1. Thiết kế schema MongoDB chi tiết (Users, Events, Transactions)
2. Dựng cấu trúc thư mục dự án Next.js
3. Cấu hình NextAuth.js với Credentials Provider + role admin/member
4. Xây dựng thuật toán tính toán settlement (chia tiền tối ưu)
5. Xây dựng API Routes (CRUD Events/Transactions, PATCH status có check role)
6. Xây dựng giao diện Dashboard + trang chi tiết buổi + sinh QR động
7. Seed tài khoản admin + tài khoản member cho từng người trong nhóm
8. Deploy lên Vercel + kết nối MongoDB Atlas qua biến môi trường

---

*Tài liệu này là bản tổng hợp toàn bộ quá trình trao đổi, dùng làm tài liệu tham chiếu (spec) trước khi bắt đầu code.*