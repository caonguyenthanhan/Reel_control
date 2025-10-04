const rcUtils = (() => {
  let overlayEl = null;
  let statusEl = null;
  let toastEl = null;
  let hideTimer = null;
  function getPlatform() {
    const h = location.hostname;
    if (h.includes("youtube")) return "youtube";
    if (h.includes("tiktok")) return "tiktok";
    if (h.includes("facebook")) return "facebook";
    return "unknown";
  }
  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.right > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight) && r.left < (window.innerWidth || document.documentElement.clientWidth);
  }
  function visibleVideos() {
    return Array.from(document.querySelectorAll("video")).filter(v => isInViewport(v) && v.offsetParent !== null);
  }
  function currentVideo() {
    const vids = visibleVideos();
    const playing = vids.find(v => !v.paused && v.readyState >= 2);
    return playing || vids[0] || null;
  }
  function videoOrder() {
    return Array.from(document.querySelectorAll("video")).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  }
  let lastNavAt = 0;
  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight) && r.left < (window.innerWidth || document.documentElement.clientWidth);
  }
  function tryClick(el) {
    try { el.click(); return true; } catch (_) { return false; }
  }
  function clickNextButton(platform) {
    let selectors = [];
    if (platform === "youtube") {
      selectors = [
        'button[aria-label="Next"]',
        'button[aria-label*="Next video"]',
        'button[aria-label*="Video tiếp theo"]',
        'tp-yt-paper-icon-button[aria-label*="Next"]',
        'tp-yt-paper-icon-button[aria-label*="Video tiếp theo"]',
        '#navigation button[aria-label*="Next"]',
        'ytd-reel-player-overlay-renderer tp-yt-paper-icon-button[aria-label*="Next"]',
        'ytd-reel-player-overlay-renderer tp-yt-paper-icon-button[aria-label*="Video tiếp theo"]'
      ];
    } else if (platform === "facebook") {
      selectors = [
        'div[aria-label="Next"]',
        'div[aria-label*="Next reel"]',
        'div[aria-label*="Go to next reel"]',
        'div[aria-label*="Tiếp"]',
        'div[aria-label*="Tiếp theo"]',
        'div[aria-label*="Reels tiếp theo"]',
        'div[aria-label*="Video tiếp theo"]',
        'span[aria-label*="Next"]',
        'span[aria-label*="Tiếp theo"]',
        'div[role="button"][aria-label*="Next"]',
        'div[role="button"][aria-label*="Tiếp theo"]'
      ];
    }
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) {
        if (tryClick(el)) return true;
      }
    }
    return false;
  }
  function scrollToNextVideo(platform) {
    const now = Date.now();
    if (now - lastNavAt < 1200) return;
    lastNavAt = now;
  
    const prev = currentVideo();
    const prevSrc = prev ? prev.currentSrc : null;
    if (prev && !prev.paused) { try { prev.pause(); } catch (_) {} }
  
    if (platform === "youtube" || platform === "facebook") {
      if (clickNextButton(platform)) {
        setTimeout(() => {
          const v = currentVideo();
          if (v && v.paused) { try { v.play(); } catch (_) {} }
        }, 500);
        return;
      }
    }
  
    function dispatchArrowDown() {
      const evt = new KeyboardEvent("keydown", { key: "ArrowDown", code: "ArrowDown", keyCode: 40, which: 40, bubbles: true });
      document.dispatchEvent(evt);
      window.dispatchEvent(evt);
      const ae = document.activeElement;
      if (ae) ae.dispatchEvent(evt);
    }
    function dispatchArrowRight() {
      const evt = new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight", keyCode: 39, which: 39, bubbles: true });
      document.dispatchEvent(evt);
      window.dispatchEvent(evt);
      const ae = document.activeElement;
      if (ae) ae.dispatchEvent(evt);
    }
    function focusCandidates(platform) {
      const cands = [];
      const v = currentVideo();
      if (v) cands.push(v);
      if (platform === "youtube") {
        const yApp = document.querySelector('ytd-app');
        const yPlayer = document.querySelector('ytd-player');
        const reel = document.querySelector('ytd-reel-player-overlay-renderer');
        if (yApp) cands.push(yApp);
        if (yPlayer) cands.push(yPlayer);
        if (reel) cands.push(reel);
      } else if (platform === "facebook") {
        const main = document.querySelector('[role="main"]');
        const dialog = document.querySelector('div[role="dialog"]');
        const reels = document.querySelector('[aria-label*="Reels"]');
        if (dialog) cands.push(dialog);
        if (main) cands.push(main);
        if (reels) cands.push(reels);
      }
      cands.push(document.body);
      cands.forEach(el => { try { el.focus(); } catch (_) {} });
    }
  
    if (platform === "youtube" || platform === "facebook") {
      focusCandidates(platform);
      dispatchArrowDown();
      if (platform === "facebook") {
        setTimeout(() => dispatchArrowRight(), 80);
      }
    } else if (platform === "tiktok") {
      window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
    } else {
      const cur = currentVideo();
      const ordered = Array.from(document.querySelectorAll("video")).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const idx = cur ? ordered.indexOf(cur) : -1;
      const next = idx >= 0 ? ordered[idx + 1] : null;
      if (next) {
        next.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
      }
    }
  
    setTimeout(() => {
      const cur = currentVideo();
      const sameEl = !!(cur && prev && cur === prev);
      const sameSrc = !!(cur && prev && cur.currentSrc && prevSrc && cur.currentSrc === prevSrc);
      const resetTime = !!(cur && cur.currentTime < 0.7);
  
      if ((sameEl && (resetTime || sameSrc)) || (!cur)) {
        if (platform === "youtube") {
          if (!clickNextButton(platform)) {
            focusCandidates(platform);
            dispatchArrowDown();
            setTimeout(() => window.scrollBy({ top: window.innerHeight * 0.95, behavior: "smooth" }), 50);
          }
        } else if (platform === "facebook") {
          if (!clickNextButton(platform)) {
            focusCandidates(platform);
            dispatchArrowRight();
            setTimeout(() => dispatchArrowDown(), 80);
          }
        } else {
          window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
        }
      }
  
      const v = currentVideo();
      if (v && v.paused) { try { v.play(); } catch (_) {} }
    }, 900);
  }
  function setPlaybackRateAll(rate) {
    visibleVideos().forEach(v => { v.playbackRate = rate; });
  }
  function createOrUpdateSpeedOverlay(rate) {
    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.style.position = "fixed";
      overlayEl.style.top = "8px";
      overlayEl.style.left = "8px";
      overlayEl.style.zIndex = "999999";
      overlayEl.style.background = "rgba(0,0,0,0.6)";
      overlayEl.style.color = "#fff";
      overlayEl.style.padding = "4px 8px";
      overlayEl.style.borderRadius = "6px";
      overlayEl.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
      overlayEl.style.fontSize = "12px";
      overlayEl.style.pointerEvents = "none";
      document.body.appendChild(overlayEl);
    }
    overlayEl.textContent = (rate || 1).toFixed(1) + "x";
  }
  function createOrUpdateStatusOverlay(active) {
    if (!statusEl) {
      statusEl = document.createElement("div");
      statusEl.style.position = "fixed";
      statusEl.style.top = "30px";
      statusEl.style.left = "8px";
      statusEl.style.zIndex = "999999";
      statusEl.style.background = "rgba(0,0,0,0.6)";
      statusEl.style.color = "#fff";
      statusEl.style.padding = "4px 8px";
      statusEl.style.borderRadius = "6px";
      statusEl.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
      statusEl.style.fontSize = "12px";
      statusEl.style.pointerEvents = "none";
      document.body.appendChild(statusEl);
    }
    statusEl.textContent = "RC: " + (active ? "ON" : "OFF");
    statusEl.style.background = active ? "rgba(0,128,0,0.6)" : "rgba(64,64,64,0.6)";
  }
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.style.position = "fixed";
      toastEl.style.bottom = "12px";
      toastEl.style.left = "12px";
      toastEl.style.zIndex = "999999";
      toastEl.style.background = "rgba(0,0,0,0.7)";
      toastEl.style.color = "#fff";
      toastEl.style.padding = "6px 10px";
      toastEl.style.borderRadius = "8px";
      toastEl.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
      toastEl.style.fontSize = "12px";
      toastEl.style.pointerEvents = "none";
      toastEl.style.opacity = "0";
      toastEl.style.transition = "opacity 0.2s ease";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.style.opacity = "1";
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { toastEl.style.opacity = "0"; }, 1200);
  }
  return { getPlatform, currentVideo, scrollToNextVideo, setPlaybackRateAll, createOrUpdateSpeedOverlay, createOrUpdateStatusOverlay, toast };
})();
window.rcUtils = rcUtils;