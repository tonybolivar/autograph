(() => {
  if (window.__AUTOGRAPH_BHR_MAIN__) return;
  window.__AUTOGRAPH_BHR_MAIN__ = true;

  window.addEventListener("message", (e) => {
    if (e.source !== window) return;
    const msg = e.data;
    if (!msg || msg.__autograph !== "react_fill") return;
    const el = document.querySelector(msg.selector);
    if (!el) return;
    try {
      if (el._valueTracker) el._valueTracker.setValue("");
      const proto = el.tagName === "TEXTAREA"
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, msg.value);
      else el.value = msg.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (err) {}
  });
})();
