var AG_PHONE_TYPE_FALLBACKS = ["Mobile", "Cell", "Personal", "Home"];

var AG_US_STATES = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH",
  oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
  "district of columbia": "DC"
};

var AG_YES_NO_NORMALIZER = (raw) => {
  const t = String(raw).toLowerCase();
  if (/\byes\b/.test(t)) return "Yes";
  if (/\bno\b/.test(t)) return "No";
  return null;
};

var AG_DECLINE_NORMALIZER = (raw) => {
  const t = String(raw).toLowerCase();
  if (/\bprefer\s+not\b|\bdecline\b|\bdo not wish\b|\bchoose not\b|\bopt[-\s]?out\b/.test(t)) return "Prefer Not To Answer";
  return null;
};

var AG_VALUE_NORMALIZERS = {
  work_authorization: AG_YES_NO_NORMALIZER,
  need_sponsorship: AG_YES_NO_NORMALIZER,
  bound_by_noncompete: AG_YES_NO_NORMALIZER,
  willing_to_relocate: (raw) => {
    const t = String(raw).toLowerCase();
    if (/\byes\b|\bwilling\b|\bopen to\b/.test(t)) return "Yes";
    if (/\bno\b|\bnot willing\b|\bunable\b/.test(t)) return "No";
    return null;
  },
  is_veteran: (raw) => {
    const t = String(raw).toLowerCase();
    const decline = AG_DECLINE_NORMALIZER(raw);
    if (decline) return decline;
    if (/\bnot\b.*\bveteran\b|\bnot\s+a\s+veteran\b/.test(t)) return "No";
    if (/\bveteran\b|\byes\b/.test(t)) return "Yes";
    if (/\bno\b/.test(t)) return "No";
    return null;
  },
  have_disability: (raw) => {
    const t = String(raw).toLowerCase();
    const decline = AG_DECLINE_NORMALIZER(raw);
    if (decline) return decline;
    if (/\bdo not\b.*\bdisability\b|\bno\b/.test(t) && !/\byes\b/.test(t)) return "No";
    if (/\bhave\b.*\bdisability\b|\byes\b/.test(t)) return "Yes";
    return null;
  }
};

