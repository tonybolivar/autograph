var AG_LABEL_ALIASES = [
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
  [["pronouns", "personal_pronouns", "preferred_pronouns", "your pronouns", "what pronouns"], "personal_pronouns"],
  [["preferred_name", "preferred name", "nickname", "what should we call you", "go by"], "preferred_name"],
  [["address_line_2", "address line 2", "address2", "apt", "apartment", "unit", "suite"], "address_line_2"],
  [["current_company", "current company", "current employer", "present employer", "currentcompany"], "current_company"],
  [["current_title", "current title", "current position", "job title", "current job title", "current_position", "title", "position", "current role"], "current_title"],
  [["years_experience", "years of experience", "years experience", "total years of experience", "yearsofexperience", "professional experience years", "experience years", "how many years", "industry experience", "years of industry experience", "years of relevant experience", "year experience", "yoe"], "years_experience"],
  [["desired_salary", "desired salary", "salary expectation", "expected salary", "salary expectations", "compensation expectation", "expected compensation", "annual salary"], "desired_salary"],
  [["salary_currency", "currency", "salarycurrency", "compensation currency"], "salary_currency"],
  [["salary_min", "minimum salary", "min salary", "salary range min", "min compensation"], "salary_min"],
  [["salary_max", "maximum salary", "max salary", "salary range max", "max compensation"], "salary_max"],
  [["salary_period", "annual or hourly", "salary period", "hourly or salary"], "salary_period"],
  [["current_salary", "present salary", "current compensation", "current pay"], "current_salary"],
  [["hourly_rate", "hourly rate", "rate per hour", "billing rate"], "hourly_rate"],
  [["skills", "skills_summary", "key skills", "technical skills", "skill set"], "skills_summary"],
  [["primary_skills", "primary skill", "main skills", "core skills", "technologies", "stack"], "primary_skills"],
  [["management_experience", "management experience", "years managing", "people management"], "management_experience"],
  [["earliest_start_date", "earliest start date", "start date", "available start", "when can you start", "earliest start"], "earliest_start_date"],
  [["notice_period_weeks", "notice period", "notice", "weeks notice"], "notice_period_weeks"],
  [["preferred_timezone", "timezone", "time zone", "your timezone", "preferred time zone"], "preferred_timezone"],
  [["hours_per_week", "hours per week", "weekly hours", "available hours"], "hours_per_week"],
  [["available_start_dates", "available start dates", "availability notes"], "available_start_dates"],
  [["currently_employed", "currently employed", "are you employed", "employed at this time"], "currently_employed"],
  [["in_notice_period", "in notice period", "currently in notice", "on notice"], "in_notice_period"],
  [["previously_employed_here", "previously employed", "worked here before", "former employee", "have you ever worked", "ever worked"], "previously_employed_here"],
  [["open_to_remote", "open to remote", "remote work", "willing to work remotely", "remote okay"], "open_to_remote"],
  [["open_to_hybrid", "open to hybrid", "hybrid work", "hybrid okay"], "open_to_hybrid"],
  [["open_to_onsite", "open to onsite", "onsite work", "in office", "office work"], "open_to_onsite"],
  [["preferred_work_location", "preferred work location", "preferred location", "work location"], "preferred_work_location"],
  [["preferred_work_arrangement", "preferred arrangement", "work arrangement"], "preferred_work_arrangement"],
  [["open_to_contract", "open to contract", "contract work", "contractor"], "open_to_contract"],
  [["open_to_part_time", "open to part-time", "part time", "part-time okay"], "open_to_part_time"],
  [["referral_source", "how did you hear about us", "how did you hear", "hear about this", "where did you hear", "source"], "referral_source"],
  [["referred_by", "referred by", "referrer", "who referred you", "employee referral name"], "referred_by"],
  [["why_this_company", "why this company", "why our company", "why are you interested in our company"], "why_this_company"],
  [["why_this_role", "why this role", "why this position", "why are you interested", "interest in this role", "motivation"], "why_this_role"],
  [["cover_letter", "cover letter", "letter of interest"], "cover_letter"],
  [["bio_summary", "summary", "brief bio", "about you", "your background", "personal statement"], "bio_summary"],
  [["additional_information", "additional information", "anything else", "other information", "additional comments", "additional notes"], "additional_information"],
  [["us_citizen", "us citizen", "u.s. citizen", "are you a u.s. citizen", "are you a us citizen"], "us_citizen"],
  [["permanent_resident", "permanent resident", "lawful permanent resident", "green card"], "permanent_resident"],
  [["current_visa_type", "visa type", "visa status", "current visa"], "current_visa_type"],
  [["felony_conviction", "felony", "felony conviction", "ever been convicted", "criminal history"], "felony_conviction"],
  [["background_check_consent", "background check", "consent to background check", "agree to background"], "background_check_consent"],
  [["drug_test_consent", "drug test", "consent to drug test", "agree to drug"], "drug_test_consent"],
  [["security_clearance", "security clearance", "active clearance"], "security_clearance"],
  [["security_clearance_level", "clearance level", "level of clearance"], "security_clearance_level"],
  [["education_gpa", "gpa", "grade point average"], "education_gpa"],
  [["education_start_year", "education start year", "start year of education"], "education_start_year"],
  [["education_graduated", "graduated", "did you graduate"], "education_graduated"],
  [["address_line_1", "address", "full address", "street address", "current address", "mailing address", "home address"], "address_line_1"],
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
  [["have_disability", "disability", "disability status", "disability-status", "disabled", "disability_status", "disabilitystatus", "do you have a disability", "have a disability", "disability_heading"], "have_disability"],
  [["gender", "gender identity", "what is your gender", "your gender", "eeoc_gender"], "gender"],
  [["hispanic_ethnicity", "hispanic", "latino", "hispanic or latino", "are you hispanic or latino", "hispanic_latino"], "hispanic_ethnicity"],
  [["race", "ethnicity", "race / ethnicity", "race/ethnicity", "race or ethnicity", "ethnic background", "race_ethnicity", "eeoc_race"], "race"]
];

var AG_DEMOGRAPHIC_TOKENS = [
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

  const AG_SHORT_ALIAS_SKIP = new Set(["name", "title", "position", "city", "country", "state", "company", "phone", "tel", "email", "url"]);

  for (const [aliases, target] of AG_LABEL_ALIASES) {
    for (const alias of aliases) {
      if (alias.length < 3) continue;
      if (AG_SHORT_ALIAS_SKIP.has(alias)) continue;
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
