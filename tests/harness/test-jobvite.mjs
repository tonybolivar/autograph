import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const URL_ = 'https://jobs.jobvite.com/ninjaone/job/oJMWwfwH/apply';

const PROFILE = {
  first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@example.com',
  phone_number: '(555) 555-0123', address_line_1: '123 Main St',
  city: 'Hamilton', state_province: 'New York', zip_postal: '13346', country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/janedoe',
  github_profile: 'https://github.com/janedoe', website: 'https://example.com',
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
    await chrome.storage.local.set({ resumeFile: { base64: r, filename: 'jane_doe_resume.pdf', type: 'application/pdf', size: 500, uploadedAt: Date.now() } });
  }, { p: PROFILE, r: PDF });
  await opt.close();

  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[err]', e.message.slice(0, 200)));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const select = document.querySelector('select#jv-country-select');
    if (select) {
      select.selectedIndex = 1;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const next = Array.from(document.querySelectorAll('button, a.button, input[type="submit"]')).find(b => /^next/i.test((b.textContent || '').trim()));
    if (next) next.click();
  });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const accept = Array.from(document.querySelectorAll('button, a.button, input[type="submit"]')).find(b => /^(accept|agree|i agree|i accept|continue)/i.test((b.textContent || '').trim()));
    if (accept) accept.click();
  });
  await page.waitForTimeout(5000);

  const r = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea, [role="combobox"]'));
    const out = { filled: [], checked: [], unfilled: [] };
    for (const el of fields) {
      const t = el.type || el.tagName.toLowerCase();
      const isCheck = t === 'checkbox' || t === 'radio';
      const v = isCheck ? el.checked : el.value;
      const ag = el.getAttribute('data-ag-filled') === 'true' || el.closest('[data-ag-filled="true"]') !== null;
      const id = el.id || ''; const name = el.name || '';
      let lbl = '';
      if (id) { const l = document.querySelector(`label[for="${CSS.escape(id)}"]`); if (l) lbl = l.textContent.trim().slice(0, 60); }
      const e = { t, ref: (name || id).slice(0, 40), label: lbl, v: typeof v === 'string' ? v.slice(0, 50) : v, ag };
      if (isCheck && el.checked) out.checked.push(e);
      else if (ag || (typeof v === 'string' && v)) out.filled.push(e);
      else if (lbl) out.unfilled.push(e);
    }
    const fileInput = document.querySelector('input[type="file"]');
    out.filledCount = document.querySelectorAll('[data-ag-filled="true"]').length;
    out.resumeFiles = fileInput ? fileInput.files.length : null;
    return out;
  });

  console.log('=== JOBVITE FILLED ===', r.filledCount, 'resume:', r.resumeFiles);
  console.log('\n=== FILLED ===');
  for (const f of r.filled) console.log(`[F] ${f.t.padEnd(12)} ${(f.label || f.ref).padEnd(50)} | ${JSON.stringify(f.v)}`);
  console.log('\n=== CHECKED ===');
  for (const f of r.checked) console.log(`[C] ${f.t.padEnd(12)} ${(f.label || f.ref)}`);
  console.log('\n=== UNFILLED ===');
  for (const f of r.unfilled) console.log(`    ${f.t.padEnd(12)} ${f.label.padEnd(50)} | ${f.ref.slice(0, 30)}`);

  await page.waitForTimeout(15000);
  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
