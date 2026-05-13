import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');
const URL_ = 'https://riverkeeper.bamboohr.com/careers/44';

const PROFILE = {
  first_name: 'Anthony', last_name: 'Bolivar', email: 'tony.e.bolivar@gmail.com',
  phone_number: '(936) 419-2746', phone_type: 'Mobile',
  address_line_1: '123 Main St', city: 'Hamilton', state_province: 'NY', zip_postal: '13346',
  country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/anthonybolivar',
  desired_salary: '150000', salary_currency: 'USD',
  work_authorization: 'Yes', need_sponsorship: 'No',
  earliest_start_date: '2026-06-01',
  open_to_hybrid: 'Yes'
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
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => /apply for this job/i.test(b.textContent));
    if (btn) btn.click();
  });
  await page.waitForTimeout(8000);

  const r = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea'));
    const summary = inputs.map(el => ({
      tag: el.tagName,
      type: el.type,
      name: (el.name || '').slice(0, 50),
      id: (el.id || '').slice(0, 50),
      value: (typeof el.value === 'string' ? el.value : '').slice(0, 50),
      ag: el.getAttribute('data-ag-filled') === 'true'
    }));
    const filled = document.querySelectorAll('[data-ag-filled="true"]').length;
    return { filled, total: inputs.length, summary };
  });

  console.log('=== BAMBOOHR FILLED ===', r.filled, '/', r.total);
  for (const f of r.summary) {
    if (f.ag || f.value) console.log(`[F] ${f.type.padEnd(10)} ${(f.name || f.id).padEnd(40)} | ${JSON.stringify(f.value)}`);
  }
  await page.waitForTimeout(5000);
  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
