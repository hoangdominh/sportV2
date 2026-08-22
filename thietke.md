# Thiết kế UI — Tab lọc trạng thái giao dịch

## 1. Mục tiêu

Bổ sung một cụm tab lọc nhanh theo trạng thái giao dịch vào template hiện tại (giao diện tối, các block theo từng người). Các trường select đang có (Ngày khoản, Người khoản, Trạng thái...) **giữ nguyên style hiện tại, không đổi**. Chỉ thêm 1 cụm tab — không phải select — để chuyển nhanh giữa 2 trạng thái, và đổi **mặc định khi mở trang là "Chưa chuyển"**.

## 2. Vị trí đặt

Đặt ngay dưới hàng select hiện có, phía trên danh sách các block theo tên người. Tab áp dụng ở **cấp toàn trang** — lọc xuyên suốt tất cả các block.

```
[ Ngày khoản ▾ ] [ Người khoản ▾ ] [ Trạng thái ▾ ]   ← select hiện có, giữ nguyên 100%
[ Chưa chuyển ] [ Đã chuyển ]                          ← tab mới thêm
--------------------------------------------------
[ Block: Chị tịch Minh ]
[ Block: Đại rách ]
...
```

## 3. Cấu trúc tab

Chỉ 2 tab, không có tab "Tất cả":

| Tab | Nội dung lọc | Mặc định |
|---|---|---|
| Chưa chuyển | Chỉ hiện card "Chưa chuyển" trong mỗi block | ✅ Active khi mở trang |
| Đã chuyển | Chỉ hiện card "Đã chuyển" trong mỗi block | Ẩn |

## 4. Hành vi khi lọc

- Khi chọn **Chưa chuyển**: trong mỗi block người dùng, chỉ card "Chưa chuyển" hiển thị, card "Đã chuyển" ẩn khỏi luồng hiển thị (reflow lại layout, không để lại khoảng trắng).
- Nếu một block không còn card nào khớp với tab đang chọn, ẩn luôn cả block đó.
- Chuyển tab xử lý phía client, không load lại trang.

## 5. Cập nhật trạng thái giao dịch

Khi người dùng đổi trạng thái 1 giao dịch từ "Chưa chuyển" sang "Đã chuyển" (thao tác đánh dấu đã nhận tiền):

- Card đó **cập nhật ngay tại chỗ** thành trạng thái "Đã chuyển".
- Nếu đang đứng ở tab **Chưa chuyển**, card vừa cập nhật sẽ **biến mất khỏi danh sách hiện tại** (vì không còn khớp điều kiện lọc), tự động chuyển sang chỉ còn hiển thị khi người dùng bấm sang tab "Đã chuyển".
- Không cần load lại trang hay chuyển tab thủ công để thấy thay đổi — chỉ card biến mất khỏi view hiện tại là đủ để xác nhận thao tác đã thành công.

## 6. Visual spec (đồng bộ theme tối hiện tại)

- Container tab: nền `#151b2e` (đậm hơn nền trang 1 cấp), bo góc 8px, padding ngang 4px, dạng segmented control.
- Tab chưa active: chữ xám nhạt `#8a93a6`, nền trong suốt, không viền.
- Tab active: nền `#1f2937` hoặc nhấn màu chủ đạo đang dùng cho trạng thái "Đã chuyển" (xanh lá đậm) nếu tab đó là *Đã chuyển*; nếu tab active là **Chưa chuyển** (mặc định), dùng màu cam/đỏ nhạt hiện có trên card "Chưa chuyển" trong bản gốc để nhất quán ý nghĩa màu.
- Số lượng trong ngoặc: cỡ chữ nhỏ hơn tên tab 1 bậc, màu nhạt hơn, không in đậm.
- Không dùng bo tròn kiểu pill toàn khối — theo đúng bo góc 8px các control khác trong giao diện gốc.
- Chiều cao tab: 36px, đủ vùng chạm trên mobile (tối thiểu 44px vùng chạm kể cả padding).

## 7. Vì sao mặc định là "Chưa chuyển"

Đây là phần **cần hành động**, còn "Đã chuyển" chỉ mang tính lưu trữ/tham khảo. Mở trang lên là thấy ngay việc cần làm, không phải tự tay lọc mỗi lần vào lại trang — giảm 1 thao tác lặp lại hàng ngày.

## 8. Ghi nhớ lựa chọn (tuỳ chọn nâng cao)

Nếu muốn tối ưu hơn nữa: lưu lựa chọn tab cuối cùng vào `localStorage`/session, nhưng **luôn reset về "Chưa chuyển" khi bắt đầu phiên làm việc mới trong ngày** (ví dụ theo ngày hiện tại), để tránh trường hợp người dùng quên đang ở tab "Đã chuyển" từ hôm trước.

## 9. Trạng thái rỗng

Nếu tab "Chưa chuyển" không còn giao dịch nào (đã thu đủ hết), hiện dòng trạng thái đơn giản giữa trang, không dùng minh hoạ phức tạp:

> Đã thu đủ tất cả — không còn khoản nào chưa chuyển.

Kèm 1 nút phụ nhỏ: "Xem đã chuyển" để chuyển sang tab Đã chuyển.
