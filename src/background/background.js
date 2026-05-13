chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/ui/welcome/welcome.html") });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "AG_FILL_COMPLETE") {
    if (sender.tab?.id != null) {
      chrome.action.setBadgeText({ tabId: sender.tab.id, text: String(msg.count) });
      chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: "#fdd835" });
      setTimeout(() => {
        chrome.action.setBadgeText({ tabId: sender.tab.id, text: "" }).catch(() => {});
      }, 5000);
    }
    return false;
  }
  if (msg.type === "AG_OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    return false;
  }
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status !== "complete" || !tab.url) return;
  try {
    const url = new URL(tab.url);
    chrome.sidePanel?.setOptions({
      tabId,
      path: "src/ui/sidepanel/sidepanel.html",
      enabled: true
    }).catch(() => {});
  } catch (e) {}
});
