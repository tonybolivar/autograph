import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const URL_ = 'https://accenture.eightfold.ai/careers/apply?pid=68759035528';

const PROFILE = {
  first_name: 'Anthony', last_name: 'Bolivar', email: 'tony.e.bolivar@gmail.com',
  phone_number: '(936) 419-2746', phone_type: 'Mobile',
  address_line_1: '123 Main St', city: 'Hamilton', state_province: 'NY', zip_postal: '13346',
  country: 'United States', phone_country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/anthonybolivar',
  github_profile: 'https://github.com/abolivar', website: 'https://anthonybolivar.com',
  work_authorization: 'Yes', need_sponsorship: 'No',
  willing_to_relocate: 'Yes', bound_by_noncompete: 'No',
  is_veteran: 'No', have_disability: 'No',
  gender: 'Male', race: 'Hispanic or Latino', hispanic_ethnicity: 'Yes',
  current_company: 'Acme Corp', current_title: 'Software Engineer', years_experience: '3'
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
  await page.waitForTimeout(15000);

  const probe = await page.evaluate(() => {
    const cbs = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    return cbs.map(cb => {
      const id = cb.id || '';
      const labelFor = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      const agFilled = cb.getAttribute('data-ag-filled') === 'true';
      return {
        id: id.slice(0, 30),
        labelForText: labelFor?.textContent?.trim().slice(0, 80),
        checked: cb.checked,
        defaultChecked: cb.defaultChecked,
        agFilled
      };
    });
  });
  console.log('=== CHECKBOX PROBES ===');
  for (const p of probe) console.log(JSON.stringify(p));

  const emailProbe = await page.evaluate(() => {
    const el = document.getElementById('Contact_Information_email');
    if (!el) return { found: false };
    const rect = el.getBoundingClientRect();
    let parent = el.parentElement;
    const ancestors = [];
    while (parent && ancestors.length < 8) {
      const cs = getComputedStyle(parent);
      ancestors.push({
        tag: parent.tagName,
        cls: (parent.className || '').slice(0, 60),
        position: cs.position,
        top: cs.top,
        transform: cs.transform,
        visibility: cs.visibility,
        display: cs.display,
        height: cs.height
      });
      parent = parent.parentElement;
    }
    return {
      found: true,
      rect: { top: rect.top, left: rect.left, w: rect.width, h: rect.height },
      offsetParent: !!el.offsetParent,
      offsetTop: el.offsetTop,
      style: el.getAttribute('style'),
      ancestors
    };
  });
  console.log('EMAIL_PROBE:', JSON.stringify(emailProbe).slice(0, 1500));

  const eFill = await page.evaluate(() => {
    const e = document.getElementById('Contact_Information_email');
    const c = document.getElementById('Contact_Information_city');
    return {
      email: e ? { value: e.value, ag: e.getAttribute('data-ag-filled'), type: e.type, display: getComputedStyle(e).display } : null,
      city: c ? { value: c.value, ag: c.getAttribute('data-ag-filled'), type: c.type, display: getComputedStyle(c).display } : null
    };
  });
  console.log('EFILL:', JSON.stringify(eFill));

  const trace = await page.evaluate(() => {
    const e = document.getElementById('Contact_Information_email');
    if (!e) return null;
    // The content script is isolated world - can't access agExtractLabel directly.
    // Check structural cues for adapter logic.
    const label = document.querySelector(`label[for="${CSS.escape(e.id)}"]`);
    const wrap = e.closest('.form-group, .ef-form-field, [class*=FormField], fieldset');
    const wrapLabel = wrap?.querySelector('label, legend, [class*=label]');
    // Inside dialog/modal?
    const dialog = e.closest('.ant-modal, [role=dialog], [role=alertdialog], [class*=Modal], [class*=Dialog], [class*=Drawer]');
    // Check if has resume parser cls
    return {
      labelFor: label?.textContent?.trim().slice(0, 40),
      wrapClass: (wrap?.className || '').slice(0, 80),
      wrapLabelText: wrapLabel?.textContent?.trim().slice(0, 40),
      inDialog: !!dialog,
      hasFormParent: !!e.closest('form, fieldset')
    };
  });
  console.log('TRACE:', JSON.stringify(trace));

  const shadowCheck = await page.evaluate(() => {
    const e = document.getElementById('Contact_Information_email');
    if (!e) return null;
    let host = e.parentNode;
    while (host) {
      if (host.host) return { inShadow: true, hostTag: host.host.tagName };
      host = host.parentNode;
    }
    const reachable = document.querySelectorAll('input').length;
    const reachableByQS = Array.from(document.querySelectorAll('input')).includes(e);
    return { inShadow: false, reachableInputCount: reachable, foundByQS: reachableByQS };
  });
  console.log('SHADOW:', JSON.stringify(shadowCheck));

  const exclusionCheck = await page.evaluate(() => {
    const e = document.getElementById('Contact_Information_email');
    if (!e) return null;
    return {
      closestDialog: e.closest("[role='dialog']")?.tagName,
      closestModal: e.closest("[class*='Modal']")?.className?.slice(0, 80),
      closestDrawer: e.closest("[class*='Drawer']")?.className?.slice(0, 80),
      closestAntModal: e.closest(".ant-modal")?.className?.slice(0, 80)
    };
  });
  console.log('EXCLUSION:', JSON.stringify(exclusionCheck));

  const dupCheck = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('input'));
    const emailLikes = all.filter(e => /email/i.test(e.id || e.name || ''));
    return emailLikes.map(e => ({
      id: e.id,
      name: e.name,
      value: e.value,
      ag: e.getAttribute('data-ag-filled'),
      visible: e.offsetParent !== null,
      sameId: document.querySelectorAll(`#${CSS.escape(e.id)}`).length
    }));
  });
  console.log('DUPCHECK:', JSON.stringify(dupCheck));


  const directFill = await page.evaluate(async () => {
    const e = document.getElementById('Contact_Information_email');
    if (!e) return null;
    e.focus();
    const proto = window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(e, 'tony.e.bolivar@gmail.com');
    e.dispatchEvent(new Event('input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const v1 = e.value;
    await new Promise(r => setTimeout(r, 1000));
    const v2 = e.value;
    return { afterSet: v1, after1s: v2 };
  });
  console.log('DIRECT_FILL:', JSON.stringify(directFill));

  const allEmail = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('input[type="text"], input[type="email"]')).filter(e => /email/i.test(e.id || e.name || '') || /email/i.test(document.querySelector(`label[for="${CSS.escape(e.id || 'none')}"]`)?.textContent || ''));
    return els.map(el => ({
      id: el.id,
      name: el.name,
      type: el.type,
      value: el.value,
      ag: el.getAttribute('data-ag-filled'),
      rect: el.getBoundingClientRect(),
      label: document.querySelector(`label[for="${CSS.escape(el.id || 'none')}"]`)?.textContent?.trim()?.slice(0, 40)
    }));
  });
  console.log('ALL_EMAIL:', JSON.stringify(allEmail));

  const r = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea, [role="combobox"]'));
    const filled = []; const checked = []; const unfilled = [];
    for (const el of fields) {
      const t = el.type || el.tagName.toLowerCase();
      const isCheck = t === 'checkbox' || t === 'radio';
      const v = isCheck ? el.checked : el.value;
      const ag = el.getAttribute('data-ag-filled') === 'true' || el.closest('[data-ag-filled="true"]') !== null;
      const id = el.id || '';
      let lbl = '';
      if (id) { const l = document.querySelector(`label[for="${CSS.escape(id)}"]`); if (l) lbl = l.textContent.trim().slice(0, 80); }
      const entry = { t, ref: id.slice(0, 50), label: lbl, v: typeof v === 'string' ? v.slice(0, 40) : v, ag };
      if (isCheck && el.checked) checked.push(entry);
      else if (ag || (typeof v === 'string' && v)) filled.push(entry);
      else if (lbl) unfilled.push(entry);
    }
    return { filledCount: document.querySelectorAll('[data-ag-filled="true"]').length, filled, checked, unfilled };
  });

  console.log('=== EIGHTFOLD FILLED ===', r.filledCount);
  console.log('\n=== FILLED ==='); for (const f of r.filled) console.log(`[F] ${f.t.padEnd(10)} ${(f.label || f.ref).padEnd(50)} | ${JSON.stringify(f.v)}`);
  console.log('\n=== CHECKED ==='); for (const f of r.checked) console.log(`[C] ${f.t.padEnd(10)} ${(f.label || f.ref)}`);
  console.log('\n=== UNFILLED ==='); for (const f of r.unfilled) console.log(`    ${f.t.padEnd(10)} ${f.label.padEnd(60)} | ${f.ref.slice(0, 30)}`);

  await page.waitForTimeout(5000);
  await ctx.close();
}
main().catch(e => { console.error(e); process.exit(1); });
