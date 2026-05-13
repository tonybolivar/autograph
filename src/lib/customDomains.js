const AG_KNOWN_CUSTOM_DOMAINS = {
  "careers.formlabs.com": "greenhouse"
};

async function agLoadCustomDomains() {
  const data = await chrome.storage.sync.get("customDomains");
  return data.customDomains || {};
}

async function agAddCustomDomain(host, adapter) {
  const normalized = host.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
  if (!normalized) return false;
  const domains = await agLoadCustomDomains();
  domains[normalized] = adapter;
  await chrome.storage.sync.set({ customDomains: domains });
  return true;
}

async function agRemoveCustomDomain(host) {
  const domains = await agLoadCustomDomains();
  delete domains[host];
  await chrome.storage.sync.set({ customDomains: domains });
}

function agFindCustomDomainForHostname(hostname, storedDomains) {
  if (AG_KNOWN_CUSTOM_DOMAINS[hostname]) {
    return { host: hostname, adapter: AG_KNOWN_CUSTOM_DOMAINS[hostname], builtin: true };
  }
  if (storedDomains) {
    for (const [host, adapter] of Object.entries(storedDomains)) {
      if (hostname === host || hostname.endsWith("." + host)) {
        return { host, adapter, builtin: false };
      }
    }
  }
  return null;
}

function agDetectEmbeddedATS() {
  const url = location.href;
  const search = location.search;
  if (search.includes("gh_jid=") || search.includes("gh_src=")) return "greenhouse";
  if (document.querySelector('script[src*="boards.greenhouse.io"], iframe[src*="greenhouse.io"]')) return "greenhouse";
  if (document.querySelector('script[src*="jobs.lever.co"], iframe[src*="jobs.lever.co"]')) return "lever";
  if (document.querySelector('script[src*="ashbyhq"], iframe[src*="ashbyhq"]')) return "ashby";
  if (document.querySelector('[data-automation-id]') && /myworkdayjobs|workday/i.test(url)) return "workday";
  if (document.querySelector('iframe[src*="smartrecruiters.com"]')) return "smartrecruiters";
  if (document.querySelector('iframe[src*="bamboohr.com"]')) return "bamboohr";
  if (document.querySelector('iframe[src*="icims.com"]')) return "icims";
  return null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AG_KNOWN_CUSTOM_DOMAINS,
    agLoadCustomDomains,
    agAddCustomDomain,
    agRemoveCustomDomain,
    agFindCustomDomainForHostname,
    agDetectEmbeddedATS
  };
}
