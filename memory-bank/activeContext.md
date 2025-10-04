# Active Context — Reel Control

Trạng thái hiện tại
- Đã khởi tạo scaffold extension MV3: manifest.json, background.js, content.js, utils.js, icons/.
- Đã triển khai nền tảng cơ bản: Auto-Advance (lắng nghe ended và cuộn/keydown), Speed Controller (phím D/S/R), overlay hiển thị tốc độ, lưu chrome.storage.sync, Pause/Play (Spacebar), Screenshot (Shift+S) qua background, Toggle (Ctrl+Shift+Down).

Quyết định
- Sử dụng MV3 service worker cho background.
- Không dùng bundler ở giai đoạn đầu; mã JS thuần, tối giản comment.
- Icon dùng SVG theo quy định.

Bước tiếp theo
1) Kiểm thử thực tế trên YouTube Shorts và TikTok, tinh chỉnh tìm video và auto-advance.
2) Bổ sung logic cụ thể cho Facebook Reels (ưu tiên keydown ArrowDown, fallback scroll).
3) Cải thiện overlay (ẩn/hiện linh hoạt khi không có video, giảm chiếm dụng màn hình).
4) Xem xét bổ sung Options page (tùy chọn tốc độ mặc định) nếu cần.

Các lưu ý
- Quản lý isPausedByUser để ngăn auto-advance khi người dùng tạm dừng.
- MutationObserver có debounce để tránh tốn tài nguyên nếu cần.

Câu hỏi mở
- Có cần hỗ trợ thêm phím tắt tùy biến không? (Options page)
- Có cần hỗ trợ Firefox (ngoài phạm vi 1.0)?