// Popup script for Chrome extension settings
document.addEventListener("DOMContentLoaded", function () {
  const chatbotUrlInput = document.getElementById("chatbotUrl");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");

  // Load saved settings
  chrome.storage.sync.get(["chatbotUrl"], function (result) {
    if (result.chatbotUrl) {
      chatbotUrlInput.value = result.chatbotUrl;
    }
  });

  // Save settings
  saveBtn.addEventListener("click", function () {
    const chatbotUrl = chatbotUrlInput.value.trim();

    if (!chatbotUrl) {
      showStatus("Please enter a chatbot URL", "error");
      return;
    }

    // Validate URL format
    try {
      new URL(chatbotUrl);
    } catch (e) {
      showStatus("Please enter a valid URL", "error");
      return;
    }

    // Extract chatbot ID from URL
    const match = chatbotUrl.match(/\/chatbot\/([^/?]+)/);
    if (!match) {
      showStatus("Invalid chatbot URL format. Should contain /chatbot/[ID]", "error");
      return;
    }

    const chatbotId = match[1];

    chrome.storage.sync.set(
      {
        chatbotUrl: chatbotUrl,
        chatbotId: chatbotId,
        enabled: true, // 默认启用
      },
      function () {
        showStatus("Settings saved successfully!", "success");

        // Reload all tabs to apply changes
        chrome.tabs.query({}, function (tabs) {
          tabs.forEach(function (tab) {
            if (tab.id) {
              chrome.tabs.reload(tab.id);
            }
          });
        });
      }
    );
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";

    setTimeout(function () {
      statusDiv.style.display = "none";
    }, 3000);
  }
});
