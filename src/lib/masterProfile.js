const AG_PROFILE_SECTIONS = [
  { id: "about", label: "About You" },
  { id: "experience", label: "Work Experience" },
  { id: "education", label: "Education" },
  { id: "employment", label: "Employment Questions" },
  { id: "demographic", label: "Demographic Questions" }
];

const AG_MONTH_OPTIONS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const AG_LINKEDIN_RE = /\blinkedin\.com\/(?:in|pub|profile)\/[^\s/?#]+/i;

const AG_PROFILE_FIELDS = [
  { id: "first_name", label: "First Name", type: "text", section: "about" },
  { id: "last_name", label: "Last Name", type: "text", section: "about" },
  { id: "email", label: "Email", type: "email", section: "about" },
  { id: "phone_type", label: "Phone Type", type: "text", section: "about" },
  { id: "phone_number", label: "Phone Number", type: "tel", section: "about" },
  { id: "phone_country", label: "Phone Country", type: "text", section: "about" },
  { id: "address_line_1", label: "Address Line 1", type: "text", section: "about" },
  { id: "city", label: "City", type: "text", section: "about" },
  { id: "state_province", label: "State / Province", type: "text", section: "about" },
  { id: "zip_postal", label: "Zip / Postal", type: "text", section: "about" },
  { id: "country", label: "Country", type: "text", section: "about" },
  { id: "linkedin_profile", label: "LinkedIn Profile", type: "url", section: "about", validate: v => AG_LINKEDIN_RE.test(v) },
  { id: "website", label: "Personal Website / Portfolio", type: "url", section: "about" },
  { id: "github_profile", label: "GitHub Profile", type: "url", section: "about" },
  { id: "twitter_profile", label: "Twitter / X Profile", type: "url", section: "about" },
  { id: "current_company", label: "Current Company", type: "text", section: "experience" },
  { id: "current_title", label: "Current Title", type: "text", section: "experience" },
  { id: "years_experience", label: "Total Years of Experience", type: "text", section: "experience" },
  { id: "education_school", label: "School", type: "text", section: "education" },
  { id: "education_degree", label: "Degree", type: "text", section: "education" },
  { id: "education_major", label: "Major / Field of Study", type: "text", section: "education" },
  { id: "education_end_month", label: "End Date Month", type: "select", section: "education", options: AG_MONTH_OPTIONS },
  { id: "education_end_year", label: "End Date Year", type: "text", section: "education" },
  { id: "work_authorization", label: "Authorized to work?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "need_sponsorship", label: "Need sponsorship?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "willing_to_relocate", label: "Willing to relocate?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "bound_by_noncompete", label: "Bound by non-compete?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "is_veteran", label: "Veteran status", type: "select", section: "demographic", options: ["", "Yes", "No", "Prefer Not To Answer"] },
  { id: "have_disability", label: "Disability status", type: "select", section: "demographic", options: ["", "Yes", "No", "Prefer Not To Answer"] }
];

const AG_PROFILE_IDS = new Set(AG_PROFILE_FIELDS.map(f => f.id));
const AG_PROFILE_BY_ID = Object.fromEntries(AG_PROFILE_FIELDS.map(f => [f.id, f]));
const AG_PROFILE_OVERRIDABLE_ON_CAPTURE = new Set(
  AG_PROFILE_FIELDS.filter(f => f.section === "about").map(f => f.id)
);

async function agLoadProfile() {
  const data = await chrome.storage.sync.get("masterProfile");
  return data.masterProfile || {};
}

async function agSaveProfile(profile) {
  const clean = {};
  for (const key of Object.keys(profile)) {
    if (!AG_PROFILE_IDS.has(key)) continue;
    const val = profile[key];
    if (val == null || val === "") continue;
    clean[key] = String(val).trim();
  }
  await chrome.storage.sync.set({ masterProfile: clean });
}

let _agProfileWriteChain = Promise.resolve();

async function agUpdateProfileField(fieldId, value) {
  if (!AG_PROFILE_IDS.has(fieldId)) return { ok: false, reason: "unknown" };
  const trimmed = String(value ?? "").trim();
  if (trimmed) {
    const def = AG_PROFILE_BY_ID[fieldId];
    if (def?.validate && !def.validate(trimmed)) return { ok: false, reason: "invalid" };
  }
  const run = async () => {
    const profile = await agLoadProfile();
    if (trimmed) profile[fieldId] = trimmed;
    else delete profile[fieldId];
    await chrome.storage.sync.set({ masterProfile: profile });
  };
  const next = _agProfileWriteChain.then(run, run);
  _agProfileWriteChain = next.catch(() => {});
  await next;
  return { ok: true };
}

function agStripOppositeName(fieldId, value, profile) {
  const oppositeId = fieldId === "first_name" ? "last_name" : "first_name";
  const opposite = profile[oppositeId];
  if (!opposite) return value;
  const escaped = String(opposite).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = fieldId === "first_name"
    ? new RegExp("\\s+" + escaped + "\\s*$", "i")
    : new RegExp("^\\s*" + escaped + "\\s+", "i");
  return re.test(value) ? value.replace(re, "").trim() : value;
}

async function agCaptureToProfile(fieldId, rawValue) {
  if (!AG_PROFILE_IDS.has(fieldId)) return false;
  let value = String(rawValue).trim();
  if (!value) return false;
  const normalizer = (typeof AG_VALUE_NORMALIZERS !== "undefined") ? AG_VALUE_NORMALIZERS[fieldId] : null;
  if (normalizer) {
    const normalized = normalizer(value);
    if (!normalized) return false;
    value = normalized;
  }
  const def = AG_PROFILE_BY_ID[fieldId];
  if (def?.validate && !def.validate(value)) return false;
  const profile = await agLoadProfile();
  if (fieldId === "first_name" || fieldId === "last_name") {
    value = agStripOppositeName(fieldId, value, profile);
    if (!value) return false;
  }
  if (profile[fieldId] && !AG_PROFILE_OVERRIDABLE_ON_CAPTURE.has(fieldId)) return false;
  if (profile[fieldId] === value) return false;
  profile[fieldId] = value;
  await chrome.storage.sync.set({ masterProfile: profile });
  return true;
}

async function agGetProfileCompletion() {
  const profile = await agLoadProfile();
  const total = AG_PROFILE_FIELDS.length;
  const filled = AG_PROFILE_FIELDS.filter(f => !!profile[f.id]).length;
  return { filled, total, percent: Math.round((filled / total) * 100) };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AG_PROFILE_SECTIONS,
    AG_PROFILE_FIELDS,
    AG_PROFILE_IDS,
    AG_PROFILE_BY_ID,
    AG_LINKEDIN_RE,
    agLoadProfile,
    agSaveProfile,
    agUpdateProfileField,
    agCaptureToProfile,
    agGetProfileCompletion
  };
}
