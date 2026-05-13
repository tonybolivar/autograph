var AG_ADAPTER_TEAMTAILOR = {
  fieldSelector: 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]), select, textarea',

  getJobId(url) {
    const m = url.match(/teamtailor\.com\/jobs\/([^/?#]+)/);
    return m ? m[1] : null;
  },

  getFieldId(el) {
    if (el.id) return el.id.replace(/^candidate_|^job_application_/, "");
    if (el.name) return el.name.replace(/^candidate\[|\]$/g, "");
    return null;
  },

  getFieldLabel(el) {
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    const wrap = el.closest(".form-group, .field, fieldset");
    if (wrap) {
      const lbl = wrap.querySelector("label, legend");
      if (lbl && lbl.textContent.trim()) return lbl.textContent.replace(/\*$/, "").trim();
    }
    return null;
  },

  synthesizeValue(profile, fieldId, label) {
    var fid = (fieldId || "").toLowerCase();
    var lab = (label || "").toLowerCase();
    if (fid === "name" || fid === "full_name") {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || undefined;
    }
    if (/region of the world|world region|in what region|which region/.test(lab)) {
      var country = (profile.country || "").toLowerCase().trim();
      if (/^(united states|usa|us|u\.s\.a?\.?|america|canada|mexico)$/i.test(country)) return "NORAM";
      if (/(united kingdom|britain|ireland|germany|france|spain|italy|netherlands|sweden|norway|denmark|poland|portugal|belgium|austria|switzerland|finland|greece|romania|bulgaria|hungary|czechia|israel|south africa|egypt|nigeria|saudi arabia|uae|kenya|morocco)/i.test(country)) return "EMEA";
      if (/(japan|china|india|south korea|^korea|australia|new zealand|singapore|hong kong|taiwan|thailand|vietnam|philippines|indonesia|malaysia|pakistan|bangladesh)/i.test(country)) return "APAC";
      if (/(brazil|argentina|chile|colombia|peru|venezuela|uruguay|paraguay|bolivia|ecuador|costa rica|panama|guatemala|honduras|nicaragua|el salvador|cuba|dominican republic|jamaica|haiti)/i.test(country)) return "LATAM";
    }
    return undefined;
  },

  shouldFillResumeInput(el) {
    var remoteUrl = document.querySelector(
      'input[name="candidate[resume_remote_url]"], input[name*="resume_remote_url"]'
    );
    if (remoteUrl && remoteUrl.value && /^https?:\/\//.test(remoteUrl.value)) return false;
    return undefined;
  }
};
