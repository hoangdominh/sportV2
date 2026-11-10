# Giao diện Sổ Sân

## Hướng thiết kế

“Sổ Sân” lấy cảm hứng từ sổ ghi điểm và bảng quỹ của một đội chơi phong trào. Khoản còn phải thu là thông tin cần thấy đầu tiên; nút hành động dùng động từ rõ ràng; giao diện co gọn cho cả desktop và điện thoại.

- **Màu:** đen `#171717`, trắng `#FFFFFF`, các sắc xám cho nền, đường viền và chữ phụ.
- **Chữ:** system sans hiện đại cho tiêu đề, số tiền, điều hướng và biểu mẫu; không gọi font bên thứ ba.
- **Hình nhận diện:** dùng lại ảnh “Trả tiền cho tao” cũ ở màn hình đăng nhập, chuyển sang grayscale để đồng bộ theme.
- **Tương tác:** vùng chạm rộng trên điện thoại, viền focus rõ, tôn trọng `prefers-reduced-motion`.

## Màn hình chính

- Thanh điều hướng có Tổng quan, Khoản chuyển, Thành viên; trên điện thoại tự xếp thành hai hàng và cho phép cuộn ngang.
- Dashboard mở bằng tổng khoản còn phải thu, tỷ lệ đã thanh toán và ba chỉ số phụ.
- Danh sách khoản chờ, lịch sử buổi và biểu đồ chi tiêu sáu tháng được xếp một cột trên điện thoại.
- Trạng thái thanh toán dùng nền/viền xám và nhãn rõ ràng; không phụ thuộc riêng vào màu để phân biệt.

## Đăng nhập

Ảnh cũ nằm trong panel riêng bên trái ở desktop. Màn hình hẹp xếp ảnh lên trên form, giữ ảnh trong khung và cho trang cuộn tự nhiên để form không bị cắt trên điện thoại. Nút đăng nhập báo riêng lúc kiểm tra tài khoản và lúc mở dashboard.
