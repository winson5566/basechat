// Content script - injects chatbot widget into web pages
(function () {
  // Prevent multiple injections
  if (window.__basechat_widget_loaded__) {
    return;
  }
  window.__basechat_widget_loaded__ = true;

  // Load settings and inject widget
  chrome.storage.sync.get(["chatbotUrl", "chatbotId", "enabled"], function (result) {
    if (!result.enabled || !result.chatbotUrl || !result.chatbotId) {
      return;
    }

    // Extract base URL from chatbot URL
    const baseUrl = new URL(result.chatbotUrl).origin;

    // Create iframe container
    const container = document.createElement("div");
    container.id = "basechat-widget-container";

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.id = "basechat-widget-iframe";
    iframe.src = result.chatbotUrl;
    iframe.allow = "microphone";
    
    // 默认只显示气泡大小
    iframe.style.width = "100px";
    iframe.style.height = "100px";

    container.appendChild(iframe);
    document.body.appendChild(container);

    // 监听来自iframe的消息以调整大小（校验来源与来源窗口）
    window.addEventListener("message", function (event) {
      // 安全校验：仅接受来自 chatbot 源站、且来源窗口为该 iframe 的消息
      try {
        if (event.origin !== baseUrl) return;
        if (event.source !== iframe.contentWindow) return;
      } catch (e) {
        return;
      }

      if (event.data && event.data.type === "basechat-resize") {
        const { isOpen, isMinimized } = event.data;

        if (!isOpen) {
          // 只显示气泡
          iframe.style.width = "100px";
          iframe.style.height = "100px";
        } else if (isMinimized) {
          // 最小化窗口
          iframe.style.width = "350px";
          iframe.style.height = "100px";
        } else {
          // 完整聊天窗口
          iframe.style.width = "450px";
          iframe.style.height = "700px";
        }
      }
    });
  });
})();
