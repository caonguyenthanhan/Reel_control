# Active Context — Reel Control

## Trọng tâm hiện tại
- Đảm bảo auto-advance hoạt động ổn định trên YouTube Shorts và Facebook Reels, tránh replay lại cùng video sau khi kết thúc.

## Thay đổi gần đây
- Ưu tiên click nút điều hướng gốc (YouTube/Facebook) trước khi gửi phím.
- Trước khi điều hướng, tạm dừng video hiện tại để giảm nguy cơ loop/replay.
- Sau điều hướng, xác minh bằng cách so sánh element/src và thời gian phát; nếu vẫn là video cũ hoặc không tìm thấy video mới, kích hoạt fallback mạnh (ArrowDown/ArrowRight/scroll).
- Tự động phát video mới nếu đang pause.

## Bước tiếp theo
- Kiểm thử thực tế trên YouTube Shorts và Facebook Reels, tinh chỉnh selector và độ trễ.
- Nâng cao nhận diện video hiện tại để giảm false positive/negative.

## Ghi chú
- Cooldown điều hướng giữ ở 1200 ms để tránh spam.
- Facebook có nhiều biến thể UI, 
  cần mở rộng selector cho nút "Tiếp theo"/"Video tiếp theo" và container.

Trạng thái hiện tại
- Đã khởi tạo scaffold extension MV3: manifest.json, background.js, content.js, utils.js, icons/.
- Đã triển khai nền tảng cơ bản: Auto-Advance (lắng nghe ended và cuộn/keydown), Speed Controller (phím D/S/R), overlay hiển thị tốc độ, lưu chrome.storage.sync, Pause/Play (Spacebar), Screenshot (Shift+S) qua background, Toggle (Ctrl+Shift+Down).

Quyết định
- Sử dụng MV3 service worker cho background.
- Không dùng bundler ở giai đoạn đầu; mã JS thuần, tối giản comment.
- Icon dùng SVG theo quy định.

Bước tiếp theo
1) Kiểm thử thực tế trên YouTube Shorts và Facebook Reels sau khi bổ sung clickNextButton (ưu tiên click nút Next nếu có), sau đó keydown ArrowDown, và fallback scroll.
2) Tinh chỉnh phát hiện video hiện tại và auto-play sau điều hướng với timeout.
3) Cải thiện overlay (ẩn/hiện linh hoạt khi không có video, giảm chiếm dụng màn hình).
4) Xem xét bổ sung Options page (tùy chọn tốc độ mặc định) nếu cần.

Các lưu ý
- Quản lý isPausedByUser để ngăn auto-advance khi người dùng tạm dừng.
- MutationObserver có debounce để tránh tốn tài nguyên nếu cần.

Câu hỏi mở
- Có cần hỗ trợ thêm phím tắt tùy biến không? (Options page)
- Có cần hỗ trợ Firefox (ngoài phạm vi 1.0)?