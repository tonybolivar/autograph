const AG_PHONE_TYPE_FALLBACKS = ["Mobile", "Cell", "Personal", "Home"];

const AG_US_STATES = {
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

const AG_YES_NO_NORMALIZER = (raw) => {
  const t = String(raw).toLowerCase();
  if (/\byes\b/.test(t)) return "Yes";
  if (/\bno\b/.test(t)) return "No";
  return null;
};

const AG_DECLINE_NORMALIZER = (raw) => {
  const t = String(raw).toLowerCase();
  if (/\bprefer\s+not\b|\bdecline\b|\bdo not wish\b|\bchoose not\b|\bopt[-\s]?out\b/.test(t)) return "Prefer Not To Answer";
  return null;
};

const AG_VALUE_NORMALIZERS = {
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

const AG_VALUE_DENORMALIZERS = {
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

const AG_DECLINE_OPTION_LABELS = [
  "Decline to self-identify",
  "Decline to Self Identify",
  "Prefer not to answer",
  "I do not wish to answer",
  "I do not want to answer",
  "I choose not to self-identify",
  "I choose not to disclose",
  "I do not wish to self-identify",
  "Not declared",
  "Decline",
  "Do not wish to identify",
  "Opt Out",
  "Decline to State"
];

const AG_DECLINE_REGEX = /\bdecline\b|\bprefer not\b|\bdo not wish\b|\bwish to answer\b|\bnot want to answer\b|\bchoose not\b|\bnot declared\b|\bnot to disclose\b|\bnot to (?:self-?)?identify\b|\bopt[-\s]?out\b|\bdon['']?t (?:want|wish)\b/i;

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
