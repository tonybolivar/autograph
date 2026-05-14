import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');
const OUT = path.resolve(EXT, 'store-assets');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 1280, height: 800 };

const PROFILE = {
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane.doe@example.com',
  phone_number: '(555) 555-0123',
  phone_type: 'Mobile',
  address_line_1: '123 Main St',
  city: 'San Francisco',
  state_province: 'CA',
  zip_postal: '94105',
  country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/janedoe',
  github_profile: 'https://github.com/janedoe',
  website: 'https://janedoe.example.com',
  current_company: 'Acme Corp',
  current_title: 'Software Engineer',
  years_experience: '5',
  work_authorization: 'Yes',
  need_sponsorship: 'No',
  willing_to_relocate: 'Yes',
  personal_pronouns: 'she/her',
  desired_salary: '170000',
  salary_currency: 'USD',
  education_school: 'State University',
  education_degree: 'Bachelor of Science',
  education_major: 'Computer Science',
  education_end_month: 'May',
  education_end_year: '2020',
  is_veteran: 'No',
  have_disability: 'No',
  gender: 'Female',
  race: 'Asian',
  hispanic_ethnicity: 'No',
  referral_source: 'LinkedIn',
};

async function shoot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

async function main() {
  const ctx = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: false,
    viewport: VIEWPORT,
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    ],
  });

  let sw = ctx.serviceWorkers()[0];
  if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
  const extId = sw.url().split('/')[2];
  console.log('extension id:', extId);

  await sw.evaluate(async (profile) => {
    await chrome.storage.sync.set({ masterProfile: profile });
  }, PROFILE);

  const opt = await ctx.newPage();
  await opt.setViewportSize(VIEWPORT);
  await opt.goto(`chrome-extension://${extId}/src/ui/options/options.html`);
  await opt.waitForSelector('#grid-about input', { timeout: 10000 });
  await opt.waitForTimeout(600);
  await shoot(opt, '1-options-about');

  await opt.click('button.tab[data-tab="experience"]');
  await opt.waitForTimeout(400);
  await shoot(opt, '2-options-experience');

  await opt.click('button.tab[data-tab="demographic"]');
  await opt.waitForTimeout(400);
  await shoot(opt, '3-options-demographic');

  const wel = await ctx.newPage();
  await wel.setViewportSize(VIEWPORT);
  await wel.goto(`chrome-extension://${extId}/src/ui/welcome/welcome.html`);
  await wel.waitForLoadState('domcontentloaded');
  await wel.waitForTimeout(500);
  await shoot(wel, '4-welcome');

  const side = await ctx.newPage();
  await side.setViewportSize({ width: 420, height: 800 });
  await side.goto(`chrome-extension://${extId}/src/ui/sidepanel/sidepanel.html`);
  await side.waitForLoadState('domcontentloaded');
  await side.waitForTimeout(500);
  await side.screenshot({ path: path.join(OUT, '5-sidepanel.png') });
  console.log('saved', path.join(OUT, '5-sidepanel.png'));

  await ctx.close();
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
