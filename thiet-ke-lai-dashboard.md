# Thiết kế UI — Tối ưu lại Dashboard

## 1. Mục tiêu

Giữ nguyên toàn bộ template hiện tại: theme tối, các thành phần đã có (khối tổng quan, donut phân bố, danh sách giao dịch, sidebar lịch sử buổi, signals). Không xây lại từ đầu — chỉ **tổ chức lại vị trí và gộp các số liệu đang bị lặp**, đồng thời hoàn thiện phần biểu đồ xu hướng đang để trống.

Vấn đề của bản hiện tại: cùng 1 con số "Cần thu 1.330.000đ" xuất hiện ở 3 nơi (khối tổng quan, card "Cần thanh toán", legend donut), và "Tỷ lệ xác nhận 60%" lặp lại đúng % đã có trên donut. Mỗi dòng giao dịch trong "Cần thanh toán" có câu mô tả giống hệt nhau lặp lại 6 lần, không mang thêm thông tin. Việc lặp này khiến trang dài hơn cần thiết và người dùng phải xử lý cùng 1 dữ liệu nhiều lần khi quét mắt.

## 2. Khối tổng quan (hero)

Giữ nguyên vị trí trên cùng, giữ nguyên donut phân bố. Thay đổi:

- Bỏ đoạn mô tả dài "Tổng tham khảo từ các giao dịch chưa chuyển..." — rút gọn thành 1 dòng phụ ngắn dưới số chính, dạng: `6 giao dịch còn lại · đã xác nhận 1.898.750 đ`. Dòng này thay thế luôn phần legend chữ bên cạnh donut (Đã chuyển / Cần thu), vì donut đã tự thể hiện tỷ lệ bằng màu.
- Số `1.330.000 đ` chỉ xuất hiện **duy nhất tại đây**, cỡ chữ lớn nhất trang (32px), không lặp lại ở bất kỳ card nào phía dưới.
- Donut giữ nguyên 2 màu đã dùng (xanh lá = đã chuyển, cam = cần thu), thêm số % vào giữa vòng tròn thay vì để trống giữa.
- Giữ 2 nút hành động "Tạo buổi mới" / "Xem tất cả giao dịch" ở vị trí cũ.

## 3. Hàng thẻ chỉ số (metric cards)

Hiện có 4 thẻ, trong đó "Cần thanh toán" trùng số với hero, "Tỷ lệ xác nhận" trùng % với donut. Rút còn 3 thẻ, mỗi thẻ mang thông tin không nơi nào khác có:

| Thẻ giữ lại | Nội dung |
|---|---|
| Tổng chi | 3.945.000 đ |
| Buổi còn mở | 2 |
| Cần xử lý | 6 khoản (đổi tên từ ý "Cần thanh toán", nhưng hiển thị **số lượng khoản**, không lặp lại số tiền) |

Bỏ hẳn thẻ "Tỷ lệ xác nhận" — đã có trên donut ở khối tổng quan.

## 4. Danh sách "Cần thanh toán"

Giữ nguyên vị trí cột trái, giữ nguyên dữ liệu từng dòng (tên, buổi, ngày, số tiền). Thay đổi:

- **Bỏ dòng mô tả lặp** "Thanh toán và xác nhận riêng tại trang giao dịch hoặc chi tiết buổi." khỏi từng dòng — câu này giống hệt nhau ở cả 6 giao dịch nên không mang thông tin phân biệt. Nếu cần giữ hướng dẫn này, đặt **1 lần duy nhất** thành dòng ghi chú nhỏ ngay trên đầu danh sách, không lặp trong từng dòng.
- Thêm avatar/hình tròn chữ cái đầu tên trước mỗi dòng, để quét theo người nhanh hơn thay vì chỉ đọc chữ.
- Gộp buổi + ngày thành 1 dòng phụ nhỏ dưới tên (`Tiền nhậu · 19/8`), số tiền canh phải như bản gốc.
- Mỗi dòng cách nhau bằng đường kẻ mảnh (0.5px), không dùng khung card riêng cho từng dòng như hiện tại — giảm số lượng khung lồng nhau trên trang.

## 5. Sidebar phải

- Gộp 2 heading đang trùng ý "Buổi gần đây" và "Lịch sử buổi" thành **1 heading duy nhất**: "Lịch sử buổi".
- Giữ nguyên badge trạng thái "Còn nợ" / "Đã xong" theo đúng 2 màu cam/xanh lá đã dùng trong toàn bộ hệ thống (đồng bộ với tab lọc "Chưa chuyển / Đã chuyển" đã thiết kế trước đó).
- Khối "Signals" giữ nguyên nội dung, không đổi.
- Khối "Xu hướng — Chi tiêu theo tháng": hiện đang trống (chỉ có nhãn ngày). Thêm biểu đồ cột nhỏ thể hiện chi tiêu theo từng tháng gần nhất, trục dọc ẩn (không cần số chính xác trên trục, chỉ cần thấy xu hướng tăng/giảm), trục ngang hiện tên tháng.

## 6. Tách vai trò màu sắc

Bản hiện tại dùng **cùng 1 màu xanh lá** cho cả:
- Thương hiệu / hành động chính (tab "Dashboard" active, nút "Tạo buổi mới")
- Trạng thái "đã xong" / "đã chuyển"

Đề xuất: giữ xanh lá cho trạng thái thành công (đã xong, đã chuyển) vì đã dùng nhất quán ở nhiều nơi trong hệ thống. Đổi màu nhấn cho thương hiệu/nút hành động chính sang 1 màu riêng (ví dụ xanh dương hoặc teal đậm hơn) để khi nhìn nhanh, người dùng phân biệt được đâu là "trạng thái dữ liệu" và đâu là "nút bấm/điều hướng" — tránh trường hợp thấy màu xanh lá ở nút và ngỡ là tín hiệu trạng thái.

## 7. Bố cục tổng thể sau khi gộp

```
[ Khối tổng quan: số Cần thu + donut + 1 dòng phụ ]
[ 3 thẻ chỉ số: Tổng chi | Buổi còn mở | Cần xử lý ]
--------------------------------------------------
[ Cần thanh toán (cột trái, rộng hơn) ]   [ Lịch sử buổi (sidebar) ]
[ danh sách dòng gọn, có avatar ]         [ Signals ]
                                            [ Xu hướng: chart cột theo tháng ]
```

Cấu trúc 2 cột giữ nguyên như bản gốc — chỉ thay đổi bên trong từng khối, không đổi khung layout tổng thể.
