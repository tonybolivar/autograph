const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function fieldInput(field, currentValue) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const label = document.createElement("label");
  label.textContent = field.label;
  label.setAttribute("for", `f-${field.id}`);
  wrap.appendChild(label);

  let input;
  if (field.type === "select") {
    input = document.createElement("select");
    for (const opt of field.options) {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt || "Not set";
      if (opt === currentValue) o.selected = true;
      input.appendChild(o);
    }
  } else {
    input = document.createElement("input");
    input.type = field.type || "text";
    input.value = currentValue || "";
    input.placeholder = field.label;
  }
  input.id = `f-${field.id}`;
  input.dataset.fieldId = field.id;
  wrap.appendChild(input);

  const saved = document.createElement("span");
  saved.className = "save-pulse";
  saved.textContent = "Saved";
  wrap.appendChild(saved);

  let saveTimer;
  const flashSaved = () => {
    wrap.classList.add("saved");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => wrap.classList.remove("saved"), 1200);
  };

  const persist = async () => {
    const value = input.value;
    const result = await agUpdateProfileField(field.id, value);
    if (!result.ok && result.reason === "invalid") {
      input.classList.add("invalid");
      return;
    }
    input.classList.remove("invalid");
    flashSaved();
    refreshCompletion();
  };

  input.addEventListener("change", persist);
  if (field.type !== "select") {
    let debounce;
    input.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(persist, 600);
    });
  }
  return wrap;
}

async function renderProfile() {
  const profile = await agLoadProfile();
  for (const section of AG_PROFILE_SECTIONS) {
    const grid = document.getElementById(`grid-${section.id}`);
    if (!grid) continue;
    grid.innerHTML = "";
    const fields = AG_PROFILE_FIELDS.filter(f => f.section === section.id);
    for (const field of fields) {
      grid.appendChild(fieldInput(field, profile[field.id]));
    }
  }
  refreshCompletion();
}

async function refreshCompletion() {
  const { filled, total, percent } = await agGetProfileCompletion();
  $("#completionPercent").textContent = `${percent}%`;
  $("#completionFill").style.width = `${percent}%`;
}

async function renderSites() {
  const list = $("#siteList");
  list.innerHTML = "";
  const toggles = (await chrome.storage.local.get("siteToggles")).siteToggles || {};
  for (const site of AG_SUPPORTED_SITES) {
    const row = document.createElement("div");
    row.className = "site-row";
    const name = document.createElement("div");
    name.className = "site-name";
    name.textContent = site.name;
    const switchLbl = document.createElement("label");
    switchLbl.className = "switch";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = toggles[site.id] !== false;
    cb.addEventListener("change", async () => {
      const t = (await chrome.storage.local.get("siteToggles")).siteToggles || {};
      t[site.id] = cb.checked;
      await chrome.storage.local.set({ siteToggles: t });
    });
    const slider = document.createElement("span");
    slider.className = "slider";
    switchLbl.appendChild(cb);
    switchLbl.appendChild(slider);
    row.appendChild(name);
    row.appendChild(switchLbl);
    list.appendChild(row);
  }
}

async function renderCaptured() {
  const list = $("#capturedList");
  list.innerHTML = "";
  const data = (await chrome.storage.local.get("fieldData")).fieldData || {};
  const labels = (await chrome.storage.local.get("fieldLabels")).fieldLabels || {};
  const siteIds = Object.keys(data).sort();
  if (siteIds.length === 0) {
    list.innerHTML = `<p class="panel-help">No captured data yet. As you fill custom questions on supported sites, Autograph will remember the answers for next time.</p>`;
    return;
  }
  for (const siteId of siteIds) {
    const entries = data[siteId] || {};
    const siteLabels = labels[siteId] || {};
    const entryIds = Object.keys(entries);
    if (entryIds.length === 0) continue;
    const details = document.createElement("details");
    details.className = "captured-site";
    const summary = document.createElement("summary");
    const siteDef = AG_SUPPORTED_SITES.find(s => s.id === siteId.split("|")[0]);
    summary.innerHTML = `<span>${siteDef ? siteDef.name : siteId}</span><span class="count">${entryIds.length} fields</span>`;
    details.appendChild(summary);
    const wrap = document.createElement("div");
    wrap.className = "entries";
    for (const fid of entryIds) {
      const row = document.createElement("div");
      row.className = "captured-entry";
      const left = document.createElement("div");
      left.className = "fid";
      left.textContent = siteLabels[fid] || fid;
      const right = document.createElement("div");
      right.className = "val";
      const v = entries[fid];
      right.textContent = Array.isArray(v) ? v.join(" / ") : String(v);
      row.appendChild(left);
      row.appendChild(right);
      wrap.appendChild(row);
    }
    details.appendChild(wrap);
    list.appendChild(details);
  }
}

function switchTab(name) {
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  $$(".panel").forEach(p => p.classList.toggle("active", p.id === `tab-${name}`));
  if (name === "sites") renderSites();
  if (name === "data") renderCaptured();
}

$$(".tab").forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));

$("#exportBtn").addEventListener("click", async () => {
  const profile = await agLoadProfile();
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "autograph-profile.json";
  a.click();
  URL.revokeObjectURL(url);
});

$("#importBtn").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const parsed = JSON.parse(text);
    await agSaveProfile(parsed);
    renderProfile();
  } catch (err) {
    alert("Invalid JSON file");
  }
});

$("#clearCapturedBtn").addEventListener("click", async () => {
  if (!confirm("Clear all captured site data? Master profile stays intact.")) return;
  await chrome.storage.local.set({ fieldData: {}, fieldLabels: {} });
  renderCaptured();
});

$("#resetProfileBtn").addEventListener("click", async () => {
  if (!confirm("Reset your entire master profile? This cannot be undone.")) return;
  await chrome.storage.sync.set({ masterProfile: {} });
  renderProfile();
});

renderProfile();
