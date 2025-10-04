# Tech Context — Reel Control

Công nghệ
- JavaScript, HTML, CSS (không cần bundler ở phase đầu).
- Chrome Extension Manifest V3.

API & thư viện
- chrome.runtime, chrome.tabs, chrome.storage, chrome.downloads.
- Không phụ thuộc bên thứ ba ở giai đoạn đầu.

Thiết lập phát triển
- Trình duyệt Chrome bản mới (MV3).
- npm/npx dùng cho tiện ích dev (lint/format nếu cần), không bắt buộc.
- Tải extension bằng chế độ Developer: Load unpacked thư mục Reel_control.

Ràng buộc kỹ thuật
- Service worker có lifecycle ngắn; dùng messaging theo sự kiện.
- captureVisibleTab yêu cầu context background/popup.
- DOM khác nhau giữa Facebook/TikTok/YouTube; cần chiến lược detection riêng.

Mẫu sử dụng công cụ
- Lưu tốc độ với chrome.storage.sync và áp dụng lại khi video mới xuất hiện.
- Overlay sử dụng CSS đơn giản, gắn/chuyển theo video hiện tại.

Khả năng mở rộng
- Tách utils để tái sử dụng.
- Có thể thêm Options page để cấu hình mặc định về sau.