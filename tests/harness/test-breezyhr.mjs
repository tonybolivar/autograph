import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const URL_ = 'https://brilliant.breezy.hr/p/2621fe1cc449-senior-software-engineer-full-stack/apply';

const PROFILE = {
  first_name: 'Anthony', last_name: 'Bolivar', email: 'tony.e.bolivar@gmail.com',
  phone_number: '(936) 419-2746',
  address_line_1: '123 Main St',
  city: 'Hamilton', state_province: 'NY', zip_postal: '13346', country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/anthonybolivar',
  github_profile: 'https://github.com/abolivar', website: 'https://anthonybolivar.com',
  work_authorization: 'Yes', need_sponsorship: 'No',
  willing_to_relocate: 'Yes', bound_by_noncompete: 'No',
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
  let [worker] = ctx.serviceWorkers();
  if (!worker) worker = await ctx.waitForEvent('serviceworker', { timeout: 10000 });
  const extId = worker.url().split('/')[2];

  const opt = await ctx.newPage();
  await opt.goto(`chrome-extension://${extId}/src/ui/options/options.html`);
  await opt.evaluate(async ({ p, r }) => {
    await chrome.storage.sync.set({ masterProfile: p });
    await chrome.storage.local.set({ resumeFile: { base64: r, filename: 'anthony_bolivar_resume.pdf', type: 'application/pdf', size: 500, uploadedAt: Date.now() } });
  }, { p: PROFILE, r: PDF });
  await opt.close();

  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 200)));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const r = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea, [role="combobox"]'));
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
      let lbl = '';
      if (id) {
        const l = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (l) lbl = l.textContent.trim().slice(0, 60);
      }
      if (!lbl) {
        const w = el.closest('.form-group, .field, .question, fieldset, label');
        lbl = (w?.querySelector('label, legend')?.textContent || '').trim().slice(0, 60);
      }
      if (!lbl) lbl = (el.placeholder || '').slice(0, 60);
      const entry = { t, ref: (name || id).slice(0, 50), label: lbl, v: typeof v === 'string' ? v.slice(0, 50) : v, ag };
      if (isCheck && el.checked) checked.push(entry);
      else if (ag || (typeof v === 'string' && v)) filled.push(entry);
      else if (lbl) unfilled.push(entry);
    }
    const resume = document.querySelector('input[type="file"][id="main-attachment"], input[type="file"][name="cResume"]');
    return {
      filledCount: document.querySelectorAll('[data-ag-filled="true"]').length,
      resumeFiles: resume ? resume.files.length : null,
      filled, checked, unfilled
    };
  });

  console.log('=== BREEZYHR FILLED COUNT ===', r.filledCount);
  console.log('Resume files:', r.resumeFiles);
  console.log('\n=== FILLED ===');
  for (const f of r.filled) console.log(`[F] ${f.t.padEnd(10)} ${(f.label || f.ref).padEnd(45)} | ${JSON.stringify(f.v)}`);
  console.log('\n=== CHECKED ===');
  for (const f of r.checked) console.log(`[C] ${f.t.padEnd(10)} ${(f.label || f.ref)}`);
  console.log('\n=== UNFILLED ===');
  for (const f of r.unfilled) console.log(`    ${f.t.padEnd(10)} ${f.label.padEnd(50)} | ${f.ref.slice(0, 30)}`);

  await page.waitForTimeout(15000);
  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
