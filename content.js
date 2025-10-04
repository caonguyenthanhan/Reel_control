(() => {
  const platform = rcUtils.getPlatform();
  let isActive = true;
  let isPausedByUser = false;
  let currentRate = 1.0;

  chrome.storage.sync.get(["rc_active", "rc_rate"], (data) => {
    if (typeof data.rc_active === "boolean") isActive = data.rc_active;
    if (typeof data.rc_rate === "number") currentRate = data.rc_rate;
    rcUtils.setPlaybackRateAll(currentRate);
    rcUtils.createOrUpdateSpeedOverlay(currentRate);
    rcUtils.createOrUpdateStatusOverlay(isActive);
  });

  function maybeAdvance() {
    if (!isActive || isPausedByUser) return;
    rcUtils.scrollToNextVideo(platform);
    rcUtils.toast("Next video");
  }

  function bindListeners() {
    const vids = Array.from(document.querySelectorAll("video"));
    vids.forEach(v => {
      if (!v.__rcBoundEnded) {
        v.__rcBoundEnded = true;
        v.addEventListener("ended", () => { maybeAdvance(); });
      }
      if (!v.__rcBoundTimeUpdate) {
        v.__rcBoundTimeUpdate = true;
        v.addEventListener("timeupdate", () => {
          if (!isActive || isPausedByUser) return;
          const d = v.duration;
          if (Number.isFinite(d) && d > 0) {
            if (v.currentTime >= d - 0.25) {
              maybeAdvance();
            }
          }
        });
      }
    });
  }

  const mo = new MutationObserver(() => { bindListeners(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  bindListeners();

  document.addEventListener("keydown", (e) => {
    if (e.key === " " || e.code === "Space") {
      const v = rcUtils.currentVideo();
      if (v) {
        if (v.paused) { v.play(); isPausedByUser = false; rcUtils.toast("Playing"); }
        else { v.pause(); isPausedByUser = true; rcUtils.toast("Paused"); }
      }
    } else if (e.key.toLowerCase() === "d") {
      currentRate = Math.min(5, (currentRate + 0.1));
      chrome.storage.sync.set({ rc_rate: currentRate });
      rcUtils.setPlaybackRateAll(currentRate);
      rcUtils.createOrUpdateSpeedOverlay(currentRate);
      rcUtils.toast("Speed: " + currentRate.toFixed(1) + "x");
    } else if (e.key.toLowerCase() === "s") {
      currentRate = Math.max(0.1, (currentRate - 0.1));
      chrome.storage.sync.set({ rc_rate: currentRate });
      rcUtils.setPlaybackRateAll(currentRate);
      rcUtils.createOrUpdateSpeedOverlay(currentRate);
      rcUtils.toast("Speed: " + currentRate.toFixed(1) + "x");
    } else if (e.key.toLowerCase() === "r") {
      currentRate = 1.0;
      chrome.storage.sync.set({ rc_rate: currentRate });
      rcUtils.setPlaybackRateAll(currentRate);
      rcUtils.createOrUpdateSpeedOverlay(currentRate);
      rcUtils.toast("Speed: " + currentRate.toFixed(1) + "x");
    } else if (e.shiftKey && e.key.toLowerCase() === "s") {
      chrome.runtime.sendMessage({ type: "screenshot" });
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "toggle") {
      isActive = !isActive;
      chrome.storage.sync.set({ rc_active: isActive });
      rcUtils.createOrUpdateStatusOverlay(isActive);
      rcUtils.toast(isActive ? "RC ON" : "RC OFF");
    }
  });
})();