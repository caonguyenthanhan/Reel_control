# Reel Control

Giới thiệu

* Reel Control là extension MV3 giúp tối ưu trải nghiệm xem video ngắn (Facebook Reels, YouTube Shorts, TikTok): tự động chuyển video, điều khiển tốc độ, phím tắt tiện lợi, chụp ảnh nhanh.

Hiện đã có (đã triển khai)

* Cấu trúc MV3 đầy đủ: manifest.json, background.js (service worker), content.js, utils.js, icons SVG.
* Phát hiện nền tảng theo hostname (facebook/youtube/tiktok).
* Auto-Advance cơ bản: lắng nghe sự kiện kết thúc video và cuộn/giả lập điều hướng sang video tiếp theo (ưu tiên cuộn; Facebook thêm ArrowDown).
* Điều khiển tốc độ: phím D/S/R (tăng/giảm/reset), áp dụng playbackRate, overlay hiển thị tốc độ, lưu chrome.storage.sync.
* Pause/Play: Spacebar để dừng/phát, có cờ trạng thái để ngăn auto-advance khi người dùng tạm dừng.
* Toggle extension: Ctrl+Shift+Down (commands -> background -> message -> content) để bật/tắt auto-advance.
* Screenshot: Shift+S gửi yêu cầu về background, chụp ảnh vùng nhìn thấy và tải xuống.

Chưa làm được / Chưa hoàn thiện

* Tinh chỉnh riêng cho DOM Facebook Reels (nếu cần click nút "next" hoặc chọn đúng phần tử video trong layout phức tạp).
* Debounce/tối ưu MutationObserver để giảm chi phí khi DOM thay đổi liên tục.
* Ẩn/hiện overlay linh hoạt (ẩn khi không có video, tự giảm kích thước hoặc mờ dần).
* Options page để cấu hình tốc độ mặc định, bật/tắt overlay, tùy biến phím tắt.
* Kiểm thử đa trình duyệt (ưu tiên Chrome; Edge thường tương thích MV3 nhưng cần kiểm chứng).
* Quốc tế hóa (i18n) và hỗ trợ nhiều ngôn ngữ hiển thị.

Mở rộng (tính năng nâng cao)

* Options UI: chọn tốc độ mặc định, bật/tắt auto-advance theo nền tảng, tùy biến hotkeys, quản lý overlay.
* Smart Auto-Advance: phát hiện "gần kết thúc" để chuyển mượt, heuristic theo thời lượng xem/khung hình hiển thị.
* Per-platform cấu hình: tốc độ mặc định khác nhau cho Facebook/YouTube/TikTok, hành vi cuộn/keydown riêng.
* Nhật ký phiên cục bộ (không gửi ra ngoài): số video đã xem, số lần chụp ảnh, giúp tối ưu trải nghiệm.
* Bookmark/ghi chú khung hình: lưu thời điểm/video để quay lại; mở ảnh chụp trong editor bên ngoài.
* Hỗ trợ thêm nền tảng: Instagram Reels, Twitter/X video, và các site khác có thẻ video.
* Tiền tải video tiếp theo (nếu nền tảng hỗ trợ) để chuyển không giật.
* Cải thiện khả năng truy cập: điều hướng bằng bàn phím, focus management, mô tả overlay thân thiện.

Phím tắt

* Ctrl+Shift+Down: Bật/Tắt auto-advance.
* D: Tăng tốc độ +0.1.
* a: Giảm tốc độ -0.1.
* R: Reset tốc độ về 1.0x.
* Spacebar: Tạm dừng/Tiếp tục phát.
* Shift+S: Chụp ảnh màn hình vùng nhìn thấy.

Quyền (permissions)

* activeTab, tabs: gửi/nhận message và thao tác tab hiện tại.
* storage: lưu tốc độ và một số cài đặt.
* downloads: tải ảnh chụp màn hình.

Cài đặt (Developer Mode)

1. Mở trang quản lý extensions (chrome://extensions hoặc edge://extensions).
2. Bật Developer mode (Chế độ nhà phát triển).
3. Chọn "Load unpacked" và trỏ tới thư mục dự án: d:\\desktop\\extensions\\Reel\_control.
4. Mở YouTube Shorts/TikTok/Facebook Reels để thử các phím tắt và tính năng.

Kiến trúc tóm tắt

* Background (service worker): xử lý commands (toggle), chụp ảnh màn hình, gửi message tới content.
* Content script: điều khiển DOM video, auto-advance, phím tắt tốc độ/pause/screenshot, lưu trạng thái.
* Utils: phát hiện nền tảng, tìm video hiện tại, hành vi cuộn/điều hướng, overlay tốc độ.
* Manifest: cấu hình MV3, permissions, matches, commands, icons.
