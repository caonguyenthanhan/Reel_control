(() => {
  const platform = rcUtils.getPlatform();
  let isActive = true; // Kiểm soát Auto-Advance (Ctrl+Shift+Down)
  let isExtensionGloballyActive = true; // Kiểm soát toàn bộ extension (Ctrl+Shift+Up)
  let isPausedByUser = false;
  let currentRate = 1.0;
  let lastTimeUpdateCheck = 0;
  const TIME_UPDATE_INTERVAL = 200; 
  const RATE_STEP = 0.25; 

  // Tải cài đặt từ bộ nhớ
  chrome.storage.sync.get(["rc_active", "rc_rate", "rc_global"], (data) => {
    if (typeof data.rc_active === "boolean") isActive = data.rc_active;
    if (typeof data.rc_rate === "number") currentRate = data.rc_rate;
    if (typeof data.rc_global === "boolean") isExtensionGloballyActive = data.rc_global;
    
    // Áp dụng cài đặt và hiển thị trạng thái ban đầu
    rcUtils.setPlaybackRateAll(currentRate);
    rcUtils.createOrUpdateSpeedOverlay(currentRate);
    rcUtils.createOrUpdateStatusOverlay(isActive, isExtensionGloballyActive);
    
    // Nếu extension bị tắt toàn bộ, reset tốc độ ngay lập tức
    if (!isExtensionGloballyActive) {
      rcUtils.setPlaybackRateAll(1.0);
    }
  });

  function maybeAdvance() {
    // Chỉ chạy nếu cả Auto-Advance và Extension tổng thể đều BẬT
    if (!isActive || !isExtensionGloballyActive || isPausedByUser) return;
    rcUtils.scrollToNextVideo(platform);
    rcUtils.toast("Auto Advance");
  }

  function bindListeners() {
    // Nếu extension bị tắt toàn bộ, không gắn listener
    if (!isExtensionGloballyActive) {
        rcUtils.setPlaybackRateAll(1.0);
        return;
    }

    const vids = Array.from(document.querySelectorAll("video"));
    vids.forEach(v => {
      // Đảm bảo tốc độ được áp dụng cho video mới ngay khi phát hiện
      if (v.playbackRate !== currentRate) {
        v.playbackRate = currentRate;
      }
      
      if (!v.__rcBoundTimeUpdate) { 
        v.__rcBoundTimeUpdate = true;
        
        v.addEventListener("timeupdate", function() {
          const vCurrent = rcUtils.currentVideo();
          // Kiểm tra điều kiện để kích hoạt advance
          if (!vCurrent || vCurrent !== this || !isActive || !isExtensionGloballyActive || isPausedByUser) return;

          const now = Date.now();
          if (now - lastTimeUpdateCheck < TIME_UPDATE_INTERVAL) return;
          lastTimeUpdateCheck = now;
          
          const d = this.duration;
          if (Number.isFinite(d) && d > 1.0) { 
            // Kích hoạt điều hướng khi còn 0.5 giây cuối cùng
            if (this.currentTime >= d - 0.5) {
              maybeAdvance();
            }
          }
        });

        v.addEventListener("play", function() {
          if (this.playbackRate !== currentRate) {
            this.playbackRate = currentRate;
          }
        });
      }
    });
  }

  // MutationObserver để phát hiện DOM thay đổi
  let moTimer = null;
  const mo = new MutationObserver(() => { 
    if (moTimer) clearTimeout(moTimer);
    moTimer = setTimeout(() => {
        bindListeners();
    }, 150); 
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  bindListeners(); 

  // Xử lý Phím tắt
  document.addEventListener("keydown", (e) => {
    // Bỏ qua nếu người dùng đang nhập liệu
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    
    // Spacebar: Pause/Play 
    if (isExtensionGloballyActive && (e.key === " " || e.code === "Space")) {
      e.preventDefault(); 
      const v = rcUtils.currentVideo();
      if (v) {
        if (v.paused) { 
          v.play(); 
          isPausedByUser = false; 
          rcUtils.toast("Playing"); 
        } else { 
          v.pause(); 
          isPausedByUser = true; 
          rcUtils.toast("Paused (RC Stopped)"); 
        }
        
        // Ngăn video lấy focus để tránh lỗi ARIA
        if (v === document.activeElement) {
            v.blur(); 
        }
      }
    } 
    // Điều khiển tốc độ (A: Giảm -0.25, D: Tăng +0.25, R: Reset 1.0)
    else if (isExtensionGloballyActive && (e.key.toLowerCase() === "a" || e.key.toLowerCase() === "d" || e.key.toLowerCase() === "r")) {
      e.preventDefault(); 
      
      if (e.key.toLowerCase() === "d") { 
        currentRate = Math.min(5, (currentRate + RATE_STEP));
      } else if (e.key.toLowerCase() === "a") { 
        currentRate = Math.max(0.1, (currentRate - RATE_STEP));
      } else if (e.key.toLowerCase() === "r") {
        currentRate = 1.0;
      }
      
      chrome.storage.sync.set({ rc_rate: currentRate });
      rcUtils.setPlaybackRateAll(currentRate);
      rcUtils.createOrUpdateSpeedOverlay(currentRate);
      rcUtils.toast("Speed: " + currentRate.toFixed(2) + "x"); 
    } 
    // Screenshot (Shift+S)
    else if (isExtensionGloballyActive && e.shiftKey && e.key.toLowerCase() === "s") {
      e.preventDefault(); 
      
      chrome.runtime.sendMessage({ type: "screenshot" }, (response) => {
        if (response && response.ok) {
           rcUtils.toast("Screenshot captured! (Full Tab)");
        } else {
           rcUtils.toast("Screenshot error: " + (response ? response.message : "API failed."));
        }
      });
    }
  });

  // Nhận message từ background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "toggle_auto_advance") { // Ctrl+Shift+Down (Bật/Tắt Auto-Advance)
      isActive = !isActive;
      chrome.storage.sync.set({ rc_active: isActive });
      rcUtils.createOrUpdateStatusOverlay(isActive, isExtensionGloballyActive);
      rcUtils.toast(isActive ? "Auto Advance: ON" : "Auto Advance: OFF");
    } else if (msg && msg.type === "toggle_extension_all") { // Ctrl+Shift+Up (Bật/Tắt Toàn bộ)
      isExtensionGloballyActive = !isExtensionGloballyActive;
      chrome.storage.sync.set({ rc_global: isExtensionGloballyActive });
      
      rcUtils.createOrUpdateStatusOverlay(isActive, isExtensionGloballyActive);
      rcUtils.toast(isExtensionGloballyActive ? "Reel Control: ON" : "Reel Control: OFF (All Features Disabled)");
      
      if (!isExtensionGloballyActive) {
        // Nếu tắt, reset tốc độ về 1.0x
        rcUtils.setPlaybackRateAll(1.0);
        rcUtils.createOrUpdateSpeedOverlay(1.0);
      } else {
        // Nếu bật lại, áp dụng tốc độ đã lưu
        rcUtils.setPlaybackRateAll(currentRate);
        rcUtils.createOrUpdateSpeedOverlay(currentRate);
        bindListeners(); 
      }
    }
  });
})();
