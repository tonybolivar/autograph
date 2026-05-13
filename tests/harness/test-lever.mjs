import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const LEVER_URL = 'https://jobs.lever.co/spotify/3ada366b-14f4-421d-8dff-e96da1005b67/apply';

const PROFILE = {
  first_name: 'Anthony', last_name: 'Bolivar',
  email: 'tony.e.bolivar@gmail.com',
  phone_number: '(936) 419-2746', phone_type: 'Mobile',
  city: 'Hamilton', state_province: 'NY', zip_postal: '13346',
  country: 'United States', phone_country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/anthonybolivar',
  github_profile: 'https://github.com/abolivar',
  website: 'https://anthonybolivar.com',
  work_authorization: 'Yes', need_sponsorship: 'No',
  willing_to_relocate: 'Yes', bound_by_noncompete: 'No',
  is_veteran: 'No', have_disability: 'No',
  gender: 'Male', race: 'Hispanic or Latino', hispanic_ethnicity: 'Yes',
  current_company: 'Acme Corp', current_title: 'Software Engineer',
  years_experience: '3',
  education_school: 'Colgate University',
  education_degree: 'Bachelor of Arts',
  education_major: 'Computer Science',
  education_end_month: 'May', education_end_year: '2025'
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
  await opt.waitForLoadState('domcontentloaded');
  await opt.evaluate(async ({ p, r }) => {
    await chrome.storage.sync.set({ masterProfile: p });
    await chrome.storage.local.set({ resumeFile: { base64: r, filename: 'anthony_bolivar_resume.pdf', type: 'application/pdf', size: 500, uploadedAt: Date.now() } });
  }, { p: PROFILE, r: PDF });
  await opt.close();

  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(LEVER_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const r = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
    const filled = [];
    const checked = [];
    const unfilledInteresting = [];
    for (const el of fields) {
      const name = el.name || '';
      const id = el.id || '';
      const t = el.type || el.tagName.toLowerCase();
      const isCheck = t === 'checkbox' || t === 'radio';
      const v = isCheck ? el.checked : el.value;
      const ag = el.getAttribute('data-ag-filled') === 'true' || el.closest('[data-ag-filled="true"]') !== null;
      const ref = name || id;
      const labelEl = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      const wrapLabel = (el.closest('.application-question, .application-label, fieldset, [class*="card"]')?.querySelector('label, .application-label, .text, legend')?.textContent || '').trim().slice(0, 60);
      const labelText = labelEl ? labelEl.textContent.trim().slice(0, 60) : wrapLabel;
      const entry = { t, ref: ref.slice(0, 60), label: labelText, v: typeof v === 'string' ? v.slice(0, 50) : v, ag };
      if (isCheck && el.checked) checked.push(entry);
      else if (ag || (typeof v === 'string' && v)) filled.push(entry);
      else if (labelText) unfilledInteresting.push(entry);
    }
    const resume = document.querySelector('input[type="file"][name="resume"]');
    return {
      filledCount: document.querySelectorAll('[data-ag-filled="true"]').length,
      resumeFiles: resume ? resume.files.length : null,
      filled, checked, unfilledInteresting
    };
  });

  console.log('=== LEVER FILLED COUNT ===', r.filledCount);
  console.log('Resume files:', r.resumeFiles);
  console.log('\n=== FILLED FIELDS ===');
  for (const f of r.filled) console.log(`[F] ${f.t.padEnd(10)} ${(f.label || f.ref).padEnd(40)} | ${JSON.stringify(f.v)}`);
  console.log('\n=== CHECKED CHECKBOXES/RADIOS ===');
  for (const f of r.checked) console.log(`[C] ${f.t.padEnd(10)} ${(f.label || f.ref).padEnd(40)}`);
  console.log('\n=== UNFILLED WITH LABEL (THE GAP) ===');
  for (const f of r.unfilledInteresting) console.log(`    ${f.t.padEnd(10)} ${f.label.padEnd(50)} | ${f.ref.slice(0, 30)}`);

  // Probe a survey radio's structure to understand why it's not filling
  const survey = await page.evaluate(() => {
    const radio = document.querySelector('input[type="radio"][name^="surveysResponses"]');
    if (!radio) return null;
    return {
      name: radio.name,
      id: radio.id,
      value: radio.value,
      hasIdLabel: !!(radio.id && document.querySelector(`label[for="${CSS.escape(radio.id)}"]`)),
      closestLabel: !!radio.closest('label'),
      closestLabelText: radio.closest('label')?.textContent.trim().slice(0, 40),
      siblings: Array.from(radio.parentElement?.children || []).slice(0, 4).map(c => c.tagName.toLowerCase() + ':' + (c.textContent || '').trim().slice(0, 30)),
      parentTag: radio.parentElement?.tagName.toLowerCase(),
      parentText: (radio.parentElement?.textContent || '').trim().slice(0, 60)
    };
  });
  console.log('\n=== SURVEY RADIO STRUCTURE ===');
  console.log(JSON.stringify(survey, null, 2));

  const surveyOptions = await page.evaluate(() => {
    const firstGroup = document.querySelector('input[type="radio"][name^="surveysResponses"]');
    if (!firstGroup) return null;
    const peers = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(firstGroup.name)}"]`);
    return Array.from(peers).map(r => ({
      value: r.value,
      labelText: r.closest('label')?.textContent.trim()
    }));
  });
  console.log('Gender survey options:', surveyOptions);

  const wrapperProbe = await page.evaluate(() => {
    const radio = document.querySelector('input[type="radio"][name^="surveysResponses"]');
    const wrap = radio.closest('.application-question, .application-field, .application-additional, .application-additional-question');
    if (!wrap) return null;
    return {
      wrapClass: wrap.className,
      childTags: Array.from(wrap.children).slice(0, 10).map(c => `${c.tagName.toLowerCase()}.${c.className}: ${c.textContent.trim().slice(0, 40)}`)
    };
  });
  console.log('Survey wrapper probe:', JSON.stringify(wrapperProbe, null, 2));

  const broaderProbe = await page.evaluate(() => {
    const radio = document.querySelector('input[type="radio"][name^="surveysResponses"]');
    const ancestors = [];
    let cur = radio.parentElement;
    while (cur && ancestors.length < 6) {
      ancestors.push({
        tag: cur.tagName.toLowerCase(),
        cls: (cur.className || '').toString().slice(0, 60),
        firstChildText: (cur.firstElementChild?.textContent || '').trim().slice(0, 60),
        labels: Array.from(cur.querySelectorAll(':scope > label, :scope > div > label, :scope > div')).slice(0, 3).map(l => l.textContent.trim().slice(0, 60))
      });
      cur = cur.parentElement;
    }
    return ancestors;
  });
  console.log('\nBroader ancestor probe:');
  for (const a of broaderProbe) console.log(JSON.stringify(a));

  await page.waitForTimeout(15000);
  await ctx.close();
}

main().catch(e => { console.error(e); process.exit(1); });
