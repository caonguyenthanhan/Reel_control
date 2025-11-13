const rcUtils = (() => {
  let overlayEl = null;
  let statusEl = null;
  let toastEl = null;
  let hideTimer = null;
  let lastNavAt = 0;
  let lastAutoAdvanceNotifyDownAt = 0;
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
    let vids = Array.from(document.querySelectorAll("video"));
    if (vids.length === 0) {
      const dialog = document.querySelector('div[role="dialog"]');
      if (dialog) vids = Array.from(dialog.querySelectorAll('video'));
    }
    return vids.filter(v => isInViewport(v) && !v.ended && (v.readyState >= 2 || Number.isFinite(v.duration)) && v.clientHeight > 100 && v.clientWidth > 100);
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
    const kd = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      keyCode: keyCode,
      which: keyCode,
      key: key,
      code: key,
      shiftKey: shiftKey,
      ctrlKey: ctrlKey,
      altKey: altKey,
      metaKey: metaKey,
      repeat: false,
      view: window,
      composed: true
    });
    const ku = new KeyboardEvent('keyup', {
      bubbles: true,
      cancelable: true,
      keyCode: keyCode,
      which: keyCode,
      key: key,
      code: key,
      shiftKey: shiftKey,
      ctrlKey: ctrlKey,
      altKey: altKey,
      metaKey: metaKey,
      view: window,
      composed: true
    });

    const dialog = document.querySelector('div[role="dialog"]');
    let target = dialog || document.activeElement;
    if (!target || target === document.body || target === document.documentElement) {
      target = document;
    }
    try { target.dispatchEvent(kd); } catch (e) {}
    // Một số viewer chỉ lắng nghe keyup
    setTimeout(() => { try { target.dispatchEvent(ku); } catch (e) {} }, 16);
  }

  function ensureFocusForPlatform(platform) {
    try {
      if (platform === "facebook") {
        const dlg = document.querySelector('div[role="dialog"]');
        if (dlg) { if (!dlg.hasAttribute('tabindex')) dlg.setAttribute('tabindex', '-1'); dlg.focus(); return; }
        const v = document.querySelector('video');
        if (v) { if (!v.hasAttribute('tabindex')) v.setAttribute('tabindex', '-1'); v.focus(); return; }
      } else if (platform === "tiktok") {
        const container = document.querySelector('div[data-e2e="scroll-list"], div[data-e2e="scroll-container"]');
        if (container) { if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1'); container.focus(); return; }
        const v = document.querySelector('video');
        if (v) { if (!v.hasAttribute('tabindex')) v.setAttribute('tabindex', '-1'); v.focus(); return; }
      } else if (platform === "youtube") {
        const player = document.querySelector('ytd-reel-player-renderer, ytd-watch-flexy, #player, .html5-video-player');
        if (player) { if (!player.hasAttribute('tabindex')) player.setAttribute('tabindex', '-1'); player.focus(); return; }
        const v = document.querySelector('video');
        if (v) { if (!v.hasAttribute('tabindex')) v.setAttribute('tabindex', '-1'); v.focus(); return; }
      }
    } catch (e) {}
  }

  function clickNextButtonYouTube() {
    const selectors = [
      'button[aria-label="Next"]',
      'button[aria-label*="Next video"]',
      'button[aria-label*="Video tiếp theo"]',
      'ytd-reel-player-overlay-renderer tp-yt-paper-icon-button[aria-label*="Next"]',
      '#navigation button[aria-label="Next"]'
    ];
    const root = document;
    for (const sel of selectors) {
      const elements = Array.from(root.querySelectorAll(sel));
      for (const el of elements) {
        if (isVisible(el) && tryClick(el)) { toast(`Click: ${el.getAttribute('aria-label') || el.tagName}`); return true; }
      }
    }
    return false;
  }

  function clickNextButtonFacebook() {
    const selectors = [
      '[role="button"][aria-label="Next"]',
      '[role="button"][aria-label="Go to next reel"]',
      'div[aria-label="Next"]',
      'div[aria-label="Go to next reel"]',
      '[role="button"][aria-label*="Tiếp theo"]',
      'div[role="button"][aria-label*="Tiếp theo"]',
      'div[tabindex="0"][role="button"] > i[data-visualcompletion="css-img"][alt="Next"]'
    ];
    const root = document.querySelector('div[role="dialog"]') || document;
    for (const sel of selectors) {
      const elements = Array.from(root.querySelectorAll(sel));
      for (const el of elements) {
        if (isVisible(el) && tryClick(el)) { toast(`Click: ${el.getAttribute('aria-label') || el.tagName}`); return true; }
      }
    }
    return false;
  }

  function scrollNextTikTok() {
    const container = document.querySelector('div[data-e2e="scroll-list"], div[data-e2e="scroll-container"]');
    if (container) {
      try {
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
        container.focus();
      } catch (e) {}
      container.scrollBy({ top: container.clientHeight, behavior: "smooth" });
      toast("Scrolled TikTok next");
      return true;
    }
    // Fallback dùng phím mũi tên ↓ nếu không có container
    simulateKeyPress(40, "ArrowDown");
    return false;
  }


  function clickNextButtonTikTok() {
    const selectors = [
      'button[data-e2e="arrow-down"]',
      'button[data-e2e="arrow-right"]',
      'div[data-e2e="feed-video"] > div.xgscf4j > div:last-child button',
      'div[data-e2e="video-player-container"] > div > div:last-child button'
    ];
    const root = document;
    for (const sel of selectors) {
      const elements = Array.from(root.querySelectorAll(sel));
      for (const el of elements) {
        if (isVisible(el) && tryClick(el)) { toast(`Click: ${el.getAttribute('aria-label') || el.tagName}`); return true; }
      }
    }
    return false;
  }

  function clickNextButton(platform) {
    if (platform === "youtube") return clickNextButtonYouTube();
    if (platform === "facebook") return clickNextButtonFacebook();
    if (platform === "tiktok") return clickNextButtonTikTok();
    return false;
  }

  function scrollToNextVideo(platform) {
    const now = Date.now();
    if (now - lastNavAt < COOLDOWN) return;
    lastNavAt = now;

    const prev = currentVideo();
    const prevSrc = prev && prev.currentSrc ? prev.currentSrc : null;
    if (prev && !prev.paused) {
      try { prev.pause(); } catch (e) {}
    }

    let clicked = false;

    if (platform === "youtube") {
      clicked = clickNextButtonYouTube();
      if (!clicked) {
        ensureFocusForPlatform("youtube");
        simulateKeyPress(40, 'ArrowDown');
        toast('Key: ArrowDown');
      }
    } else if (platform === "facebook") {
      clicked = clickNextButtonFacebook();
      if (!clicked) {
        ensureFocusForPlatform("facebook");
        simulateKeyPress(39, 'ArrowDown');
        toast('Key: ArrowDown');
        setTimeout(() => {
          const cur = currentVideo();
          const changed = !(cur && prev && (cur === prev || (cur && cur.currentSrc && prevSrc && cur.currentSrc === prevSrc)));
          if (!changed) {
            const clickedRetry = clickNextButtonFacebook();
            if (!clickedRetry) {
              simulateKeyPress(39, 'ArrowDown');
              toast('Key: ArrowDown');
            }
          }
        }, 500);
      }
    } else if (platform === "tiktok") {
      clicked = clickNextButtonTikTok();
      if (!clicked) {
        ensureFocusForPlatform("tiktok");
        simulateKeyPress(40, 'ArrowDown');
        toast('Key: ArrowDown');
        setTimeout(() => {
          const cur = currentVideo();
          const sameEl = !!(cur && prev && cur === prev);
          const sameSrc = !!(cur && prev && cur.currentSrc && prevSrc && cur.currentSrc === prevSrc);
          if (sameEl || sameSrc) {
            scrollNextTikTok();
          }
        }, 600);
      }
    } else {
      window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
    }

    setTimeout(() => {
      const v = currentVideo();
      if (v && v.paused) {
        try { v.play(); } catch (e) {}
      }
    }, 900);
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

        if (isAutoAdvanceActive) {
          const now = Date.now();
          if (now - lastAutoAdvanceNotifyDownAt > COOLDOWN) {
            ensureFocusForPlatform(getPlatform());
            simulateKeyPress(40, 'ArrowDown');
            toast('Key: ArrowDown');
            lastAutoAdvanceNotifyDownAt = now;
          }
        }
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
