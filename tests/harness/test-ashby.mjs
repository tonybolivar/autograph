import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXT = path.resolve(__dirname, '../..');

const ASHBY_URL = 'https://jobs.ashbyhq.com/openai/6202038a-323b-43ce-ae10-534acba4145c/application';

const PROFILE = {
  first_name: 'Anthony',
  last_name: 'Bolivar',
  email: 'tony.e.bolivar@gmail.com',
  phone_number: '(936) 419-2746',
  phone_type: 'Mobile',
  city: 'Hamilton',
  state_province: 'NY',
  zip_postal: '13346',
  country: 'United States',
  phone_country: 'United States',
  linkedin_profile: 'https://www.linkedin.com/in/anthonybolivar',
  github_profile: 'https://github.com/abolivar',
  website: 'https://anthonybolivar.com',
  work_authorization: 'Yes',
  need_sponsorship: 'No',
  willing_to_relocate: 'Yes',
  bound_by_noncompete: 'No',
  is_veteran: 'No',
  have_disability: 'No',
  gender: 'Male',
  race: 'Hispanic or Latino',
  hispanic_ethnicity: 'Yes',
  current_company: 'Acme Corp',
  current_title: 'Software Engineer',
  years_experience: '3',
  education_school: 'Colgate University',
  education_degree: 'Bachelor of Arts',
  education_major: 'Computer Science',
  education_end_month: 'May',
  education_end_year: '2025',
  additional_information: 'Excited to hear more about the role.'
};

const FAKE_PDF_BASE64 = 'JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9MZW5ndGggNDA+PnN0cmVhbQoxIDAgMCAxIDcyIDcyMCBjbQpCVAovRjEgMTIgVGYKKHRlc3QpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDEvS2lkc1syIDAgUl0+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDEgMCBSL01lZGlhQm94WzAgMCA2MTIgNzkyXS9SZXNvdXJjZXM8PC9Gb250PDwvRjE8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+Pj4+Pj4vQ29udGVudHMgMyAwIFI+PgplbmRvYmoKNCAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMSAwIFI+PgplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmCjAwMDAwMDAxNDAgMDAwMDAgbgowMDAwMDAwMTg0IDAwMDAwIG4KMDAwMDAwMDAwOSAwMDAwMCBuCjAwMDAwMDAyOTcgMDAwMDAgbgp0cmFpbGVyCjw8L1NpemUgNS9Sb290IDQgMCBSPj4Kc3RhcnR4cmVmCjM0MAolJUVPRgo=';

