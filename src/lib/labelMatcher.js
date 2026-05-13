const AG_LABEL_ALIASES = [
  [["first_name", "first name", "firstname", "given_name", "given name", "fname", "legalname--firstname"], "first_name"],
  [["last_name", "last name", "lastname", "surname", "family_name", "family name", "lname", "legalname--lastname"], "last_name"],
  [["email", "e-mail", "email_address", "emailaddress", "email address"], "email"],
  [["address_line_1", "address line 1", "address1", "address 1", "street_address", "street address", "streetaddress", "addressline1", "addresssection--addressline1", "addressstreet1"], "address_line_1"],
  [["city", "municipality", "town", "town/city", "addresssection--city"], "city"],
  [["state_province", "state / province", "state/province", "state", "province", "region", "county", "addresssection--countryregion"], "state_province"],
  [["zip_postal", "zip / postal", "zip", "postal", "postcode", "zipcode", "zip_code", "zip code", "postal_code", "postal code", "postalcode", "addresssection--postalcode"], "zip_postal"],
  [["country", "country_region", "country/region", "addresssection--country"], "country"],
  [["phone_type", "phone type", "phonetype", "device_type", "device type", "phone--phonetype"], "phone_type"],
  [["phone_number", "phone number", "phonenumber", "phone", "telephone", "tel", "mobile", "cell", "phone--number", "primary phone", "primary telephone", "cell phone", "cell number", "mobile phone", "mobile number", "contact phone", "telephone number"], "phone_number"],
  [["phone_country", "phone country", "phonecountry", "dial code", "country code", "country_code", "phone--country", "phone dial code"], "phone_country"],
  [["linkedin", "linkedin_profile", "linkedin profile", "linkedin url", "linkedin profile url", "linkedin_url", "linkedinurl", "linkedinaccount", "linkedin_link", "linkedin link", "sitelink-1"], "linkedin_profile"],
  [["website", "personal website", "portfolio", "portfolio url", "portfolio website", "personal_website", "your website", "website url", "personal site", "portfolio link", "website_url", "personalwebsite"], "website"],
  [["github", "github_profile", "github profile", "github url", "github_url", "githubprofile", "githuburl", "github username", "github_link", "github link"], "github_profile"],
  [["twitter", "x profile", "twitter profile", "twitter url", "twitter handle", "twitter_url", "twitter_profile", "x_url"], "twitter_profile"],
  [["current_company", "current company", "company", "employer", "current employer", "present employer", "currentcompany"], "current_company"],
  [["current_title", "current title", "current position", "job title", "current job title", "current_position", "title", "position", "current role"], "current_title"],
  [["years_experience", "years of experience", "years experience", "total years of experience", "yearsofexperience", "professional experience years", "experience years"], "years_experience"],
  [["school", "university", "college", "institution", "school name", "university name", "education_school", "education school"], "education_school"],
  [["degree", "degree type", "level of education", "qualification", "education level", "education_degree", "highest degree"], "education_degree"],
  [["major", "field of study", "concentration", "education_major", "subject", "discipline"], "education_major"],
  [["end_month", "end date month", "graduation month", "completion month", "month completed", "month of graduation"], "education_end_month"],
  [["end_year", "end date year", "graduation year", "completion year", "year completed", "year of graduation"], "education_end_year"],
  [["work_authorization", "work authorization", "authorized to work", "legally authorized", "are you authorized", "are you legally authorized", "eligible to work", "authorised to work", "legally entitled", "legally entitled to work", "entitled to work", "right to work", "legal right to work", "permitted to work", "legally permitted", "legally permitted to work", "authorization to work", "legal authorization to work", "work_in_us"], "work_authorization"],
  [["need_sponsorship", "sponsorship", "require sponsorship", "require_sponsorship", "need sponsorship", "visa sponsorship", "immigration sponsorship", "immigration related sponsorship", "employment visa", "work sponsorship", "require work sponsorship", "require visa sponsorship", "will you now or in the future require sponsorship", "require an employment visa", "work permit"], "need_sponsorship"],
  [["willing_to_relocate", "willing to relocate", "relocate", "relocation", "open to relocation", "require relocation"], "willing_to_relocate"],
  [["bound_by_noncompete", "non-compete", "noncompete", "non compete", "bound by non-compete", "non-compete agreement", "subject to any noncompete", "non_disclosure", "non-competition", "non_competition"], "bound_by_noncompete"],
  [["is_veteran", "veteran", "veteran status", "protected veteran", "veteran_status", "veteranstatus", "are you a veteran", "vevraa", "served in the military"], "is_veteran"],
  [["have_disability", "disability", "disability status", "disability-status", "disabled", "disability_status", "disabilitystatus", "do you have a disability", "have a disability", "disability_heading"], "have_disability"]
];

