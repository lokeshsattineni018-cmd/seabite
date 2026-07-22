(function() {
  let scriptsLoaded = false;
  function loadThirdPartyScripts() {
    if (scriptsLoaded) return;
    scriptsLoaded = true;

    // 1. Google Analytics & GTM
    const gaScript = document.createElement("script");
    gaScript.src = "https://www.googletagmanager.com/gtag/js?id=G-RRX22SZFZ6";
    gaScript.async = true;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-RRX22SZFZ6');

    // 2. Google AdSense
    const adsScript = document.createElement("script");
    adsScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7987185559210412";
    adsScript.async = true;
    adsScript.crossOrigin = "anonymous";
    document.head.appendChild(adsScript);
  }

  // Load on user interaction
  const triggerEvents = ["touchstart", "scroll", "mousemove", "keydown", "click"];
  triggerEvents.forEach(e => window.addEventListener(e, loadThirdPartyScripts, { passive: true, once: true }));

  // Load on timeout fallback (after 3.5s of idle time)
  window.addEventListener("load", () => {
    setTimeout(loadThirdPartyScripts, 3500);
  });
})();
