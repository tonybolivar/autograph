async function agSaveResume(file) {
  if (!file) return false;
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  await chrome.storage.local.set({
    resumeFile: {
      base64,
      filename: file.name,
      type: file.type || "application/pdf",
      size: file.size,
      uploadedAt: Date.now()
    }
  });
  return true;
}

async function agLoadResumeMeta() {
  const data = await chrome.storage.local.get("resumeFile");
  if (!data.resumeFile) return null;
  const { filename, type, size, uploadedAt } = data.resumeFile;
  return { filename, type, size, uploadedAt };
}

async function agSynthesizeResumeFile() {
  const data = await chrome.storage.local.get("resumeFile");
  const stored = data.resumeFile;
  if (!stored || !stored.base64) return null;
  const bin = atob(stored.base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], stored.filename, { type: stored.type });
}

async function agClearResume() {
  await chrome.storage.local.remove("resumeFile");
}

var AG_RESUME_LABEL_RE = /(?:^|[^a-zA-Z]|[a-z](?=[A-Z]))(resume|r[ée]sum[ée]|cv|curriculum\s*vitae)|upload\s*(?:your\s*)?(?:resume|r[ée]sum[ée])/i;
var AG_COVER_LETTER_RE = /\bcover\s*letter\b/i;

function agIsResumeFileInput(el) {
  if (el.tagName.toLowerCase() !== "input") return false;
  if ((el.type || "").toLowerCase() !== "file") return false;
  const accept = (el.accept || "").toLowerCase();
  if (accept && !/\.(pdf|doc|docx|txt|rtf)/i.test(accept) && !/application\/(pdf|msword|document)/i.test(accept)) {
    if (!accept.includes("*")) return false;
  }
  const name = (el.name || "").toLowerCase();
  const id = (el.id || "").toLowerCase();
  if (AG_COVER_LETTER_RE.test(name) || AG_COVER_LETTER_RE.test(id)) return false;
  if (AG_RESUME_LABEL_RE.test(name) || AG_RESUME_LABEL_RE.test(id)) return true;
  const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
  if (AG_COVER_LETTER_RE.test(ariaLabel)) return false;
  if (AG_RESUME_LABEL_RE.test(ariaLabel)) return true;
  const labelText = typeof agExtractLabel === "function" ? agExtractLabel(el).toLowerCase() : "";
  if (AG_COVER_LETTER_RE.test(labelText)) return false;
  if (AG_RESUME_LABEL_RE.test(labelText)) return true;
  const wrap = el.closest("[class*='resume'], [class*='Resume'], [class*='cv-'], [data-automation-id*='resume']");
  if (wrap) return true;
  var ancestor = el.parentElement;
  var hops = 0;
  while (ancestor && hops < 4) {
    var ownText = "";
    for (var i = 0; i < ancestor.childNodes.length; i++) {
      var node = ancestor.childNodes[i];
      if (node.nodeType === 3) ownText += node.textContent;
      else if (node.nodeType === 1 && node !== el && !node.contains(el)) {
        ownText += " " + (node.textContent || "");
      }
    }
    ownText = ownText.trim();
    if (ownText && ownText.length < 200) {
      if (AG_COVER_LETTER_RE.test(ownText)) return false;
      if (AG_RESUME_LABEL_RE.test(ownText)) return true;
    }
    ancestor = ancestor.parentElement;
    hops++;
  }
  return false;
}

function agFillFileInput(el, file) {
  try {
    const dt = new DataTransfer();
    dt.items.add(file);
    el.files = dt.files;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  } catch (err) {
    return false;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    agSaveResume,
    agLoadResumeMeta,
    agSynthesizeResumeFile,
    agClearResume,
    agIsResumeFileInput,
    agFillFileInput,
    AG_RESUME_LABEL_RE
  };
}
