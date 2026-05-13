import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const URL_ = 'https://jobs.gem.com/lumalabs-ai/am9icG9zdDodtsh6pWUJjQgE8lXoaEJi';

const PROFILE = {
  first_name: 'Anthony', last_name: 'Bolivar', email: 'tony.e.bolivar@gmail.com',
  phone_number: '(936) 419-2746', address_line_1: '123 Main St',
  city: 'Hamilton', state_province: 'New York', zip_postal: '13346', country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/anthonybolivar',
  github_profile: 'https://github.com/abolivar', website: 'https://anthonybolivar.com',
  work_authorization: 'Yes', need_sponsorship: 'No', willing_to_relocate: 'Yes', bound_by_noncompete: 'No',
  is_veteran: 'No', have_disability: 'No',
  gender: 'Male', race: 'Hispanic or Latino', hispanic_ethnicity: 'Yes',
  current_company: 'Acme Corp', current_title: 'Software Engineer', years_experience: '3',
  desired_salary: '150000', salary_currency: 'USD'
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
  page.on('pageerror', e => console.log('[err]', e.message.slice(0, 200)));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  const r = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea'));
    const radios = Array.from(document.querySelectorAll('input[type="radio"]:checked'));
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    return {
      filledCount: document.querySelectorAll('[data-ag-filled="true"]').length,
      inputsValues: inputs.map((el, i) => ({
        i,
        type: el.type,
        v: (el.value || '').slice(0, 50),
        ag: el.getAttribute('data-ag-filled') === 'true'
      })).filter(x => x.v || x.ag),
      checkedRadios: radios.map(r => ({ id: r.id.slice(0, 20), label: document.querySelector(`label[for="${CSS.escape(r.id)}"]`)?.textContent.trim().slice(0, 50) })),
      checkedBoxes: checkboxes.map(c => ({ id: c.id.slice(0, 20), label: document.querySelector(`label[for="${CSS.escape(c.id)}"]`)?.textContent.trim().slice(0, 50) }))
    };
  });
  console.log('=== GEM FILLED ===', r.filledCount);
  console.log('\n=== INPUT VALUES ===');
  for (const x of r.inputsValues) console.log(`${x.ag ? '[F]' : '   '} ${x.type.padEnd(8)} [${x.i}] ${JSON.stringify(x.v)}`);
  console.log('\n=== CHECKED RADIOS ===');
  for (const x of r.checkedRadios) console.log(`[C] ${x.label}`);
  console.log('\n=== CHECKED BOXES ===');
  for (const x of r.checkedBoxes) console.log(`[C] ${x.label}`);

  await page.waitForTimeout(15000);
  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
