import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');
const URL_ = process.argv[2];
const WAIT = parseInt(process.argv[3] || '6000', 10);

if (!URL_) { console.error('usage: node probe.mjs <url> [waitMs]'); process.exit(2); }

const PROFILE = {
  first_name: 'Anthony', last_name: 'Bolivar', email: 'tony.e.bolivar@gmail.com',
  phone_number: '(936) 419-2746', phone_type: 'Mobile',
  address_line_1: '123 Main St', city: 'Hamilton', state_province: 'NY', zip_postal: '13346',
  country: 'United States', phone_country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/anthonybolivar',
  github_profile: 'https://github.com/abolivar', website: 'https://anthonybolivar.com',
  work_authorization: 'Yes', need_sponsorship: 'No', willing_to_relocate: 'Yes', bound_by_noncompete: 'No',
  is_veteran: 'No', have_disability: 'No',
  gender: 'Male', race: 'Hispanic or Latino', hispanic_ethnicity: 'Yes',
  current_company: 'Acme Corp', current_title: 'Software Engineer', years_experience: '3',
  desired_salary: '150000', salary_currency: 'USD', personal_pronouns: 'he/him',
  education_school: 'Colgate University', education_degree: 'Bachelor of Arts',
  education_major: 'Computer Science', education_end_month: 'May', education_end_year: '2025',
  referral_source: 'LinkedIn'
};

const PDF = 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9MZW5ndGggNDA+PnN0cmVhbQoxIDAgMCAxIDcyIDcyMCBjbQpCVAovRjEgMTIgVGYKKHRlc3QpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1syIDAgUl0+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vQ29udGVudHMgMyAwIFI+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMSAwIFI+PgplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAxNDAgMDAwMDAgbgowMDAwMDAwMTg0IDAwMDAwIG4KMDAwMDAwMDAwOSAwMDAwMCBuCjAwMDAwMDAyOTcgMDAwMDAgbgp0cmFpbGVyCjw8L1NpemUgNS9Sb290IDQgMCBSPj4Kc3RhcnR4cmVmCjM0MAolJUVPRgo=';

async function main() {
  const ctx = await chromium.launchPersistentContext('', {
    channel: 'chromium', headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`]
  });
  let [w] = ctx.serviceWorkers();
  if (!w) w = await ctx.waitForEvent('serviceworker', { timeout: 10000 });
  const extId = w.url().split('/')[2];

  const opt = await ctx.newPage();
  await opt.goto(`chrome-extension://${extId}/src/ui/options/options.html`);
  await opt.evaluate(async ({ p, r }) => {
    await chrome.storage.sync.set({ masterProfile: p });
    await chrome.storage.local.set({ resumeFile: { base64: r, filename: 'anthony_bolivar_resume.pdf', type: 'application/pdf', size: 500, uploadedAt: Date.now() } });
  }, { p: PROFILE, r: PDF });
  await opt.close();

  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[err]', e.message.slice(0, 150)));
  try {
    await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    console.log('[nav-error]', e.message.slice(0, 150));
  }
  await page.waitForTimeout(WAIT);

  const r = await page.evaluate(() => {
    const filled = document.querySelectorAll('[data-ag-filled="true"]').length;
    const inputs = Array.from(document.querySelectorAll('input:not([type=hidden]), select, textarea'));
    const total = inputs.length;
    const visibleFilled = inputs.filter(el => el.value && el.value !== '').length;
    const heading = document.querySelector('h1, h2')?.textContent?.trim().slice(0, 80) || '';
    const title = document.title;
    return { filled, total, visibleFilled, heading, title, url: location.href };
  });

  console.log(`URL=${r.url}`);
  console.log(`TITLE=${r.title}`);
  console.log(`HEADING=${r.heading}`);
  console.log(`INPUTS_TOTAL=${r.total} AG_FILLED=${r.filled} INPUTS_WITH_VALUES=${r.visibleFilled}`);

  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
