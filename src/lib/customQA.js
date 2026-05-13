async function agLoadCustomQA() {
  const data = await chrome.storage.local.get("customQA");
  return Array.isArray(data.customQA) ? data.customQA : [];
}

async function agSaveCustomQA(list) {
  const clean = (list || []).map(e => ({
    id: e.id || ("qa_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8)),
    question: String(e.question || "").trim(),
    answer: String(e.answer || "").trim(),
    kind: e.kind || "text"
  })).filter(e => e.question && e.answer);
  await chrome.storage.local.set({ customQA: clean });
  return clean;
}

async function agAddCustomQA(entry) {
  const list = await agLoadCustomQA();
  list.push({ id: "qa_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8), ...entry });
  return agSaveCustomQA(list);
}

async function agRemoveCustomQA(id) {
  const list = await agLoadCustomQA();
  await agSaveCustomQA(list.filter(e => e.id !== id));
}

function _agNormalizeText(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function agFindCustomQAMatch(label, fieldId, list) {
  if (!label || !list || list.length === 0) return null;
  const normLabel = _agNormalizeText(label);
  const normFid = _agNormalizeText(fieldId || "");
  if (!normLabel && !normFid) return null;
  for (const entry of list) {
    const normQ = _agNormalizeText(entry.question);
    if (!normQ) continue;
    if (normLabel === normQ || normFid === normQ) return entry;
    if (normQ.length >= 8 && (normLabel.includes(normQ) || normQ.includes(normLabel))) return entry;
  }
  const labelTokens = new Set(normLabel.split(" ").filter(t => t.length >= 4));
  if (labelTokens.size < 2) return null;
  let best = null;
  let bestScore = 0;
  for (const entry of list) {
    const qTokens = _agNormalizeText(entry.question).split(" ").filter(t => t.length >= 4);
    if (qTokens.length < 2) continue;
    let overlap = 0;
    for (const t of qTokens) if (labelTokens.has(t)) overlap++;
    const score = overlap / Math.max(qTokens.length, labelTokens.size);
    if (overlap >= 2 && score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore >= 0.5 ? best : null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    agLoadCustomQA,
    agSaveCustomQA,
    agAddCustomQA,
    agRemoveCustomQA,
    agFindCustomQAMatch
  };
}
