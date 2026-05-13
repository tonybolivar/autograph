import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const URL_ = 'https://adobe.wd5.myworkdayjobs.com/external_experienced/job/San-Francisco/XMLNAME-2026-Intern---Software-Development-Engineer_R160430/apply';

const PROFILE = {
  first_name: 'Anthony', last_name: 'Bolivar', email: 'tony.e.bolivar@gmail.com',
  phone_number: '(936) 419-2746', phone_type: 'Mobile',
  address_line_1: '123 Main St', city: 'Hamilton', state_province: 'NY', zip_postal: '13346',
  country: 'United States', phone_country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/anthonybolivar',
  github_profile: 'https://github.com/abolivar', website: 'https://anthonybolivar.com',
  work_authorization: 'Yes', need_sponsorship: 'No', willing_to_relocate: 'Yes',
  is_veteran: 'No', have_disability: 'No',
  gender: 'Male', race: 'Hispanic or Latino', hispanic_ethnicity: 'Yes',
  current_company: 'Acme Corp', current_title: 'Software Engineer', years_experience: '3',
  account_email: 'tony.e.bolivar+wd@gmail.com',
  account_password: 'Autograph-Test-Pw-2026!'
};
const PDF = 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9MZW5ndGggNDA+PnN0cmVhbQoxIDAgMCAxIDcyIDcyMCBjbQpCVAovRjEgMTIgVGYKKHRlc3QpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1syIDAgUl0+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vQ29udGVudHMgMyAwIFI+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMSAwIFI+PgplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAxNDAgMDAwMDAgbgowMDAwMDAwMTg0IDAwMDAwIG4KMDAwMDAwMDAwOSAwMDAwMCBuCjAwMDAwMDAyOTcgMDAwMDAgbgp0cmFpbGVyCjw8L1NpemUgNS9Sb290IDQgMCBSPj4Kc3RhcnR4cmVmCjM0MAolJUVPRgo=';

async function driveStep(page, label, fn) {
  try {
    var r = await fn();
    console.log(`DRIVE: ${label} ok`, r !== undefined ? JSON.stringify(r).slice(0, 80) : '');
    return r;
  } catch (e) {
    console.log(`DRIVE: ${label} FAILED:`, e.message.slice(0, 120));
    return null;
  }
}

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
  page.on('pageerror', e => console.log('[pageerror]', e.message.slice(0, 200)));

  await driveStep(page, 'navigate', async () => {
    await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(7000);
    return { url: page.url() };
  });

  await driveStep(page, 'click Sign In', async () => {
    return await page.evaluate(() => {
      var b = document.querySelector('[data-automation-id="utilityButtonSignIn"]') || Array.from(document.querySelectorAll('button, a')).find(x => /^sign in$/i.test((x.textContent || '').trim()));
      if (!b) return { ok: false };
      b.click();
      return { ok: true };
    });
  });
  // From here the Workday adapter's prefillPass auto-advances:
  // Sign in with email click, then Create Account click, then fills email/password/verifyPassword.
  await page.waitForTimeout(12000);

  const r = await page.evaluate(() => {
    var inputs = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea'));
    return {
      filled: document.querySelectorAll('[data-ag-filled="true"]').length,
      total: inputs.length,
      entries: inputs.map(el => ({
        type: el.type,
        auto: el.getAttribute('data-automation-id'),
        ag: el.getAttribute('data-ag-filled'),
        hasValue: !!(typeof el.value === 'string' && el.value)
      })),
      title: document.title,
      url: location.href
    };
  });

  console.log('TITLE=', r.title);
  console.log('URL=', r.url);
  console.log('=== WORKDAY FILLED ===', r.filled, '/', r.total);
  for (var f of r.entries) {
    var flag = f.ag === 'true' ? '[F]' : (f.hasValue ? '[v]' : '   ');
    console.log(`${flag} ${(f.type || '').padEnd(10)} auto=${f.auto || ''}`);
  }

  await page.waitForTimeout(4000);
  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