var AG_VALUE_DENORMALIZERS = {
  is_veteran: (canonical) => {
    switch (canonical) {
      case "Yes": return [
        "I am a veteran",
        "I identify as one or more of the classifications of protected veterans",
        "I identify as one or more of the classifications of protected veterans listed above.",
        "Protected veteran",
        "Yes"
      ];
      case "No": return [
        "I am not a veteran",
        "I am not a protected veteran",
        "Not a veteran",
        "No"
      ];
      case "Prefer Not To Answer": return [
        "I do not wish to self-identify",
        "Decline to self-identify",
        "Prefer Not To Answer",
        "Decline"
      ];
      default: return [canonical];
    }
  },
  have_disability: (canonical) => {
    switch (canonical) {
      case "Yes": return [
        "Yes, I have a disability, or have had one in the past",
        "Yes, I have a disability",
        "I have a disability",
        "Yes"
      ];
      case "No": return [
        "No, I do not have a disability and have not had one in the past",
        "No, I do not have a disability",
        "I do not have a disability",
        "No"
      ];
      case "Prefer Not To Answer": return [
        "I do not want to answer",
        "I do not wish to self-identify",
        "Prefer Not To Answer",
        "Decline"
      ];
      default: return [canonical];
    }
  },
  bound_by_noncompete: (canonical) => {
    switch (canonical) {
      case "Yes": return [
        "Yes, I am subject to a non-compete or non-solicitation agreement",
        "Yes, I am subject to a non-compete",
        "Yes"
      ];
      case "No": return [
        "No, I am not subject to a non-compete or non-solicitation agreement",
        "No, I am not subject to a non-compete",
        "No"
      ];
      default: return [canonical];
    }
  },
  phone_type: (canonical) => {
    if (!canonical) return AG_PHONE_TYPE_FALLBACKS.slice();
    const lower = canonical.toLowerCase();
    return [canonical, ...AG_PHONE_TYPE_FALLBACKS.filter(t => t.toLowerCase() !== lower)];
  },
  personal_pronouns: (canonical) => {
    if (!canonical) return [];
    const raw = String(canonical).toLowerCase().trim();
    const variants = new Set([canonical, raw]);
    if (/\bhe\b|\bhim\b|^he\/him\b/.test(raw)) {
      variants.add("He/him"); variants.add("He/Him"); variants.add("he/him"); variants.add("He"); variants.add("Him");
    }
    if (/\bshe\b|\bher\b|^she\/her\b/.test(raw)) {
      variants.add("She/her"); variants.add("She/Her"); variants.add("she/her"); variants.add("She"); variants.add("Her");
    }
    if (/\bthey\b|\bthem\b|they\/them/.test(raw)) {
      variants.add("They/them"); variants.add("They/Them"); variants.add("they/them"); variants.add("They"); variants.add("Them");
    }
    if (/\bxe\b|\bxem\b/.test(raw)) { variants.add("Xe/xem"); variants.add("Xe"); }
    if (/\bze\b|\bhir\b/.test(raw)) { variants.add("Ze/hir"); variants.add("Ze"); }
    return Array.from(variants);
  },
  gender: (canonical) => {
    switch (canonical) {
      case "Male": return ["Male", "Man", "M", "male"];
      case "Female": return ["Female", "Woman", "F", "female"];
      case "Non-binary": return ["Non-binary", "Nonbinary", "Non binary", "Gender non-conforming", "Other"];
      case "Prefer Not To Answer": return ["Decline to self-identify", "Prefer Not To Answer", "I do not wish to self-identify", "Do not wish to identify", "Decline"];
      default: return [canonical];
    }
  },
  hispanic_ethnicity: (canonical) => {
    switch (canonical) {
      case "Yes": return ["Yes", "Hispanic or Latino", "Hispanic/Latino", "I am Hispanic or Latino"];
      case "No": return ["No", "Not Hispanic or Latino", "I am not Hispanic or Latino"];
      case "Prefer Not To Answer": return ["Decline to self-identify", "Prefer Not To Answer", "I do not wish to self-identify"];
      default: return [canonical];
    }
  },
  race: (canonical) => {
    switch (canonical) {
      case "White": return [
        "White",
        "White (Not Hispanic or Latino)",
        "White - A person having origins in any of the original peoples of Europe, the Middle East, or North Africa",
        "Caucasian"
      ];
      case "Black or African American": return [
        "Black or African American",
        "Black or African American (Not Hispanic or Latino)",
        "Black",
        "African American"
      ];
      case "Hispanic or Latino": return [
        "Hispanic or Latino",
        "Hispanic/Latino",
        "Hispanic or Latino - A person of Cuban, Mexican, Puerto Rican, South or Central American, or other Spanish culture or origin regardless of race"
      ];
      case "Asian": return [
        "Asian",
        "Asian (Not Hispanic or Latino)"
      ];
      case "Native Hawaiian or Other Pacific Islander": return [
        "Native Hawaiian or Other Pacific Islander",
        "Native Hawaiian or Other Pacific Islander (Not Hispanic or Latino)",
        "Pacific Islander"
      ];
      case "American Indian or Alaska Native": return [
        "American Indian or Alaska Native",
        "American Indian or Alaska Native (Not Hispanic or Latino)",
        "American Indian",
        "Alaska Native"
      ];
      case "Two or More Races": return [
        "Two or More Races",
        "Two or More Races (Not Hispanic or Latino)",
        "Mixed",
        "Multiple"
      ];
      case "Prefer Not To Answer": return ["Decline to self-identify", "Prefer Not To Answer", "I do not wish to self-identify"];
      default: return [canonical];
    }
  },
  state_province: (canonical) => {
    if (!canonical) return [];
    const lower = canonical.toLowerCase();
    const abbr = AG_US_STATES[lower];
    if (abbr) return [canonical, abbr];
    const upper = canonical.toUpperCase();
    for (const [name, code] of Object.entries(AG_US_STATES)) {
      if (code === upper) {
        return [canonical, name.replace(/\b\w/g, c => c.toUpperCase())];
      }
    }
    return [canonical];
  }
};

var AG_DECLINE_OPTION_LABELS = [
  "Decline to self-identify",
  "Decline to Self Identify",
  "Prefer not to answer",
  "Prefer not to disclose",
  "Prefer not to say",
  "I prefer not to answer",
  "I prefer not to disclose",
  "I prefer not to say",
  "I don't wish to disclose",
  "I don't wish to disclose.",
  "I do not wish to disclose",
  "I do not wish to disclose.",
  "I do not wish to answer",
  "I do not want to answer",
  "I choose not to self-identify",
  "I choose not to disclose",
  "I do not wish to self-identify",
  "Not declared",
  "Decline",
  "Do not wish to identify",
  "Opt Out",
  "Choose Not to Disclose",
  "Decline to State"
];

var AG_DECLINE_REGEX = /\bdecline\b|\bprefer not\b|\bdo not wish\b|\bwish to answer\b|\bnot want to answer\b|\bchoose not\b|\bnot declared\b|\bnot to disclose\b|\bnot to (?:self-?)?identify\b|\bopt[-\s]?out\b|\bdon['']?t (?:want|wish)\b/i;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AG_PHONE_TYPE_FALLBACKS,
    AG_US_STATES,
    AG_VALUE_NORMALIZERS,
    AG_VALUE_DENORMALIZERS,
    AG_DECLINE_OPTION_LABELS,
    AG_DECLINE_REGEX
  };
}
