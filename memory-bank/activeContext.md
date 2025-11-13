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

## Cập nhật
- Bổ sung selector Facebook dựa trên SVG class (x14rh7hd x1lliihq x1tzjh5l x1k90msu x2h7rmj x1qfuztq) để click nút Next đáng tin cậy hơn.
 - Đã chạy server cục bộ và mở Facebook.html để quan sát UI; các lỗi tải chrome-extension ngoại lai không ảnh hưởng tới kiểm thử giao diện.
 - Thu hẹp selector Facebook: chỉ dùng aria-label/alt "Next"/"Go to next reel"/"Tiếp theo" và giới hạn tìm trong dialog để tránh click menu.
- Sự kiện phím được phát tới dialog/activeElement trước khi body/window để tăng hiệu quả điều hướng.
- Đã khởi chạy lại server cục bộ và mở Facebook.html để xác nhận selector mới không click vào menu; lỗi chrome-extension trong preview là mong đợi và không ảnh hưởng.
- Điều chỉnh điều hướng Facebook: gửi ArrowRight trước; chỉ gửi ArrowDown nếu kiểm tra thấy chưa chuyển video (so sánh element/src) để tránh lướt 2 video một lượt.
- Tách 3 luồng logic độc lập:
  * YouTube Shorts: clickNextButtonYouTube + ArrowDown fallback.
  * Facebook Reels: clickNextButtonFacebook (tìm trong dialog) + ArrowRight; nếu chưa đổi video thì retry click Next hoặc ArrowRight lần 2 (bỏ ArrowDown để tránh nhảy lùi).
  * TikTok: clickNextButtonTikTok + scroll fallback.
 - Giới hạn phát keydown tới một target: ưu tiên `div[role="dialog"]`, nếu không có thì `document.activeElement`, cuối cùng là `document`. Tránh phát đồng thời tới nhiều nơi gây double-action trên Facebook.
 - TikTok: ưu tiên click nút mũi tên xuống (`button[data-e2e="arrow-down"]`); nếu không có nút, gửi `ArrowDown`, sau đó focus container cuộn (`div[data-e2e="scroll-list"|"scroll-container"]`) và scroll container làm fallback.
- Nâng cấp nhận diện video: tìm trong dialog và nới điều kiện readyState để không bỏ lỡ video Facebook.
- Bổ sung fallback phím ArrowDown sau ArrowRight cho Facebook.
- Cập nhật chuỗi điều hướng trong scrollToNextVideo: tạm dừng video hiện tại, so sánh element/src sau hành động; Facebook dùng ArrowRight trước, chỉ ArrowDown nếu chưa đổi video; TikTok ưu tiên ArrowDown và cuộn fallback; auto-play video mới sau một khoảng ngắn.
 - Cải thiện bắt phím: thêm `keyup` sau `keydown` với độ trễ nhỏ và bổ sung thuộc tính sự kiện (`code`, `which`, `view`, `composed`) để tăng khả năng listener nắm bắt; trước khi gửi phím, focus đúng container theo nền tảng (Facebook: dialog/video, TikTok: scroll container/video, YouTube: player/video).

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