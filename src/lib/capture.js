let _agFieldDataChain = Promise.resolve();
let _agFieldLabelsChain = Promise.resolve();

async function agLoadFieldData(siteId) {
  const data = await chrome.storage.local.get("fieldData");
  return (data.fieldData || {})[siteId] || {};
}

async function agSaveFieldValue(siteId, fieldId, value, isDropdownLike = false, opposites = null) {
  _agFieldDataChain = _agFieldDataChain.then(async () => {
    const stored = (await chrome.storage.local.get("fieldData")).fieldData || {};
    if (!stored[siteId]) stored[siteId] = {};
    if (isDropdownLike) {
      let arr = stored[siteId][fieldId];
      if (typeof arr === "string") arr = [arr];
      else if (!Array.isArray(arr)) arr = [];
      arr = arr.filter(v => v !== value);
      arr.unshift(value);
      stored[siteId][fieldId] = arr;
    } else {
      stored[siteId][fieldId] = value;
    }
    if (opposites && opposites.length) {
      for (const opp of opposites) {
        if (stored[siteId][opp] !== undefined) delete stored[siteId][opp];
      }
    }
    await chrome.storage.local.set({ fieldData: stored });
  });
  return _agFieldDataChain;
}

async function agClearFieldValue(siteId, fieldId) {
  let removed;
  _agFieldDataChain = _agFieldDataChain.then(async () => {
    const stored = (await chrome.storage.local.get("fieldData")).fieldData || {};
    if (stored[siteId] && stored[siteId][fieldId] !== undefined) {
      removed = stored[siteId][fieldId];
      delete stored[siteId][fieldId];
      await chrome.storage.local.set({ fieldData: stored });
    }
  });
  await _agFieldDataChain;
  return removed;
}

async function agSaveFieldLabels(siteId, labelMap) {
  if (!labelMap || Object.keys(labelMap).length === 0) return;
  _agFieldLabelsChain = _agFieldLabelsChain.then(async () => {
    const stored = (await chrome.storage.local.get("fieldLabels")).fieldLabels || {};
    if (!stored[siteId]) stored[siteId] = {};
    let changed = false;
    for (const [fid, label] of Object.entries(labelMap)) {
      if (label && stored[siteId][fid] !== label) {
        stored[siteId][fid] = label;
        changed = true;
      }
    }
    if (changed) await chrome.storage.local.set({ fieldLabels: stored });
  });
  return _agFieldLabelsChain;
}

async function agLoadFieldLabels(siteId) {
  const data = await chrome.storage.local.get("fieldLabels");
  return (data.fieldLabels || {})[siteId] || {};
}

function agRecallByLabelSiblings(currentFieldId, currentLabel, labelMap, dataMap) {
  if (!currentLabel || currentLabel === "Unknown Field Name") return undefined;
  const target = currentLabel.toLowerCase().trim();
  if (!target.includes(" ")) return undefined;
  for (const [otherFieldId, otherLabel] of Object.entries(labelMap)) {
    if (otherFieldId === currentFieldId) continue;
    if ((otherLabel || "").toLowerCase().trim() === target && dataMap[otherFieldId] !== undefined) {
      return dataMap[otherFieldId];
    }
  }
  return undefined;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    agLoadFieldData,
    agSaveFieldValue,
    agClearFieldValue,
    agSaveFieldLabels,
    agLoadFieldLabels,
    agRecallByLabelSiblings
  };
}
