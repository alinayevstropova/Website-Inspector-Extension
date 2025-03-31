chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
  fetch(chrome.runtime.getURL("data/requirements.json"))
    .then((response) => response.json())
    .then((requirements) => {
      chrome.storage.local.set({ requirements, enabled: true }); // Добавляем 'enabled'
    })
    .catch((error) => console.error("Failed to fetch requirements:", error));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.storage.local.get(["enabled"], (items) => {
    if (changeInfo.status === "complete" && tab.url && items.enabled) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["scripts/content.js"],
      });
    }
  });
});