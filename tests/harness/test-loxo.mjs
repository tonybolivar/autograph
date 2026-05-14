import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const URL_ = 'https://app.loxo.co/job/MjA5MDAtbGZrdzd2MTMzYTE0ejI3dw==/form?source_type=app';

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
  try {
    await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    console.log('[nav-error]', e.message.slice(0, 200));
  }
  await page.waitForTimeout(6000);

  const r = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input:not([type=hidden]), select, textarea'));
    const entries = inputs.map(el => {
      const t = el.type || el.tagName.toLowerCase();
      const isCheck = t === 'checkbox' || t === 'radio';
      const v = isCheck ? el.checked : el.value;
      const ag = el.getAttribute('data-ag-filled') === 'true';
      const ph = el.placeholder || '';
      const name = el.name || el.id || '';
      return { t, name: name.slice(0, 40), placeholder: ph.slice(0, 40), v: typeof v === 'string' ? v.slice(0, 50) : v, ag };
    });
    return {
      filledCount: document.querySelectorAll('[data-ag-filled="true"]').length,
      total: inputs.length,
      entries
    };
  });
  console.log('=== LOXO FILLED ===', r.filledCount, '/', r.total);
  console.log('\n=== FIELDS ===');
  for (const x of r.entries) {
    const flag = x.ag ? '[F]' : (x.v ? '[v]' : '   ');
    console.log(`${flag} ${(x.t || '').padEnd(10)} ${(x.placeholder || x.name).padEnd(40)} | ${JSON.stringify(x.v)}`);
  }

  await page.waitForTimeout(8000);
  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
