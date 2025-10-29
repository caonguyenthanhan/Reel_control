chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Yêu cầu chụp màn hình
  if (msg && msg.type === "screenshot") {
    // Chrome API chỉ cho phép chụp toàn bộ vùng nhìn thấy (visible tab)
    chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
      const filename = "reel_control_" + Date.now() + ".png";
      // Bổ sung: Gửi lại thông báo cho content script để hiển thị toast
      if (dataUrl) {
          chrome.downloads.download({ url: dataUrl, filename });
          sendResponse({ ok: true, message: "Screenshot captured! (Full Tab)" });
      } else {
          sendResponse({ ok: false, message: "Error capturing tab." });
      }
    });
    return true; // Giữ kết nối sendResponse
  }
});

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const url = (tab && tab.url) || "";
    // Chỉ gửi lệnh tới các trang web được hỗ trợ
    const supported = /^(https?:\/\/)?([^\/]*\.)?(youtube\.com|facebook\.com|tiktok\.com)\//i.test(url);
    
    if (tab && tab.id && supported) {
      let messageType;
      
      if (command === "toggle_auto_advance") {
        messageType = "toggle_auto_advance";
      } else if (command === "toggle_extension_all") {
        messageType = "toggle_extension_all";
      }
      
      if (messageType) {
        chrome.tabs.sendMessage(tab.id, { type: messageType }, () => { void chrome.runtime.lastError; });
      }
    }
  });
});
