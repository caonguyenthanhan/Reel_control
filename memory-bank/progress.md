# Progress — Reel Control

Đã hoàn thành
- Khởi tạo đầy đủ Memory Bank với 6 tệp cốt lõi.
- Tạo scaffold extension MV3: manifest.json, background.js, content.js, utils.js, icons/.
- Sửa auto-advance: bổ sung clickNextButton cho YouTube/Facebook, ưu tiên click trước keydown/scroll.
- Cải thiện điều hướng: phát ArrowDown tới document/window/activeElement, thêm fallback scroll và auto-play video kế tiếp.
- Giữ nguyên luồng trong content.js: lắng nghe ended/timeupdate, gọi rcUtils.scrollToNextVideo và hiển thị toast để báo hoạt động.

Đang thực hiện
- Kiểm thử Auto-Advance và Speed Controller trên YouTube Shorts/TikTok.

Còn lại
- Tinh chỉnh logic riêng cho Facebook Reels.
- Cải thiện overlay (ẩn/hiện, kích thước hiển thị).
- Xem xét Options page cho cấu hình tốc độ mặc định.

Vấn đề đã biết
- DOM khác biệt mạnh giữa nền tảng; detection cần robust.
- Lifecycle service worker MV3; cần tối ưu messaging và xử lý ngắn gọn.
- Đã xử lý lỗi “Receiving end does not exist” bằng cách chỉ gửi toggle tới tab có URL thuộc YouTube/Facebook/TikTok và bỏ qua lastError callback.

Mốc tiếp theo
- Chạy thử và tối ưu listener/DOM trên từng nền tảng, sau đó phát hành bản alpha.


# Progress

## Done
- Sửa lỗi auto-advance bị replay cùng video sau khi kết thúc: tạm dừng video hiện tại trước khi điều hướng, xác minh sau điều hướng bằng cách so sánh element/src và thời gian, nếu chưa chuyển thì kích hoạt fallback mạnh (click Next, ArrowDown/ArrowRight, scroll). 
- Giữ cơ chế ưu tiên click nút "Tiếp theo"/"Video tiếp theo" trên YouTube Shorts và Facebook Reels; sau đó gửi phím ArrowDown (và ArrowRight cho Facebook), cuối cùng mới scroll.
- Bảo toàn cooldown để tránh spam điều hướng.
- Thu hẹp selector Facebook cho nút Next: ưu tiên aria-label/alt (Next/Go to next reel/Tiếp theo), chỉ tìm trong dialog để tránh click menu.
- simulateKeyPress phát sự kiện tới dialog/activeElement trước body/window để tăng tỉ lệ bắt phím.
 - Tránh lướt hai video: với Facebook chỉ gửi ArrowDown nếu sau ArrowRight chưa chuyển video.
 - Cải thiện nhận diện video Facebook: tìm trong dialog và nới điều kiện readyState.
 - Thêm fallback ArrowDown sau ArrowRight cho Facebook.
- Tách 3 luồng logic độc lập theo nền tảng:
  * YouTube Shorts: clickNextButtonYouTube + ArrowDown fallback.
  * Facebook Reels: clickNextButtonFacebook + ArrowRight; nếu chưa chuyển thì retry click Next hoặc ArrowRight lần 2 (không dùng ArrowDown để tránh lùi về video trước).
  * TikTok: clickNextButtonTikTok + scroll fallback.
 - Giới hạn simulateKeyPress phát sự kiện tới một target duy nhất để tránh double-action trên Facebook.
 - TikTok: ưu tiên nút mũi tên xuống; nếu không đổi video sau keydown thì focus và cuộn container (`scroll-list`/`scroll-container`).
- Cập nhật scrollToNextVideo: tạm dừng video hiện tại, kiểm tra element/src; Facebook dùng ArrowRight trước, chỉ gửi ArrowDown nếu chưa đổi video; TikTok ưu tiên ArrowDown và cuộn fallback; auto-play video mới nếu đang pause.
 - Nâng độ tin cậy keydown: thêm dispatch `keyup` và đảm bảo focus đúng container theo nền tảng trước khi gửi phím (YouTube/FB/TikTok).

## Next
- Test thực tế trên YouTube Shorts và Facebook Reels để xác nhận: không replay lại cùng video, auto play video mới nếu đang pause.
- Tinh chỉnh phát hiện video hiện tại và overlay trạng thái khi chuyển video.

## Known Issues
- Facebook có nhiều biến thể viewer, vẫn cần mở rộng selector để tăng độ tin cậy.