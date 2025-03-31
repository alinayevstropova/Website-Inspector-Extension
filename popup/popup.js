document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("toggleButton");
    const statusText = document.getElementById("statusText");
  
    function updateState(enabled) {
      toggleButton.checked = enabled;
      statusText.textContent = enabled ? "Включено" : "Выключено";
    }
  
    function toggleExtension(enabled) {
      chrome.storage.local.set({ enabled: enabled }, () => {
        updateState(enabled);
        // Перезагрузка текущей вкладки для применения изменений
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs.length > 0) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
      });
    }
  
    chrome.storage.local.get(["enabled"], (items) => {
      updateState(items.enabled);
    });
  
    toggleButton.addEventListener("change", () => {
      toggleExtension(toggleButton.checked);
    });
  });