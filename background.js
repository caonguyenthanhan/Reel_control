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
    if (tab && tab.id) {
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
