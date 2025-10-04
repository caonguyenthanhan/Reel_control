# Reel Control — Project Brief

Mục tiêu
- Nâng cao trải nghiệm xem video ngắn (Facebook Reels, YouTube Shorts, TikTok) bằng các tính năng: Auto-Advance, điều khiển tốc độ, phím tắt bật/tắt, pause/play, chụp ảnh màn hình.

Phạm vi
- Extension Chrome Manifest V3: background service worker, content scripts cho 3 nền tảng, giao tiếp message, lưu trữ cài đặt.
- Không bao gồm backend server; hoạt động thuần trình duyệt.

Tính năng cốt lõi
1) Auto-Advance: tự cuộn/vuốt/chuyển video khi video kết thúc.
2) Speed Controller: phím tắt tăng/giảm/reset tốc độ, overlay hiển thị tốc độ, lưu tốc độ vào chrome.storage.sync.
3) Toggle Extension: Ctrl+Shift+Down để bật/tắt tự động vuốt (commands + message giữa background và content).
4) Pause/Play: Spacebar để dừng/phát, có cờ isPausedByUser ngăn auto-advance.
5) Screenshot: Shift+S gửi đến background gọi chrome.tabs.captureVisibleTab và tải ảnh bằng chrome.downloads.download.

Đầu ra/Deli
- Cấu trúc thư mục: manifest.json, background.js, content.js, utils.js, icons/.
- Bộ nhớ dự án (memory-bank) duy trì trạng thái và quyết định.
- Phiên bản 1.0 hoạt động trên Chrome (MV3).

Rủi ro & hạn chế
- Khác biệt DOM giữa các nền tảng, cần xử lý riêng.
- Giới hạn lifecycle của service worker MV3.
- Quyền tabs/activeTab/downloads cần cấu hình đúng và tuân theo chính sách.

Tiêu chí thành công
- Auto-advance ổn định trên 3 nền tảng.
- Điều khiển tốc độ mượt, overlay rõ ràng.
- Phím tắt hoạt động thống nhất.
- Không gây crash/lag đáng kể.

Kế hoạch phát hành
- Alpha: triển khai tối thiểu Auto-Advance + Speed Controller.
- Beta: bổ sung toggle, pause/play, screenshot.
- 1.0: tối ưu, kiểm thử, phát hành nội bộ.