async function main() {
  const ctx = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: false,
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`
    ]
  });

  let [worker] = ctx.serviceWorkers();
  if (!worker) worker = await ctx.waitForEvent('serviceworker', { timeout: 10000 });
  const extId = worker.url().split('/')[2];
  console.log('Extension ID:', extId);

  const optionsPage = await ctx.newPage();
  await optionsPage.goto(`chrome-extension://${extId}/src/ui/options/options.html`);
  await optionsPage.waitForLoadState('domcontentloaded');
  await optionsPage.evaluate(async ({ profile, resumeBase64 }) => {
    await chrome.storage.sync.set({ masterProfile: profile });
    await chrome.storage.local.set({
      resumeFile: {
        base64: resumeBase64,
        filename: 'anthony_bolivar_resume.pdf',
        type: 'application/pdf',
        size: 500,
        uploadedAt: Date.now()
      }
    });
  }, { profile: PROFILE, resumeBase64: FAKE_PDF_BASE64 });
  console.log('Seeded: profile + resume');
  await optionsPage.close();

  ctx.on('serviceworker', sw => {
    console.log('[sw]', sw.url());
  });

  const page = await ctx.newPage();
  page.on('console', msg => {
    const t = msg.type();
    const text = msg.text();
    if (t === 'error' || t === 'warning' || /autograph|ag-|AG_/i.test(text)) {
      console.log(`[${t}]`, text.slice(0, 250));
    }
  });
  page.on('pageerror', err => console.log('[pageerror]', err.message));
  await page.goto(ASHBY_URL, { waitUntil: 'domcontentloaded' });

  // Inject a probe to see if our globals exist
  await page.waitForTimeout(2500);
  const globals = await page.evaluate(() => ({
    loaded: !!window.__AUTOGRAPH_LOADED__,
    hasSites: typeof AG_SUPPORTED_SITES,
    hasAdapter: typeof AG_ADAPTER_ASHBY,
    hasMatcher: typeof agMatchToProfileField,
    hasFillFn: typeof agFillTextField
  })).catch(e => ({ error: e.message }));
  console.log('Global probe:', globals);

  await page.waitForTimeout(3000);

  const nameInputDiag = await page.evaluate(() => {
    const el = document.querySelector('input#_systemfield_name');
    if (!el) return { found: false };
    const ancestorTestids = [];
    let cur = el;
    while (cur && ancestorTestids.length < 10) {
      const ti = cur.getAttribute && cur.getAttribute('data-testid');
      if (ti) ancestorTestids.push(ti);
      cur = cur.parentElement;
    }
    return {
      found: true,
      id: el.id,
      name: el.name,
      directTestid: el.getAttribute('data-testid'),
      ancestorTestids,
      value: el.value,
      currentlyHasAgFilled: el.getAttribute('data-ag-filled')
    };
  });
  console.log('Name input diag:', nameInputDiag);

  // Probe the content script's ISOLATED world via chrome.scripting
  const scopeProbe = await page.evaluate(async () => {
    // Try via window
    return {
      page_AG_ADAPTER_ASHBY: typeof window.AG_ADAPTER_ASHBY,
      page_AG_SUPPORTED_SITES: typeof window.AG_SUPPORTED_SITES
    };
  });
  console.log('Page-world scope probe (should be undefined - different world):', scopeProbe);

  const yesnoStatus = await page.evaluate(() => {
    const containers = document.querySelectorAll("._yesno_17tft_149, [class*='_yesno_']");
    return Array.from(containers).map(c => {
      const fieldEntry = c.closest("._fieldEntry_17tft_29, .ashby-application-form-field-entry") || c;
      const question = fieldEntry.querySelector("label, [class*='_heading_'], [class*='_label_']")?.textContent.trim().slice(0, 60) || '';
      const buttons = Array.from(c.querySelectorAll("button")).map(b => ({
        text: b.textContent.trim().slice(0, 10),
        cls: b.className.slice(0, 80),
        ariaPressed: b.getAttribute('aria-pressed')
      }));
      return { question, buttons };
    });
  });
  console.log('\n=== Ashby yes/no buttons ===');
  for (const yn of yesnoStatus) {
    console.log(`Q: ${yn.question}`);
    for (const b of yn.buttons) console.log(`  ${b.text} (aria-pressed=${b.ariaPressed}) cls=${b.cls.slice(0, 80)}`);
  }

  const results = await page.evaluate(() => {
    const out = { fields: [], counters: {}, resume: {} };
    const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'));
    out.counters.totalInputs = fields.length;
    out.counters.filledHighlights = document.querySelectorAll('[data-ag-filled="true"]').length;

    for (const el of fields) {
      if (el.type === 'file') continue;
      const id = el.id || '';
      const name = el.name || '';
      let labelText = '';
      if (id) {
        const l = document.querySelector(`label[for="${CSS.escape(id)}"]`);
        if (l) labelText = l.textContent.trim().slice(0, 50);
      }
      let value;
      if (el.type === 'checkbox' || el.type === 'radio') value = el.checked;
      else value = el.value;
      out.fields.push({
        tag: el.tagName.toLowerCase(),
        type: el.type,
        id: id.slice(0, 40),
        name: name.slice(0, 50),
        label: labelText,
        value: typeof value === 'string' ? value.slice(0, 40) : value,
        agFilled: el.getAttribute('data-ag-filled') === 'true',
        labelFilled: el.closest('[data-ag-filled="true"]') !== null
      });
    }

    const resume = document.querySelector('input[type="file"][id="_systemfield_resume"]');
    out.resume.found = !!resume;
    out.resume.filesCount = resume ? resume.files.length : null;
    out.resume.filename = resume && resume.files[0] ? resume.files[0].name : null;
    return out;
  });

  console.log('\n=== COUNTERS ===');
  console.log(results.counters);
  console.log('\n=== RESUME ===');
  console.log(results.resume);
  console.log('\n=== FIELDS (filled or recognizable) ===');
  const interesting = results.fields.filter(f => f.label || f.agFilled || f.labelFilled || (typeof f.value === 'string' && f.value));
  for (const f of interesting) {
    const marker = f.agFilled ? '[F]' : f.labelFilled ? '[ag]' : '   ';
    console.log(`${marker} ${f.type.padEnd(8)} | ${(f.label || f.name || f.id).padEnd(48)} | ${JSON.stringify(f.value)}`);
  }

  console.log('\n=== UNFILLED INTERESTING ===');
  const expected = ['name', 'phone', 'linkedin', 'authoriz', 'sponsor', 'relocat', 'compete', 'where', 'gender', 'race', 'hispanic', 'veteran', 'disability', 'experience'];
  for (const f of results.fields) {
    const text = (f.label + ' ' + f.name).toLowerCase();
    if (!expected.some(e => text.includes(e))) continue;
    if (f.agFilled || f.labelFilled) continue;
    if (typeof f.value === 'string' && f.value) continue;
    if (f.value === true) continue;
    console.log(`MISS ${f.type.padEnd(8)} | ${(f.label || f.name).slice(0, 60)}`);
  }

  await page.waitForTimeout(30000);
  await ctx.close();
}

main().catch(e => { console.error(e); process.exit(1); });
