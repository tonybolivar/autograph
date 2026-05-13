var AG_PROFILE_SECTIONS = [
  { id: "about", label: "About You" },
  { id: "experience", label: "Work Experience" },
  { id: "education", label: "Education" },
  { id: "employment", label: "Employment Questions" },
  { id: "logistics", label: "Logistics & Availability" },
  { id: "preferences", label: "Job Preferences" },
  { id: "writing", label: "Writing Samples" },
  { id: "demographic", label: "Demographic Questions" }
];

var AG_MONTH_OPTIONS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var AG_LINKEDIN_RE = /\blinkedin\.com\/(?:in|pub|profile)\/[^\s/?#]+/i;

var AG_PROFILE_FIELDS = [
  { id: "first_name", label: "First Name", type: "text", section: "about" },
  { id: "last_name", label: "Last Name", type: "text", section: "about" },
  { id: "email", label: "Email", type: "email", section: "about" },
  { id: "phone_type", label: "Phone Type", type: "text", section: "about" },
  { id: "phone_number", label: "Phone Number", type: "tel", section: "about" },
  { id: "phone_country", label: "Phone Country", type: "text", section: "about" },
  { id: "phone_extension", label: "Phone Extension", type: "text", section: "about" },
  { id: "address_line_1", label: "Address Line 1", type: "text", section: "about" },
  { id: "city", label: "City", type: "text", section: "about" },
  { id: "state_province", label: "State / Province", type: "text", section: "about" },
  { id: "zip_postal", label: "Zip / Postal", type: "text", section: "about" },
  { id: "country", label: "Country", type: "text", section: "about" },
  { id: "linkedin_profile", label: "LinkedIn Profile", type: "url", section: "about", validate: v => AG_LINKEDIN_RE.test(v) },
  { id: "website", label: "Personal Website / Portfolio", type: "url", section: "about" },
  { id: "github_profile", label: "GitHub Profile", type: "url", section: "about" },
  { id: "twitter_profile", label: "Twitter / X Profile", type: "url", section: "about" },
  { id: "personal_pronouns", label: "Pronouns", type: "text", section: "about" },
  { id: "preferred_name", label: "Preferred Name", type: "text", section: "about" },
  { id: "address_line_2", label: "Address Line 2", type: "text", section: "about" },
  { id: "account_email", label: "Account Email (for ATS account signups)", type: "email", section: "about" },
  { id: "account_password", label: "Account Password (for ATS account signups)", type: "password", section: "about" },
  { id: "current_company", label: "Current Company", type: "text", section: "experience" },
  { id: "current_title", label: "Current Title", type: "text", section: "experience" },
  { id: "years_experience", label: "Total Years of Experience", type: "text", section: "experience" },
  { id: "desired_salary", label: "Desired Salary", type: "text", section: "experience" },
  { id: "salary_currency", label: "Salary Currency", type: "text", section: "experience" },
  { id: "salary_min", label: "Minimum Salary", type: "text", section: "experience" },
  { id: "salary_max", label: "Maximum Salary", type: "text", section: "experience" },
  { id: "salary_period", label: "Salary Period (yearly / hourly)", type: "text", section: "experience" },
  { id: "current_salary", label: "Current Salary", type: "text", section: "experience" },
  { id: "hourly_rate", label: "Hourly Rate", type: "text", section: "experience" },
  { id: "skills_summary", label: "Skills (comma-separated)", type: "text", section: "experience" },
  { id: "primary_skills", label: "Primary Skills / Technologies", type: "text", section: "experience" },
  { id: "management_experience", label: "Management Experience (years)", type: "text", section: "experience" },
  { id: "education_school", label: "School", type: "text", section: "education" },
  { id: "education_degree", label: "Degree", type: "text", section: "education" },
  { id: "education_major", label: "Major / Field of Study", type: "text", section: "education" },
  { id: "education_end_month", label: "End Date Month", type: "select", section: "education", options: AG_MONTH_OPTIONS },
  { id: "education_end_year", label: "End Date Year", type: "text", section: "education" },
  { id: "education_gpa", label: "GPA", type: "text", section: "education" },
  { id: "education_start_year", label: "Education Start Year", type: "text", section: "education" },
  { id: "education_graduated", label: "Graduated?", type: "select", section: "education", options: ["", "Yes", "No"] },

  { id: "earliest_start_date", label: "Earliest Start Date", type: "text", section: "logistics" },
  { id: "notice_period_weeks", label: "Notice Period (weeks)", type: "text", section: "logistics" },
  { id: "preferred_timezone", label: "Preferred Timezone", type: "text", section: "logistics" },
  { id: "hours_per_week", label: "Hours per Week (availability)", type: "text", section: "logistics" },
  { id: "available_start_dates", label: "Available Start Date Notes", type: "textarea", section: "logistics" },
  { id: "currently_employed", label: "Currently Employed?", type: "select", section: "logistics", options: ["", "Yes", "No"] },
  { id: "in_notice_period", label: "Currently in Notice Period?", type: "select", section: "logistics", options: ["", "Yes", "No"] },
  { id: "previously_employed_here", label: "Previously Employed at This Company?", type: "select", section: "logistics", options: ["", "Yes", "No"] },
  { id: "age_over_18", label: "Are you 18 or older?", type: "select", section: "logistics", options: ["", "Yes", "No"] },
  { id: "languages_spoken", label: "Languages Spoken", type: "text", section: "logistics" },
  { id: "driving_license", label: "Valid Driving License?", type: "select", section: "logistics", options: ["", "Yes", "No"] },

  { id: "open_to_remote", label: "Open to Remote?", type: "select", section: "preferences", options: ["", "Yes", "No", "Hybrid only"] },
  { id: "open_to_hybrid", label: "Open to Hybrid?", type: "select", section: "preferences", options: ["", "Yes", "No"] },
  { id: "open_to_onsite", label: "Open to Onsite?", type: "select", section: "preferences", options: ["", "Yes", "No"] },
  { id: "preferred_work_location", label: "Preferred Work Location", type: "text", section: "preferences" },
  { id: "preferred_work_arrangement", label: "Preferred Work Arrangement", type: "text", section: "preferences" },
  { id: "open_to_contract", label: "Open to Contract Work?", type: "select", section: "preferences", options: ["", "Yes", "No"] },
  { id: "open_to_part_time", label: "Open to Part-Time?", type: "select", section: "preferences", options: ["", "Yes", "No"] },
  { id: "referral_source", label: "How Did You Hear About Us?", type: "text", section: "preferences" },
  { id: "referred_by", label: "Referred By (Name)", type: "text", section: "preferences" },

  { id: "why_this_company", label: "Why this company?", type: "textarea", section: "writing" },
  { id: "why_this_role", label: "Why this role?", type: "textarea", section: "writing" },
  { id: "cover_letter", label: "Cover Letter (default)", type: "textarea", section: "writing" },
  { id: "bio_summary", label: "Short Bio / Summary", type: "textarea", section: "writing" },
  { id: "additional_information", label: "Additional Information", type: "textarea", section: "writing" },

  { id: "work_authorization", label: "Authorized to work?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "need_sponsorship", label: "Need sponsorship?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "willing_to_relocate", label: "Willing to relocate?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "bound_by_noncompete", label: "Bound by non-compete?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "us_citizen", label: "US Citizen?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "permanent_resident", label: "Permanent Resident?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "current_visa_type", label: "Current Visa Type (if any)", type: "text", section: "employment" },
  { id: "felony_conviction", label: "Felony Conviction?", type: "select", section: "employment", options: ["", "Yes", "No", "Prefer Not To Answer"] },
  { id: "background_check_consent", label: "Consent to Background Check?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "drug_test_consent", label: "Consent to Drug Test?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "security_clearance", label: "Active Security Clearance?", type: "select", section: "employment", options: ["", "Yes", "No"] },
  { id: "security_clearance_level", label: "Security Clearance Level", type: "text", section: "employment" },
  { id: "is_veteran", label: "Veteran status", type: "select", section: "demographic", options: ["", "Yes", "No", "Prefer Not To Answer"] },
  { id: "have_disability", label: "Disability status", type: "select", section: "demographic", options: ["", "Yes", "No", "Prefer Not To Answer"] },
  { id: "gender", label: "Gender", type: "select", section: "demographic", options: ["", "Male", "Female", "Non-binary", "Prefer Not To Answer"] },
  { id: "hispanic_ethnicity", label: "Hispanic or Latino?", type: "select", section: "demographic", options: ["", "Yes", "No", "Prefer Not To Answer"] },
  { id: "race", label: "Race / Ethnicity", type: "select", section: "demographic", options: ["", "White", "Black or African American", "Hispanic or Latino", "Asian", "Native Hawaiian or Other Pacific Islander", "American Indian or Alaska Native", "Two or More Races", "Prefer Not To Answer"] },
  { id: "lgbtq_identity", label: "LGBTQ+ Self-Identification", type: "select", section: "demographic", options: ["", "Yes", "No", "Prefer Not To Answer"] },
  { id: "transgender_status", label: "Transgender Self-Identification", type: "select", section: "demographic", options: ["", "Yes", "No", "Prefer Not To Answer"] }
];

var AG_PROFILE_IDS = new Set(AG_PROFILE_FIELDS.map(f => f.id));
var AG_PROFILE_BY_ID = Object.fromEntries(AG_PROFILE_FIELDS.map(f => [f.id, f]));
var AG_PROFILE_OVERRIDABLE_ON_CAPTURE = new Set(
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
