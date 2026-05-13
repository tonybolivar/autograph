(() => {
  if (window.__AUTOGRAPH_BREEZY_MAIN__) return;
  window.__AUTOGRAPH_BREEZY_MAIN__ = true;

  window.addEventListener("message", (e) => {
    if (e.source !== window) return;
    const msg = e.data;
    if (!msg || msg.__autograph !== "angular_fill") return;
    if (typeof window.angular === "undefined") return;
    try {
      const el = document.querySelector(msg.selector);
      if (!el) return;
      const scope = window.angular.element(el).scope();
      if (!scope) return;
      const path = (msg.ngModel || "").split(".");
      let target = scope;
      for (let i = 0; i < path.length - 1; i++) {
        if (target[path[i]] == null) return;
        target = target[path[i]];
      }
      target[path[path.length - 1]] = msg.value;
      scope.$apply();
    } catch (err) {}
  });
})();
