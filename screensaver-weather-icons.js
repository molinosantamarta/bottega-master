/* Exact Meteocons Flat artwork used in Agri-Agenda, plus matching night variants.
 * Local assets and MIT license: ./assets/weather/.
 * Animated SVGs load only while the Bottega screensaver is visible.
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
  let container = null;
  let screensaver = null;
  let observing = false;
  const fallbackIcons = Object.freeze({
    "clear-day": "☀", "clear-night": "☾",
    "mostly-clear-day": "⛅", "mostly-clear-night": "☾",
    "partly-cloudy-day": "⛅", "partly-cloudy-night": "☾",
    cloudy: "☁", fog: "🌫", drizzle: "🌦",
    rain: "🌧", snow: "🌨", "thunderstorms-rain": "⛈"
  });

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
    const animate = !motion?.matches && !!screensaver?.classList.contains("active");
    return root + (animate ? "animated" : "static") + "/" + name + ".svg";
  }

  function refresh() {
    const img = container?.querySelector("img[data-weather-icon]");
    if (!img) return;
    const src = getSrc(img.dataset.weatherIcon);
    if (img.getAttribute("src") !== src) img.setAttribute("src", src);
  }

  function ensureObservers() {
    if (observing) return;
    screensaver = global.document?.getElementById("screensaver-modal");
    if (!screensaver) return;
    observing = true;
    if (global.MutationObserver) {
      new global.MutationObserver(refresh).observe(screensaver, {
        attributes: true, attributeFilter: ["class"]
      });
    }
    if (motion?.addEventListener) motion.addEventListener("change", refresh);
    else if (motion?.addListener) motion.addListener(refresh);
  }

  function render(target, weatherCode, isDay) {
    if (!target) return;
    container = target;
    ensureObservers();
    const name = classify(weatherCode, isDay);
    let img = target.querySelector("img[data-weather-icon]");
    if (!img) {
      img = global.document.createElement("img");
      img.className = "wx-meteocon";
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      img.setAttribute("aria-hidden", "true");
      img.addEventListener("error", () => {
        if (img.isConnected) target.textContent = fallbackIcons[img.dataset.weatherIcon] || "☁";
      });
      target.replaceChildren(img);
    }
    img.dataset.weatherIcon = name;
    refresh();
  }

  global.BottegaScreensaverWeather = Object.freeze({ classify, getSrc, render });
})(window);
