/* Meteocons Flat (Agri-Agenda), with stable image transitions.
 * Preserve the current icon until the next SVG has loaded and decoded.
 * No weather image is reloaded when the screensaver opens or closes.
 */
(function (global) {
  "use strict";
  const root = "./assets/weather/";
  const motion = global.matchMedia?.("(prefers-reduced-motion: reduce)") || null;
  const available = new Set([
    "clear-day", "clear-night", "mostly-clear-day", "mostly-clear-night",
    "partly-cloudy-day", "partly-cloudy-night", "cloudy", "fog",
    "drizzle", "rain", "snow", "thunderstorms-rain"
  ]);
  const fallbackIcons = Object.freeze({
    "clear-day": "☀", "clear-night": "☾",
    "mostly-clear-day": "⛅", "mostly-clear-night": "☾",
    "partly-cloudy-day": "⛅", "partly-cloudy-night": "☾",
    cloudy: "☁", fog: "🌫", drizzle: "🌦",
    rain: "🌧", snow: "🌨", "thunderstorms-rain": "⛈"
  });

  let container = null;
  let selectedIcon = null;
  let pending = null;
  let requestId = 0;

  function classify(code, isDay) {
    const n = Number(code);
    const day = Boolean(isDay);
    if (n === 0) return day ? "clear-day" : "clear-night";
    if (n === 1) return day ? "mostly-clear-day" : "mostly-clear-night";
    if (n === 2) return day ? "partly-cloudy-day" : "partly-cloudy-night";
    if (n === 3) return "cloudy";
    if (n === 45 || n === 48) return "fog";
    if ([51, 53, 55, 56, 57].includes(n)) return "drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(n)) return "rain";
    if ([71, 73, 75, 77, 85, 86].includes(n)) return "snow";
    if ([95, 96, 99].includes(n)) return "thunderstorms-rain";
    return "cloudy";
  }

  function getSrc(slug) {
    const name = available.has(slug) ? slug : "cloudy";
    // Meteocons thunderstorm SVG deliberately strobes its lightning.
    // Use the official static variant to avoid flashes in the screensaver.
    const useStatic = Boolean(motion?.matches) || name === "thunderstorms-rain";
    return root + (useStatic ? "static" : "animated") + "/" + name + ".svg";
  }

  function refresh() {
    if (!container || !selectedIcon) return;
    const target = container;
    const name = selectedIcon;
    const source = getSrc(name);
    const visible = target.querySelector('img[data-weather-icon]');
    if (visible?.getAttribute("src") === source) {
      // The current icon is already correct: never restart its animation.
      pending = null;
      ++requestId;
      return;
    }
    if (pending?.src === source && pending.target === target) return;

    const id = ++requestId;
    pending = { src: source, target };
    const img = global.document.createElement("img");
    img.className = "wx-meteocon";
    img.dataset.weatherIcon = name;
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    img.setAttribute("aria-hidden", "true");

    let finished = false;
    function onLoad() {
      if (finished) return;
      finished = true;
      // decode() ensures that the image is ready before replacing the old one.
      const decoded = typeof img.decode === "function" ? img.decode().catch(() => {}) : Promise.resolve();
      Promise.resolve(decoded).then(() => {
        if (id !== requestId || container !== target) return;
        pending = null;
        target.replaceChildren(img);
      });
    }
    function onError() {
      if (finished) return;
      finished = true;
      if (id !== requestId || container !== target) return;
      pending = null;
      // A failed download must never erase an existing, correctly drawn icon.
      if (!target.querySelector('img[data-weather-icon]')) {
        target.textContent = fallbackIcons[name] || "☁";
      }
    }

    img.addEventListener("load", onLoad, { once: true });
    img.addEventListener("error", onError, { once: true });
    img.setAttribute("src", source);
    // Handle browser memory-cache hits without requiring an extra render cycle.
    if (img.complete && img.naturalWidth > 0) onLoad();
  }

  function render(target, weatherCode, isDay) {
    if (!target) return;
    if (target !== container) {
      container = target;
      pending = null;
      ++requestId;
    }
    selectedIcon = classify(weatherCode, isDay);
    if (!target.querySelector('img[data-weather-icon]')) {
      // Avoid showing the HTML placeholder sun before the correct SVG loads.
      target.textContent = "";
    }
    refresh();
  }

  if (motion?.addEventListener) motion.addEventListener("change", refresh);
  else if (motion?.addListener) motion.addListener(refresh);

  global.BottegaScreensaverWeather = Object.freeze({ classify, getSrc, render });
})(window);
