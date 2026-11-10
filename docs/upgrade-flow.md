# Chạy local và lần theo độ trễ đăng nhập

## Luồng log bạn vừa gửi

Các dòng có `POST /api/auth/signout` và `GET /login` là luồng đăng xuất rồi quay về trang login. Những dòng `GET /transactions` mất 67/126 ms không cho biết tốc độ đăng nhập. `GET /api/qr` mất khoảng 1 giây là tạo QR, độc lập với login. Chưa có request credentials hoặc dashboard trong đoạn log này.

## Bắt log login đúng

1. Mở trang `/login`, clear log ở cửa sổ terminal và DevTools Console.
2. Nhập tài khoản rồi bấm **Đăng nhập** một lần.
3. Xem browser Console và terminal của `npm run dev`:

| Log | Đoạn thời gian | Nếu cao |
|---|---|---|
| `auth.client.timing.authRequestMs` | Gửi form đến khi NextAuth trả kết quả | Đối chiếu các mốc auth server |
| `auth.credentials.timing` | Kết nối MongoDB, tìm user, bcrypt | `dbReadyMs` cao: kiểm tra Atlas/network; `userLookupMs` cao: kiểm tra index; `passwordCheckMs` cao: kiểm tra bcrypt/CPU |
| `dashboard.data.timing` | Kết nối DB và bốn truy vấn dashboard | `queriesMs` cao: đo query riêng rồi mới tối ưu |
| `dashboard.client.timing.navigationMs` | Xác thực xong đến khi dashboard render | Nếu server nhanh nhưng số này cao, xem chuyển trang/hydration phía client |

## Quy trình một nhánh

Chỉ dùng `main`, không tạo nhánh staging. Chạy thử bằng `npm run dev`, kiểm tra admin/member, dashboard và điện thoại; khi ổn thì bạn tự commit/push theo quy trình hiện tại. Chưa có log từ một lần đăng nhập thành công nên chưa thể kết luận chính xác nguyên nhân pause.
