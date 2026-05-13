import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const URL_ = 'https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/Senior-GPU-Propogation-Engine-Engineer_JR2016808/apply';

// Unique email per run so the Create Account submit succeeds rather than
// hitting an already-registered account.
const UNIQ = Date.now();
const ACCOUNT_EMAIL = `tony.e.bolivar+wd${UNIQ}@gmail.com`;

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
  account_email: ACCOUNT_EMAIL,
  account_password: 'Autograph-Test-Pw-2026!'
};
const PDF = 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9MZW5ndGggNDA+PnN0cmVhbQoxIDAgMCAxIDcyIDcyMCBjbQpCVAovRjEgMTIgVGYKKHRlc3QpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1syIDAgUl0+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vQ29udGVudHMgMyAwIFI+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMSAwIFI+PgplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAxNDAgMDAwMDAgbgowMDAwMDAwMTg0IDAwMDAwIG4KMDAwMDAwMDAwOSAwMDAwMCBuCjAwMDAwMDAyOTcgMDAwMDAgbgp0cmFpbGVyCjw8L1NpemUgNS9Sb290IDQgMCBSPj4Kc3RhcnR4cmVmCjM0MAolJUVPRgo=';

const VERIFY_URL_FILE = path.resolve(__dirname, '.wd-verify-url.txt');
try { fs.unlinkSync(VERIFY_URL_FILE); } catch (e) {}

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

async function waitForVerifyUrl(timeoutMs) {
  var start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(VERIFY_URL_FILE)) {
      var url = fs.readFileSync(VERIFY_URL_FILE, 'utf8').trim();
      if (url.startsWith('http')) return url;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  return null;
}

async function main() {
  console.log('ACCOUNT_EMAIL=', ACCOUNT_EMAIL);

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

  // Adapter prefillPass auto-advances the full gate sequence:
  // Apply Manually (adventure page), Sign in with email, Create Account.
  await page.waitForTimeout(18000);

  const preSubmit = await page.evaluate(() => ({
    filled: document.querySelectorAll('[data-ag-filled="true"]').length,
    title: document.title,
    url: location.href
  }));
  console.log('PRE_SUBMIT title=', preSubmit.title, 'filled=', preSubmit.filled);

  // Accept the privacy policy checkbox if present (required to submit on
  // NVIDIA and similar tenants). Use page.click so click_filter accepts it.
  await driveStep(page, 'check privacy policy (real mouse)', async () => {
    var sel = '[data-automation-id="createAccountCheckbox"]';
    var ct = await page.locator(sel).count();
    if (ct === 0) return { ok: false };
    await page.locator(sel).first().click({ timeout: 5000 });
    return { ok: true };
  });
  await page.waitForTimeout(800);

  // Workday wraps createAccountSubmitButton in a click_filter DIV with
  // role=button that intercepts and validates the click. Clicking the
  // filter itself dispatches the real submit. The underlying button is
  // covered, so a direct click on it times out as not-actionable.
  await driveStep(page, 'click Create Account submit via click_filter', async () => {
    var filter = '[data-automation-id="noCaptchaWrapper"] [data-automation-id="click_filter"]';
    var ct = await page.locator(filter).count();
    if (ct === 0) {
      // Fall back to forcing a click on the underlying button.
      await page.locator('[data-automation-id="createAccountSubmitButton"]').first().click({ force: true, timeout: 5000 });
      return { ok: true, via: 'force-button' };
    }
    await page.locator(filter).first().click({ timeout: 10000 });
    return { ok: true, via: 'click_filter' };
  });
  await page.waitForTimeout(8000);

  const postSubmit = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    signedIn: !!document.querySelector('[data-automation-id="utilityButtonAccountTasksMenu"], [data-automation-id="applyFlowMyInfoPage"], [data-automation-id*="candidateHome"]'),
    buttons: Array.from(document.querySelectorAll('button, a')).map(b => (b.textContent || '').trim()).filter(t => t && t.length < 80).slice(0, 20),
    autoIds: Array.from(document.querySelectorAll('[data-automation-id]')).map(e => e.getAttribute('data-automation-id')).slice(0, 40),
    pageText: document.body?.innerText?.slice(0, 600) || ''
  }));
  console.log('POST_SUBMIT:', JSON.stringify(postSubmit, null, 2));
  console.log(`SUBMITTED_EMAIL=${ACCOUNT_EMAIL}`);

  if (postSubmit.signedIn) {
    console.log('SIGNED_IN_IMMEDIATELY (no verification gate, NVIDIA-style tenant)');
    await page.waitForTimeout(6000);
  } else {
    console.log('WAITING_FOR_VERIFY_URL (write to', VERIFY_URL_FILE, ')');
    var verifyUrl = await waitForVerifyUrl(180000);
    if (!verifyUrl) {
      console.log('TIMED_OUT waiting for verify url');
      await ctx.close();
      return;
    }
    console.log('VERIFY_URL_RECEIVED=', verifyUrl.slice(0, 120));
    await driveStep(page, 'navigate to verify url', async () => {
      await page.goto(verifyUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(10000);
      return { url: page.url() };
    });
  }

  const afterVerify = await page.evaluate(() => {
    var inputs = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea'));
    function describe(el) {
      var host = el.closest('[data-automation-id]');
      return {
        type: el.type,
        auto: el.getAttribute('data-automation-id') || host?.getAttribute('data-automation-id') || null,
        ag: el.getAttribute('data-ag-filled') || el.closest('[data-ag-filled]')?.getAttribute('data-ag-filled') || null,
        value: typeof el.value === 'string' ? el.value.slice(0, 50) : el.value
      };
    }
    return {
      title: document.title,
      url: location.href,
      inputCount: inputs.length,
      filled: document.querySelectorAll('[data-ag-filled="true"]').length,
      pageText: document.body?.innerText?.slice(0, 400) || '',
      entries: inputs.slice(0, 30).map(describe)
    };
  });
  console.log('AFTER_VERIFY:', JSON.stringify(afterVerify, null, 2));
  console.log('=== WORKDAY APPLICATION FILLED ===', afterVerify.filled, '/', afterVerify.inputCount);
  for (var f of afterVerify.entries) {
    var flag = f.ag === 'true' ? '[F]' : (f.value ? '[v]' : '   ');
    console.log(`${flag} ${(f.type || '').padEnd(10)} ${(f.auto || '').padEnd(40)} | ${JSON.stringify(f.value)}`);
  }

  await page.waitForTimeout(10000);
  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
