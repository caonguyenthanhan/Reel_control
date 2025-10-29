const rcUtils = (() => {
  let overlayEl = null;
  let statusEl = null;
  let toastEl = null;
  let hideTimer = null;
  let lastNavAt = 0;
  const COOLDOWN = 1200; 

  function getPlatform() {
    const h = location.hostname;
    if (h.includes("youtube")) return "youtube";
    if (h.includes("tiktok")) return "tiktok";
    if (h.includes("facebook")) return "facebook";
    return "unknown";
  }

  function isInViewport(el) {
    if (!el || el.offsetParent === null) return false;
    const r = el.getBoundingClientRect();
    const vpHeight = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vpHeight && r.bottom > 0 && r.height > 100 && r.width > 100; 
  }

  function visibleVideos() {
    return Array.from(document.querySelectorAll("video")).filter(v => 
      isInViewport(v) && !v.ended && v.readyState >= 3 
    );
  }
  
  function currentVideo() {
    const vids = visibleVideos();
    if (vids.length === 0) return null;
    
    let bestVideo = null;
    let maxScore = 0;

    vids.forEach(v => {
      const r = v.getBoundingClientRect();
      const currentArea = Math.min(r.height, window.innerHeight) * Math.min(r.width, window.innerWidth);
      
      let score = currentArea;
      if (!v.paused) { 
        score *= 1.5;
      }
      
      const centerY = (r.top + r.bottom) / 2;
      const viewportCenterY = window.innerHeight / 2;
      score /= (1 + Math.abs(centerY - viewportCenterY) / window.innerHeight); 

      if (score > maxScore) {
        maxScore = score;
        bestVideo = v;
      }
    });

    return bestVideo;
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const vpHeight = window.innerHeight || document.documentElement.clientHeight;
    const vpWidth = window.innerWidth || document.documentElement.clientWidth;
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < vpHeight && r.left < vpWidth;
  }

  function tryClick(el) {
    try { 
      el.click(); 
      return true; 
    } catch (e) { 
      console.warn("ReelControl: Click failed", el, e);
      return false; 
    }
  }

  function simulateKeyPress(keyCode, key, shiftKey = false, ctrlKey = false, altKey = false, metaKey = false) {
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      keyCode: keyCode,
      key: key,
      shiftKey: shiftKey,
      ctrlKey: ctrlKey,
      altKey: altKey,
      metaKey: metaKey
    });

    document.body.dispatchEvent(event);
    window.dispatchEvent(event); 
  }

  function clickNextButton(platform) {
    let selectors = [];
    if (platform === "youtube") {
      selectors = [
        'button[aria-label="Next"]', 
        'button[aria-label*="Next video"]',
        'button[aria-label*="Video tiếp theo"]',
        'ytd-reel-player-overlay-renderer tp-yt-paper-icon-button[aria-label*="Next"]',
        '#navigation button[aria-label="Next"]'
      ];
    } else if (platform === "facebook") {
      selectors = [
        '[role="button"][aria-label="Next"]',
        '[role="button"][aria-label="Go to next reel"]',
        'div[aria-label="Next"]',
        'div[aria-label="Go to next reel"]',
        'div[tabindex="0"][role="button"] > i[data-visualcompletion="css-img"][alt="Next"]', 
        'div[role="button"][tabindex="0"] > i[data-visualcompletion="css-img"][alt*="Tiếp theo"]'
      ];
    } else if (platform === "tiktok") {
        selectors = [
            'button[data-e2e="arrow-right"]', 
            'button[data-e2e="arrow-down"]', 
            'div[data-e2e="feed-video"] > div.xgscf4j > div:last-child button', 
            'div[data-e2e="video-player-container"] > div > div:last-child button'
        ];
    }
    
    for (const sel of selectors) {
      const elements = Array.from(document.querySelectorAll(sel));
      for (const el of elements) {
        if (isVisible(el)) { 
          if (tryClick(el)) {
            toast(`Click: ${el.getAttribute('aria-label') || el.tagName}`);
            return true;
          }
        }
      }
    }
    return false;
  }

  function scrollToNextVideo(platform) {
    const now = Date.now();
    if (now - lastNavAt < COOLDOWN) return;
    lastNavAt = now;
  
    const prev = currentVideo();
    const prevSrc = prev ? prev.currentSrc : null;
  
    if (prev && !prev.paused) { try { prev.pause(); } catch (_) {} }
  
    if (clickNextButton(platform)) {
      setTimeout(() => {
        const v = currentVideo();
        if (v && v.paused) { try { v.play(); } catch (_) {} } 
      }, 500); 
      return;
    }
  
    if (platform === "youtube") {
        simulateKeyPress(40, "ArrowDown"); 
        toast("Key: ArrowDown");
    } else if (platform === "facebook") {
        simulateKeyPress(39, "ArrowRight"); 
        toast("Key: ArrowRight");
    } else if (platform === "tiktok") {
        window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
        toast("Scroll Down");
    }
    
    setTimeout(() => {
      const cur = currentVideo();
      const sameEl = !!(cur && prev && cur === prev);
      const sameSrc = !!(cur && prev && cur.currentSrc && prevSrc && cur.currentSrc === prevSrc);
      const resetTime = !!(cur && cur.currentTime < 0.7); 
  
      if ((sameEl && (resetTime || sameSrc)) || (!cur && prev)) {
        window.scrollBy({ top: window.innerHeight * 0.95, behavior: "smooth" });
        toast("Hard Fallback Scroll");
      }
  
      const v = currentVideo();
      if (v && v.paused) { try { v.play(); } catch (_) {} }
    }, 1000); 
  }

  function setPlaybackRateAll(rate) {
    visibleVideos().forEach(v => { v.playbackRate = rate; });
  }

  function createOrUpdateSpeedOverlay(rate) {
    if (!overlayEl) {
      overlayEl = document.createElement("div");
      Object.assign(overlayEl.style, {
        position: "fixed", top: "8px", left: "8px", zIndex: "999999",
        background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 8px",
        borderRadius: "6px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "12px", pointerEvents: "none", transition: "opacity 0.3s ease"
      });
      document.body.appendChild(overlayEl);
    }
    // Cập nhật hiển thị 2 số thập phân cho bước nhảy 0.25
    overlayEl.textContent = (rate || 1).toFixed(2) + "x"; 
    overlayEl.style.opacity = '1';
    if (rate === 1.0) {
      setTimeout(() => overlayEl.style.opacity = '0.5', 1000); 
    }
  }

  // HÀM ĐÃ ĐƯỢC CẬP NHẬT: Nhận cả trạng thái bật/tắt toàn bộ
  function createOrUpdateStatusOverlay(isAutoAdvanceActive, isExtensionGloballyActive) {
    if (!statusEl) {
      statusEl = document.createElement("div");
      Object.assign(statusEl.style, {
        position: "fixed", top: "30px", left: "8px", zIndex: "999999",
        background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 8px",
        borderRadius: "6px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "12px", pointerEvents: "none"
      });
      document.body.appendChild(statusEl);
    }

    if (!isExtensionGloballyActive) {
        statusEl.textContent = "RC: OFF (Disabled)";
        statusEl.style.background = "rgba(128,0,0,0.8)"; 
        statusEl.style.color = "#fff";
    } else {
        // Hiển thị trạng thái Auto Advance khi tiện ích đang bật
        statusEl.textContent = "RC: " + (isAutoAdvanceActive ? "ON" : "OFF (Auto)");
        statusEl.style.background = isAutoAdvanceActive ? "rgba(0,128,0,0.6)" : "rgba(64,64,64,0.6)";
        statusEl.style.color = "#fff";
    }
  }

  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      Object.assign(toastEl.style, {
        position: "fixed", bottom: "12px", left: "12px", zIndex: "999999",
        background: "rgba(0,0,0,0.7)", color: "#fff", padding: "6px 10px",
        borderRadius: "8px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        fontSize: "12px", pointerEvents: "none", opacity: "0", transition: "opacity 0.2s ease"
      });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.style.opacity = "1";
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { toastEl.style.opacity = "0"; }, 1200);
  }

  return { getPlatform, currentVideo, scrollToNextVideo, setPlaybackRateAll, createOrUpdateSpeedOverlay, createOrUpdateStatusOverlay, toast, simulateKeyPress };
})();
window.rcUtils = rcUtils;
