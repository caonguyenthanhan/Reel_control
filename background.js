chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "screenshot") {
    chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
      const filename = "reel_control_" + Date.now() + ".png";
      chrome.downloads.download({ url: dataUrl, filename });
      sendResponse({ ok: true });
    });
    return true;
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle_extension") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const url = (tab && tab.url) || "";
      const supported = /^(https?:\/\/)?([^\/]*\.)?(youtube\.com|facebook\.com|tiktok\.com)\//i.test(url);
      if (tab && tab.id && supported) {
        chrome.tabs.sendMessage(tab.id, { type: "toggle" }, () => { void chrome.runtime.lastError; });
      }
    });
  }
});