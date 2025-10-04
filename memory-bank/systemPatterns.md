# System Patterns — Reel Control

Kiến trúc MV3
- Background: service_worker background.js xử lý commands, screenshot, chuyển trạng thái extension, messaging.
- Content: content.js chạy trong trang, điều khiển DOM, auto-advance, tốc độ, phím tắt.
- Utils: utils.js cung cấp phát hiện nền tảng, message helpers, quản lý overlay.
- Manifest: cấu hình permissions, matches, commands.

Luồng chính
1) Auto-Advance
- Phát hiện <video> hiện tại và sự kiện ended.
- TikTok/Shorts: cuộn xuống (window.scrollBy hoặc element.scrollIntoView).
- Facebook Reels: keydown ArrowDown hoặc click nút next nếu có.
- Tôn trọng isPausedByUser.

2) Speed Controller
- Phím: D(+0.1), S(-0.1), R(=1.0).
- Áp dụng document.querySelector('video').playbackRate.
- Overlay DOM hiển thị tốc độ; lưu vào chrome.storage.sync.

3) Toggle Extension
- Manifest commands: Ctrl+Shift+Down.
- Background nhận command, gửi message toggle tới tab đang active.
- Content bật/tắt tính năng auto-advance theo isExtensionActive.

4) Pause/Play
- Spacebar: video.pause()/video.play().
- Cập nhật cờ isPausedByUser.

5) Screenshot
- Content phát hiện Shift+S, gửi message -> Background.
- Background: chrome.tabs.captureVisibleTab() -> chrome.downloads.download().

Messaging & State
- chrome.runtime.onMessage và chrome.tabs.sendMessage.
- Trạng thái: isExtensionActive, isPausedByUser, currentSpeed.

Lưu trữ
- chrome.storage.sync: currentSpeed, user prefs.

Quyền (permissions)
- activeTab, storage, downloads.

Ràng buộc & Best practices
- Tối ưu listener; debounce DOM search.
- Không can thiệp DOM ngoài overlay tối giản.
- Xử lý khác biệt hostname/DOM cho từng nền tảng.