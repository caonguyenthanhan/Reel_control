# Product Context — Reel Control

Lý do tồn tại
- Video ngắn yêu cầu thao tác liên tục (vuốt, dừng, điều chỉnh tốc độ). Reel Control giảm thao tác lặp lại, tối ưu nhịp xem.

Vấn đề cần giải quyết
- Kết thúc video không tự cuộn nhất quán.
- Tốc độ phát không phù hợp nội dung.
- Thiếu phím tắt thống nhất giữa các nền tảng.
- Chụp ảnh khó khăn khi cần giữ khoảnh khắc.

Cách hoạt động
- Content script phát hiện nền tảng qua hostname và chọn chiến lược DOM phù hợp.
- Lắng nghe sự kiện ended trên <video> và kích hoạt cuộn/vuốt/phím mũi tên.
- Phím tắt D/S/R điều khiển playbackRate; overlay hiển thị.
- Ctrl+Shift+Down bật/tắt auto-advance qua commands -> background -> message -> content.
- Spacebar pause/play, quản lý isPausedByUser.
- Shift+S gửi yêu cầu screenshot về background để chụp và tải.

Mục tiêu UX
- Nhẹ, nhanh, trực quan, không che nội dung.
- Phím tắt nhất quán; overlay tối giản, dễ đọc.

Đối tượng người dùng
- Người xem video ngắn thường xuyên, creator cần trích ảnh khung.

Không phạm vi (Non-goals)
- Không can thiệp thuật toán đề xuất nội dung.
- Không lưu trữ dữ liệu cá nhân ngoài cài đặt tốc độ.

Chỉ số trải nghiệm
- Số lần thao tác giảm.
- Mức độ mượt khi chuyển video.
- Độ chính xác screenshot và tốc độ tải.