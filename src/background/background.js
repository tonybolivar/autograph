const AG_CONTENT_JS = [
  "src/lib/sites.js",
  "src/lib/normalizers.js",
  "src/lib/masterProfile.js",
  "src/lib/labelMatcher.js",
  "src/lib/domUtils.js",
  "src/lib/capture.js",
  "src/lib/resume.js",
  "src/lib/customDomains.js",
  "src/adapters/_default.js",
  "src/adapters/workday.js",
  "src/adapters/smartrecruiters.js",
  "src/adapters/eightfold.js",
  "src/adapters/oracle.js",
  "src/adapters/ashby.js",
  "src/adapters/lever.js",
  "src/adapters/successfactors.js",
  "src/adapters/jobvite.js",
  "src/adapters/rippling.js",
  "src/adapters/loxo.js",
  "src/adapters/paylocity.js",
  "src/adapters/breezyhr.js",
  "src/adapters/bullhorn.js",
  "src/adapters/recruitee.js",
  "src/adapters/teamtailor.js",
  "src/adapters/ukg.js",
  "src/adapters/gem.js",
  "src/adapters/phenom.js",
  "src/adapters/bamboohr.js",
  "src/adapters/icims.js",
  "src/adapters/greenhouse.js",
  "src/content/content.js"
];

async function syncDynamicContentScripts() {
  if (!chrome.scripting?.registerContentScripts) return;
  const stored = (await chrome.storage.sync.get("customDomains")).customDomains || {};
  const hosts = Object.keys(stored);
  try {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: hosts.map(h => `ag-custom-${h}`) });
    if (existing.length > 0) {
      await chrome.scripting.unregisterContentScripts({ ids: existing.map(s => s.id) });
    }
  } catch (e) {}
  for (const host of hosts) {
    try {
      const granted = await chrome.permissions.contains({ origins: [`*://${host}/*`] });
      if (!granted) continue;
      await chrome.scripting.registerContentScripts([{
        id: `ag-custom-${host}`,
        matches: [`*://${host}/*`],
        js: AG_CONTENT_JS,
        css: ["src/styles/content.css"],
        runAt: "document_idle"
      }]);
    } catch (err) {}
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.customDomains) syncDynamicContentScripts();
});

chrome.runtime.onStartup.addListener(syncDynamicContentScripts);

chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/ui/welcome/welcome.html") });
  }
  syncDynamicContentScripts();
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
