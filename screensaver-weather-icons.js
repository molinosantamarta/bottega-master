/* Bottega Master: icone meteo animate dello screensaver.
 * Solo SVG/CSS locali: nessun servizio, font o libreria aggiuntiva.
 * Le icone descrivono il weather_code Open-Meteo già usato dal Master.
 */
(function (global) {
  'use strict';

  const rays = (cx, cy, r1, r2) =>
    Array.from({ length: 8 }, (_, i) => {
      const angle = i * Math.PI / 4;
      const x1 = cx + Math.cos(angle) * r1;
      const y1 = cy + Math.sin(angle) * r1;
      const x2 = cx + Math.cos(angle) * r2;
      const y2 = cy + Math.sin(angle) * r2;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }).join('');

  const sun = (x = 40, y = 40, size = 12) => `
    <g class="wx-sun">
      <g class="wx-sun-rays" stroke="#ffe7a4" stroke-width="3" stroke-linecap="round">
        ${rays(x, y, size + 6, size + 12)}
      </g>
      <circle class="wx-sun-halo" cx="${x}" cy="${y}" r="${size + 7}" fill="#ffc959" opacity=".16"/>
      <circle cx="${x}" cy="${y}" r="${size}" fill="url(#wx-sun)" stroke="#ffe6a1" stroke-width="1.5"/>
    </g>`;

  const moon = `
    <g class="wx-moon">
      <path d="M46 13c-13 4-20 15-19 27 1 13 12 23 25 22 6-.5 10-2 14-6-20 1-33-19-20-43z"
            fill="url(#wx-moon)" stroke="#fff0c5" stroke-width="1.4" stroke-linejoin="round"/>
      <path class="wx-twinkle" d="M19 16v9m-4.5-4.5h9" stroke="#fff4c6" stroke-width="2" stroke-linecap="round"/>
      <circle class="wx-twinkle-delayed" cx="62" cy="18" r="2" fill="#fff5d4"/>
    </g>`;

  const cloudBack = `
    <path class="wx-cloud-back" d="M13 49c-9 0-10-12-2-15 2-9 14-12 20-5 9-8 24-2 24 9 8 3 7 11-2 11H13Z"
      fill="url(#wx-cloud-back)" stroke="#f1f6ff" stroke-opacity=".55" stroke-width="1"/>`;

  const cloud = `
    <path class="wx-cloud-front" d="M19 57c-11 0-12-14-3-18 1-10 13-15 21-8 7-11 25-10 30 3 10 1 13 23-5 23H19Z"
      fill="url(#wx-cloud)" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" stroke-linejoin="round"/>`;

  const rain = (drizzle = false) => `
    <g class="wx-precip" fill="none" stroke="#8bdbff" stroke-width="${drizzle ? 2.5 : 3.4}" stroke-linecap="round">
      <path class="wx-rain wx-fall-1" d="M26 56l-4 9"/>
      <path class="wx-rain wx-fall-2" d="M43 57l-4 9"/>
      <path class="wx-rain wx-fall-3" d="M59 56l-4 9"/>
    </g>`;

  const snow = `
    <g class="wx-precip" fill="#e5f5ff" stroke="#d0ecff" stroke-width="1.4" stroke-linecap="round">
      <g class="wx-snow wx-fall-1"><path d="M24 57v8m-4-4h8m-7-3 6 6m0-6-6 6"/></g>
      <g class="wx-snow wx-fall-2"><path d="M42 60v8m-4-4h8m-7-3 6 6m0-6-6 6"/></g>
      <g class="wx-snow wx-fall-3"><path d="M61 56v8m-4-4h8m-7-3 6 6m0-6-6 6"/></g>
    </g>`;

  const fog = `
    <g class="wx-mist" fill="none" stroke="#d9e8ff" stroke-width="3" stroke-linecap="round">
      <path class="wx-fog wx-fog-1" d="M14 57h39"/>
      <path class="wx-fog wx-fog-2" d="M27 64h39"/>
      <path class="wx-fog wx-fog-3" d="M17 71h31"/>
    </g>`;

  const storm = `
    <path class="wx-bolt" d="M43 48L31 64h12l-5 13 23-23H47l5-6Z"
       fill="url(#wx-bolt)" stroke="#fff3b4" stroke-width="1.3" stroke-linejoin="round"/>`;

  const backdrop = `
    <defs>
      <linearGradient id="wx-sun" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff0a8"/>
        <stop offset="1" stop-color="#ffa827"/>
      </linearGradient>
      <linearGradient id="wx-moon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff9e0"/>
        <stop offset="1" stop-color="#e0e9ff"/>
      </linearGradient>
      <linearGradient id="wx-cloud" x1="0" y1="0" x2=".15" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#c0d4ee"/>
      </linearGradient>
      <linearGradient id="wx-cloud-back" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e8f3ff"/>
        <stop offset="1" stop-color="#9cb9d5"/>
      </linearGradient>
      <linearGradient id="wx-bolt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff4ac"/>
        <stop offset="1" stop-color="#ffc34c"/>
      </linearGradient>
    </defs>`;

  function classify(code, isDay) {
    const c = Number(code);
    if (c === 0) return isDay ? 'sun' : 'moon';
    if (c === 1 || c === 2) return isDay ? 'partly-day' : 'partly-night';
    if (c === 3) return 'cloud';
    if (c === 45 || c === 48) return 'fog';
    if ([51, 53, 55, 56, 57].includes(c)) return 'drizzle';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return 'rain';
    if ([71, 73, 75, 77, 85, 86].includes(c)) return 'snow';
    if ([95, 96, 99].includes(c)) return 'storm';
    return 'cloud';
  }

  function artwork(kind) {
    switch (kind) {
      case 'sun': return sun();
      case 'moon': return moon;
      case 'partly-day': return sun(26, 29, 10) + cloud;
      case 'partly-night': return moon + cloud;
      case 'cloud': return cloudBack + cloud;
      case 'fog': return cloudBack + fog;
      case 'drizzle': return cloud + rain(true);
      case 'rain': return cloud + rain();
      case 'snow': return cloud + snow;
      case 'storm': return cloudBack + cloud + storm;
      default: return cloud;
    }
  }

  function render(container, weatherCode, isDay) {
    if (!container) return;
    const kind = classify(weatherCode, isDay);
    // Non riavviare continuamente le animazioni quando arriva lo stesso meteo.
    if (container.dataset.weatherIcon === kind) return;
    container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="wx-illustration wx-${kind}"
      viewBox="0 0 80 80" width="80" height="80" focusable="false" aria-hidden="true">
      ${backdrop}${artwork(kind)}
    </svg>`;
    container.dataset.weatherIcon = kind;
  }

  global.BottegaScreensaverWeather = Object.freeze({ classify, render });
})(window);
