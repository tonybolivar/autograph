const AG_WORK_ENTRY_FIELDS = [
  { id: "company", label: "Company", type: "text", required: true },
  { id: "title", label: "Title", type: "text", required: true },
  { id: "location", label: "Location", type: "text" },
  { id: "start_month", label: "Start month", type: "select", options: ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] },
  { id: "start_year", label: "Start year", type: "text" },
  { id: "end_month", label: "End month", type: "select", options: ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] },
  { id: "end_year", label: "End year", type: "text" },
  { id: "is_current", label: "I currently work here", type: "checkbox" },
  { id: "description", label: "Description", type: "textarea" }
];

function _agWorkEntryId() {
  return "we_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

async function agLoadWorkHistory() {
  const data = await chrome.storage.local.get("workHistory");
  return Array.isArray(data.workHistory) ? data.workHistory : [];
}

async function agSaveWorkHistory(entries) {
  const clean = (entries || []).map(e => ({
    id: e.id || _agWorkEntryId(),
    company: String(e.company || "").trim(),
    title: String(e.title || "").trim(),
    location: String(e.location || "").trim(),
    start_month: String(e.start_month || "").trim(),
    start_year: String(e.start_year || "").trim(),
    end_month: String(e.end_month || "").trim(),
    end_year: String(e.end_year || "").trim(),
    is_current: !!e.is_current,
    description: String(e.description || "").trim().slice(0, 4000)
  }));
  await chrome.storage.local.set({ workHistory: clean });
  return clean;
}

async function agAddWorkEntry(partial = {}) {
  const entries = await agLoadWorkHistory();
  const entry = { id: _agWorkEntryId(), is_current: false, ...partial };
  entries.push(entry);
  await agSaveWorkHistory(entries);
  return entry;
}

async function agUpdateWorkEntry(id, patch) {
  const entries = await agLoadWorkHistory();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return false;
  entries[idx] = { ...entries[idx], ...patch, id };
  await agSaveWorkHistory(entries);
  return true;
}

async function agRemoveWorkEntry(id) {
  const entries = await agLoadWorkHistory();
  const filtered = entries.filter(e => e.id !== id);
  await agSaveWorkHistory(filtered);
}

async function agMoveWorkEntry(id, delta) {
  const entries = await agLoadWorkHistory();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return false;
  const target = idx + delta;
  if (target < 0 || target >= entries.length) return false;
  const [item] = entries.splice(idx, 1);
  entries.splice(target, 0, item);
  await agSaveWorkHistory(entries);
  return true;
}

const AG_WORK_INDEX_PATTERNS = [
  /(?:work\s*experience|employment|position|job|experience|employer)[\s\-_]*?#?\s*(\d+)/i,
  /experience\[(\d+)\]/i,
  /^(?:work|job|position|exp)[\s\-_]*?(\d+)\b/i,
  /\b(\d+)(?:st|nd|rd|th)?\s+(?:most\s+recent|previous|prior)\s+(?:job|position|role|employer)/i
];

const AG_WORK_SUBFIELD_ALIASES = [
  [["company", "employer", "organization", "company_name", "employer_name"], "company"],
  [["title", "job_title", "position", "role", "current_position"], "title"],
  [["location", "city", "where", "work_location"], "location"],
  [["start_date", "from", "started", "begin_date"], "start"],
  [["start_month", "from_month", "begin_month"], "start_month"],
  [["start_year", "from_year", "begin_year"], "start_year"],
  [["end_date", "to", "ended", "until", "finish_date"], "end"],
  [["end_month", "to_month", "finish_month"], "end_month"],
  [["end_year", "to_year", "finish_year"], "end_year"],
  [["description", "summary", "responsibilities", "achievements", "duties"], "description"],
  [["current", "is_current", "currently", "present"], "is_current"]
];

function _agEscape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function agParseWorkFieldId(label, fieldId) {
  const sources = [fieldId || "", label || ""];
  let indexHit = null;
  for (const src of sources) {
    if (!src) continue;
    for (const re of AG_WORK_INDEX_PATTERNS) {
      const m = src.match(re);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n)) {
          indexHit = src === fieldId || /\[\d+\]/.test(src) ? n : n - 1;
          if (indexHit < 0) indexHit = 0;
          break;
        }
      }
    }
    if (indexHit !== null) break;
  }
  if (indexHit === null) return null;

  const haystack = (sources.join(" ")).toLowerCase();
  for (const [aliases, sub] of AG_WORK_SUBFIELD_ALIASES) {
    for (const alias of aliases) {
      const re = new RegExp(`(?:^|[\\s_\\-/\\[\\]])${_agEscape(alias)}(?:$|[\\s_\\-/\\[\\]:?.!,;])`, "i");
      if (re.test(haystack)) return { index: indexHit, subfield: sub };
    }
  }
  return null;
}

function agWorkEntryValueFor(entry, subfield) {
  if (!entry) return undefined;
  switch (subfield) {
    case "start":
      return [entry.start_month, entry.start_year].filter(Boolean).join(" ") || undefined;
    case "end":
      if (entry.is_current) return "Present";
      return [entry.end_month, entry.end_year].filter(Boolean).join(" ") || undefined;
    case "is_current":
      return !!entry.is_current;
    default:
      return entry[subfield] || undefined;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AG_WORK_ENTRY_FIELDS,
    agLoadWorkHistory,
    agSaveWorkHistory,
    agAddWorkEntry,
    agUpdateWorkEntry,
    agRemoveWorkEntry,
    agMoveWorkEntry,
    agParseWorkFieldId,
    agWorkEntryValueFor
  };
}
