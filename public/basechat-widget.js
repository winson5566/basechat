/**
 * Smart Chat Widget Embed Script
 * 使用方法：<script src="http://localhost:3000/basechat-widget.js" data-chatbot-id="YOUR_CHATBOT_ID"></script>
 */
(function() {
  'use strict';

  // 获取脚本标签的data-chatbot-id属性
  const currentScript = document.currentScript || document.querySelector('script[data-chatbot-id]');
  const chatbotId = currentScript ? currentScript.getAttribute('data-chatbot-id') : null;

  if (!chatbotId) {
    console.error('Smart Chat Widget: data-chatbot-id attribute is required');
    return;
  }

  // 获取基础URL（从脚本src中提取）
  const scriptSrc = currentScript ? currentScript.src : '';
  const baseUrl = scriptSrc ? new URL(scriptSrc).origin : window.location.origin;

  // 创建iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'basechat-widget-iframe';
  iframe.src = `${baseUrl}/chatbot/${chatbotId}`;
  iframe.allow = 'microphone';
  iframe.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100px;
    height: 100px;
    border: none;
    z-index: 2147483647;
    background: transparent;
    pointer-events: auto;
    transition: width 0.2s ease, height 0.2s ease;
  `;

  // 等待DOM加载完成后添加iframe
  if (document.body) {
    document.body.appendChild(iframe);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(iframe);
    });
  }

  // 监听来自iframe的消息以动态调整大小
  window.addEventListener('message', function(event) {
    // 验证消息来源
    if (event.origin !== baseUrl) return;
    
    if (event.data && event.data.type === 'basechat-resize') {
      const { isOpen, isMinimized } = event.data;
      
      if (!isOpen) {
        // 只显示气泡
        iframe.style.width = '100px';
        iframe.style.height = '100px';
      } else if (isMinimized) {
        // 最小化窗口
        iframe.style.width = '350px';
        iframe.style.height = '100px';
      } else {
        // 完整聊天窗口
        iframe.style.width = '450px';
        iframe.style.height = '700px';
      }
    }
  });

  // 提供全局API供外部控制
  window.BaseChat = {
    open: function() {
      iframe.contentWindow.postMessage({ type: 'basechat-open' }, baseUrl);
    },
    close: function() {
      iframe.contentWindow.postMessage({ type: 'basechat-close' }, baseUrl);
    },
    minimize: function() {
      iframe.contentWindow.postMessage({ type: 'basechat-minimize' }, baseUrl);
    }
  };
})();
