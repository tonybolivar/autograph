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
  } else if (field.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = 4;
    input.value = currentValue || "";
    input.placeholder = field.label;
    wrap.classList.add("field-textarea");
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
  const countEl = $("#completionCount");
  if (countEl) countEl.textContent = `${filled} of ${total}`;
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

function jobInput(field, entry, onChange) {
  const wrap = document.createElement("div");
  wrap.className = `job-field job-field-${field.id}`;
  const label = document.createElement("label");
  label.textContent = field.label;
  wrap.appendChild(label);

  let input;
  if (field.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = 3;
    input.value = entry[field.id] || "";
  } else if (field.type === "select") {
    input = document.createElement("select");
    for (const opt of field.options) {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt || "Month";
      if (opt === entry[field.id]) o.selected = true;
      input.appendChild(o);
    }
  } else if (field.type === "checkbox") {
    input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!entry[field.id];
  } else {
    input = document.createElement("input");
    input.type = "text";
    input.value = entry[field.id] || "";
  }

  const event = field.type === "checkbox" || field.type === "select" ? "change" : "input";
  let debounce;
  input.addEventListener(event, () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const value = field.type === "checkbox" ? input.checked : input.value;
      onChange(field.id, value);
    }, field.type === "checkbox" || field.type === "select" ? 0 : 400);
  });

  wrap.appendChild(input);
  return wrap;
}

async function renderWorkHistory() {
  const list = $("#workHistoryList");
  if (!list) return;
  list.innerHTML = "";
  const entries = await agLoadWorkHistory();
  if (entries.length === 0) {
    list.innerHTML = `<p class="panel-help">No jobs yet. Click Add job to start your work history.</p>`;
    return;
  }
  entries.forEach((entry, idx) => {
    const card = document.createElement("div");
    card.className = "job-card";

    const header = document.createElement("div");
    header.className = "job-header";
    const title = document.createElement("div");
    title.className = "job-title";
    title.textContent = `${entry.title || "(Untitled role)"} at ${entry.company || "(Company)"}`;
    header.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "job-actions";
    const upBtn = document.createElement("button");
    upBtn.className = "btn";
    upBtn.textContent = "Up";
    upBtn.disabled = idx === 0;
    upBtn.addEventListener("click", async () => {
      await agMoveWorkEntry(entry.id, -1);
      renderWorkHistory();
    });
    const downBtn = document.createElement("button");
    downBtn.className = "btn";
    downBtn.textContent = "Down";
    downBtn.disabled = idx === entries.length - 1;
    downBtn.addEventListener("click", async () => {
      await agMoveWorkEntry(entry.id, 1);
      renderWorkHistory();
    });
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-warn";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      if (!confirm(`Remove ${entry.title || "this job"} at ${entry.company || "this company"}?`)) return;
      await agRemoveWorkEntry(entry.id);
      renderWorkHistory();
    });
    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(delBtn);
    header.appendChild(actions);
    card.appendChild(header);

    const body = document.createElement("div");
    body.className = "job-body";

    const onChange = async (fieldId, value) => {
      await agUpdateWorkEntry(entry.id, { [fieldId]: value });
      title.textContent = fieldId === "title" || fieldId === "company"
        ? (() => {
            const t = fieldId === "title" ? value : entry.title;
            const c = fieldId === "company" ? value : entry.company;
            entry[fieldId] = value;
            return `${t || "(Untitled role)"} at ${c || "(Company)"}`;
          })()
        : title.textContent;
    };

    for (const field of AG_WORK_ENTRY_FIELDS) {
      body.appendChild(jobInput(field, entry, onChange));
    }
    card.appendChild(body);
    list.appendChild(card);
  });
}

document.addEventListener("click", async (e) => {
  if (e.target?.id === "addJobBtn") {
    await agAddWorkEntry({ is_current: false });
    renderWorkHistory();
  }
});

async function renderResume() {
  const status = $("#resumeStatus");
  const meta = await agLoadResumeMeta();
  if (!meta) {
    status.innerHTML = `<p class="panel-help">No resume uploaded yet.</p>`;
    $("#resumeClearBtn").disabled = true;
    return;
  }
  const kb = Math.round(meta.size / 1024);
  const date = new Date(meta.uploadedAt).toLocaleDateString();
  status.innerHTML = `
    <div class="resume-card">
      <div class="resume-filename">${meta.filename}</div>
      <div class="resume-meta">${kb} KB . ${meta.type || "file"} . uploaded ${date}</div>
    </div>
  `;
  $("#resumeClearBtn").disabled = false;
}

async function renderDomains() {
  const builtinList = $("#builtinDomainList");
  builtinList.innerHTML = "";
  for (const [host, adapter] of Object.entries(AG_KNOWN_CUSTOM_DOMAINS)) {
    const row = document.createElement("div");
    row.className = "domain-row";
    row.innerHTML = `<span class="domain-host">${host}</span><span class="domain-adapter">${adapter}</span>`;
    builtinList.appendChild(row);
  }

  const userList = $("#userDomainList");
  userList.innerHTML = "";
  const stored = await agLoadCustomDomains();
  const entries = Object.entries(stored);
  if (entries.length === 0) {
    userList.innerHTML = `<p class="panel-help">No custom domains added yet.</p>`;
    return;
  }
  for (const [host, adapter] of entries) {
    const row = document.createElement("div");
    row.className = "domain-row";
    row.innerHTML = `<span class="domain-host">${host}</span><span class="domain-adapter">${adapter}</span>`;
    const rm = document.createElement("button");
    rm.className = "btn btn-warn";
    rm.textContent = "Remove";
    rm.addEventListener("click", async () => {
      await agRemoveCustomDomain(host);
      try { await chrome.permissions.remove({ origins: [`*://${host}/*`] }); } catch (e) {}
      renderDomains();
    });
    row.appendChild(rm);
    userList.appendChild(row);
  }
}

$("#addDomainForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const host = $("#domainHost").value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!host || !host.includes(".")) {
    alert("Enter a hostname like careers.example.com");
    return;
  }
  const adapter = $("#domainAdapter").value;
  try {
    const granted = await chrome.permissions.request({ origins: [`*://${host}/*`] });
    if (!granted) {
      alert("Permission was not granted. Autograph cannot read this domain without it.");
      return;
    }
  } catch (err) {
    alert("Could not request permission: " + err.message);
    return;
  }
  await agAddCustomDomain(host, adapter);
  $("#domainHost").value = "";
  renderDomains();
});

function switchTab(name) {
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  $$(".panel").forEach(p => p.classList.toggle("active", p.id === `tab-${name}`));
  if (name === "sites") renderSites();
  if (name === "data") renderCaptured();
  if (name === "resume") renderResume();
  if (name === "domains") renderDomains();
  if (name === "experience") renderWorkHistory();
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

$("#resumeUploadBtn").addEventListener("click", () => $("#resumeFileInput").click());
$("#resumeFileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const MAX = 4 * 1024 * 1024;
  if (file.size > MAX) {
    alert("File is over 4 MB. Most resumes are well under 1 MB. Please trim or compress your PDF.");
    return;
  }
  await agSaveResume(file);
  e.target.value = "";
  renderResume();
});

$("#resumeClearBtn").addEventListener("click", async () => {
  if (!confirm("Remove the stored resume?")) return;
  await agClearResume();
  renderResume();
});

renderProfile();
