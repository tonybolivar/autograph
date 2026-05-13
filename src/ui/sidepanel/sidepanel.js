const $ = (s) => document.querySelector(s);

async function refresh() {
  const { filled, total, percent } = await agGetProfileCompletion();
  $("#profileStatus").textContent = `${filled} of ${total} fields`;
  $("#bar").style.width = `${percent}%`;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    $("#siteName").textContent = "No tab";
    $("#fillNow").disabled = true;
    return;
  }
  try {
    const url = new URL(tab.url);
    const site = agFindSiteForHost(url.hostname);
    if (!site) {
      $("#siteName").textContent = "Not a supported site";
      $("#fillNow").disabled = true;
      $("#siteToggle").disabled = true;
      return;
    }
    $("#siteName").textContent = site.name;
    const toggles = (await chrome.storage.local.get("siteToggles")).siteToggles || {};
    $("#siteToggle").checked = toggles[site.id] !== false;
    $("#siteToggle").disabled = false;
    $("#fillNow").disabled = false;

    $("#siteToggle").onchange = async () => {
      const t = (await chrome.storage.local.get("siteToggles")).siteToggles || {};
      t[site.id] = $("#siteToggle").checked;
      await chrome.storage.local.set({ siteToggles: t });
    };

    $("#fillNow").onclick = async () => {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "AG_TRIGGER_FILL" });
      } catch (e) {}
    };
  } catch (e) {
    $("#siteName").textContent = "Unknown";
    $("#fillNow").disabled = true;
  }
}

$("#openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());

refresh();
chrome.tabs.onActivated.addListener(refresh);
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "complete") refresh();
});
