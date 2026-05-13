const form = document.getElementById("wizard");

(async () => {
  const profile = await agLoadProfile();
  for (const input of form.querySelectorAll("[data-field]")) {
    const fid = input.dataset.field;
    if (profile[fid]) input.value = profile[fid];
  }
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const updates = {};
  for (const input of form.querySelectorAll("[data-field]")) {
    updates[input.dataset.field] = input.value.trim();
  }
  for (const [k, v] of Object.entries(updates)) {
    if (v) await agUpdateProfileField(k, v);
  }
  chrome.runtime.openOptionsPage();
});

document.getElementById("skipBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
