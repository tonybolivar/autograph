var AG_SUPPORTED_SITES = [
  { id: "workday", name: "Workday", hostMatch: ".myworkdayjobs.com", adapter: "workday" },
  { id: "greenhouse", name: "Greenhouse", hostMatch: ".greenhouse.io", adapter: "greenhouse" },
  { id: "eightfold", name: "Eightfold", hostMatch: ".eightfold.ai", adapter: "eightfold" },
  { id: "lever", name: "Lever", hostMatch: "jobs.lever.co", adapter: "lever" },
  { id: "ashby", name: "Ashby", hostMatch: "jobs.ashbyhq.com", adapter: "ashby" },
  { id: "smartrecruiters", name: "SmartRecruiters", hostMatch: ".smartrecruiters.com", adapter: "smartrecruiters" },
  { id: "smartr_me", name: "SmartRecruiters (smartr.me)", hostMatch: "smartr.me", adapter: "smartrecruiters" },
  { id: "oracle", name: "Oracle HCM", hostMatch: ".oraclecloud.com", adapter: "oracle" },
  { id: "icims", name: "iCIMS", hostMatch: ".icims.com", adapter: "icims" },
  { id: "successfactors", name: "SuccessFactors", hostMatch: ".successfactors.", adapter: "successfactors" },
  { id: "bamboohr", name: "BambooHR", hostMatch: ".bamboohr.com", adapter: "bamboohr" },
  { id: "breezyhr", name: "BreezyHR", hostMatch: ".breezy.hr", adapter: "breezyhr" },
  { id: "bullhorn", name: "Bullhorn", hostMatch: "bullhornstaffing.com", adapter: "bullhorn" },
  { id: "jobvite", name: "Jobvite", hostMatch: ".jobvite.com", adapter: "jobvite" },
  { id: "loxo", name: "Loxo", hostMatch: ".loxo.co", adapter: "loxo" },
  { id: "paylocity", name: "Paylocity", hostMatch: "recruiting.paylocity.com", adapter: "paylocity" },
  { id: "recruitee", name: "Recruitee", hostMatch: ".recruitee.com", adapter: "recruitee" },
  { id: "rippling", name: "Rippling", hostMatch: ".rippling.com", adapter: "rippling" },
  { id: "teamtailor", name: "TeamTailor", hostMatch: ".teamtailor.com", adapter: "teamtailor" },
  { id: "ukg", name: "UKG", hostMatch: "recruiting.ultipro.com", adapter: "ukg" },
  { id: "gem", name: "Gem", hostMatch: "jobs.gem.com", adapter: "gem" },
  { id: "phenom", name: "Phenom", hostMatch: null, adapter: "phenom" }
];

function agFindSiteForHost(hostname) {
  for (const site of AG_SUPPORTED_SITES) {
    if (!site.hostMatch) continue;
    if (hostname.endsWith(site.hostMatch) || hostname.includes(site.hostMatch)) return site;
  }
  return null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { AG_SUPPORTED_SITES, agFindSiteForHost };
}
