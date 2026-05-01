document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleButton");
  const statusText = document.getElementById("statusText");

  function updateState(enabled) {
    toggleButton.checked = enabled;
    statusText.textContent = enabled ? "Enabled" : "Disabled";
  }

  function toggleExtension(enabled) {
    chrome.storage.local.set({ enabled }, () => {
      updateState(enabled);
      // Reload the active tab so the content script applies the new state.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    });
  }

  chrome.storage.local.get(["enabled"], (items) => {
    updateState(Boolean(items.enabled));
  });

  toggleButton.addEventListener("change", () => {
    toggleExtension(toggleButton.checked);
  });
});
