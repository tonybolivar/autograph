import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const URL_ = 'https://job-boards.greenhouse.io/anthropic/jobs/5023394008';

const PROFILE = {
  first_name: 'Anthony', last_name: 'Bolivar', email: 'tony.e.bolivar@gmail.com',
  phone_number: '(936) 419-2746', phone_type: 'Mobile',
  city: 'Hamilton', state_province: 'NY', zip_postal: '13346',
  country: 'United States', phone_country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/anthonybolivar',
  github_profile: 'https://github.com/abolivar', website: 'https://anthonybolivar.com',
  work_authorization: 'Yes', need_sponsorship: 'No', willing_to_relocate: 'Yes', bound_by_noncompete: 'No',
  is_veteran: 'No', have_disability: 'No',
  gender: 'Male', race: 'Hispanic or Latino', hispanic_ethnicity: 'Yes',
  current_company: 'Acme Corp', current_title: 'Software Engineer', years_experience: '3',
  education_school: 'Colgate University', education_degree: 'Bachelor of Arts', education_major: 'Computer Science',
  education_end_month: 'May', education_end_year: '2025'
};

async function main() {
  const ctx = await chromium.launchPersistentContext('', {
    channel: 'chromium', headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`]
  });
  let [worker] = ctx.serviceWorkers();
  if (!worker) worker = await ctx.waitForEvent('serviceworker', { timeout: 10000 });
  const extId = worker.url().split('/')[2];

  const opt = await ctx.newPage();
  await opt.goto(`chrome-extension://${extId}/src/ui/options/options.html`);
  await opt.evaluate(async (p) => { await chrome.storage.sync.set({ masterProfile: p }); }, PROFILE);
  await opt.close();

  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 200)));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const r = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
    const filled = [];
    const checked = [];
    const unfilled = [];
    for (const el of fields) {
      const t = el.type || el.tagName.toLowerCase();
      const isCheck = t === 'checkbox' || t === 'radio';
      const v = isCheck ? el.checked : el.value;
      const ag = el.getAttribute('data-ag-filled') === 'true' || el.closest('[data-ag-filled="true"]') !== null;
      const id = el.id || '';
      const name = el.name || '';
      let lblText = '';
      if (id) {
        const lbl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (lbl) lblText = lbl.textContent.trim().slice(0, 60);
      }
      if (!lblText) lblText = (el.closest('[class*="question"], [class*="field"], fieldset')?.querySelector('label, legend')?.textContent || '').trim().slice(0, 60);
      const entry = { t, ref: (name || id).slice(0, 50), label: lblText, v: typeof v === 'string' ? v.slice(0, 50) : v, ag };
      if (isCheck && el.checked) checked.push(entry);
      else if (ag || (typeof v === 'string' && v)) filled.push(entry);
      else if (lblText) unfilled.push(entry);
    }
    return { filledCount: document.querySelectorAll('[data-ag-filled="true"]').length, filled, checked, unfilled };
  });

  console.log('=== GREENHOUSE FILLED COUNT ===', r.filledCount);
  console.log('\n=== FILLED ===');
  for (const f of r.filled) console.log(`[F] ${f.t.padEnd(10)} ${(f.label || f.ref).padEnd(40)} | ${JSON.stringify(f.v)}`);
  console.log('\n=== CHECKED ===');
  for (const f of r.checked) console.log(`[C] ${f.t.padEnd(10)} ${(f.label || f.ref)}`);
  console.log('\n=== UNFILLED (gap) ===');
  for (const f of r.unfilled) console.log(`    ${f.t.padEnd(10)} ${f.label.padEnd(45)} | ${f.ref.slice(0, 30)}`);

  await page.waitForTimeout(15000);
  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