const AG_DEMOGRAPHIC_TOKENS = [
  [["gender", "gender identity", "what is your gender", "your gender"], "gender"],
  [["hispanic", "latino", "hispanic or latino", "are you hispanic or latino", "hispanic_latino", "hispanic_ethnicity"], "hispanic_ethnicity"],
  [["race", "ethnicity", "race / ethnicity", "race/ethnicity", "race or ethnicity", "ethnic background", "race ethnicity", "race_ethnicity"], "race"],
  [["military spouse", "are you a military spouse", "military_spouse"], "military_spouse"],
  [["national guard", "national guard or reserves", "national guard reserves", "national_guard"], "national_guard"],
  [["veteran", "veteran status", "protected veteran", "veteran_status", "veteranstatus", "are you a veteran", "vevraa", "served in the military"], "is_veteran"],
  [["disability", "disability status", "disability-status", "disabled", "disability_status", "disabilitystatus", "do you have a disability", "have a disability", "disability_heading"], "have_disability"]
];

function _agEscapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function agMatchToProfileField(label, fieldId) {
  const lab = (label || "").toLowerCase().trim();
  const fid = (fieldId || "").toLowerCase().trim();
  const labOversized = lab.length > 220;

  for (const [aliases, target] of AG_LABEL_ALIASES) {
    for (const alias of aliases) {
      if (!labOversized && lab === alias) return target;
      if (fid === alias) return target;
    }
  }

  if (!labOversized) {
    const colonIdx = lab.indexOf(": ");
    if (colonIdx !== -1) {
      const after = lab.slice(colonIdx + 2).trim();
      for (const [aliases, target] of AG_LABEL_ALIASES) {
        for (const alias of aliases) {
          if (after === alias) return target;
        }
      }
    }
  }

  const tokenSep = /[\s_\-/]/;
  for (const [aliases, target] of AG_LABEL_ALIASES) {
    for (const alias of aliases) {
      if (!tokenSep.test(alias)) continue;
      const re = new RegExp(`(?:^|[\\s_\\-/])${_agEscapeRegex(alias)}(?:$|[\\s_\\-/:?.!,;])`);
      const labHit = !labOversized && re.test(lab);
      const fidHit = re.test(fid);
      if (labHit || fidHit) {
        if (target === "work_authorization" && _agSubstringMatchesField(labOversized ? "" : lab, fid, "need_sponsorship")) {
          return "need_sponsorship";
        }
        return target;
      }
    }
  }
  return null;
}

function _agSubstringMatchesField(lab, fid, target) {
  for (const [aliases, tgt] of AG_LABEL_ALIASES) {
    if (tgt !== target) continue;
    for (const alias of aliases) {
      const re = new RegExp(`(?:^|[\\s_\\-/])${_agEscapeRegex(alias)}(?:$|[\\s_\\-/:?.!,;])`);
      if (re.test(lab) || re.test(fid)) return true;
    }
    return false;
  }
  return false;
}

function agIsDemographicField(label, fieldId) {
  const lab = (label || "").toLowerCase().trim();
  const fid = (fieldId || "").toLowerCase().trim();
  const labOversized = lab.length > 220;
  for (const [aliases] of AG_DEMOGRAPHIC_TOKENS) {
    for (const alias of aliases) {
      if (!labOversized && lab === alias) return true;
      if (fid === alias) return true;
    }
  }
  const tokenSep = /[\s_\-/]/;
  for (const [aliases] of AG_DEMOGRAPHIC_TOKENS) {
    for (const alias of aliases) {
      const re = new RegExp(`(?:^|[\\s_\\-/])${_agEscapeRegex(alias)}(?:$|[\\s_\\-/:?.!,;])`);
      if ((!labOversized && re.test(lab)) || re.test(fid)) return true;
    }
  }
  return false;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AG_LABEL_ALIASES,
    AG_DEMOGRAPHIC_TOKENS,
    agMatchToProfileField,
    agIsDemographicField
  };
}
