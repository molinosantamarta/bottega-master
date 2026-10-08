Meteocons — Flat animated and static SVG weather icons
Copyright (c) 2020-present Bas Milius. License: MIT (see LICENSE).
Official project: https://github.com/basmilius/meteocons
Vendored reference: https://github.com/Supermagnum/Navi/tree/main/plugins/weather

Nine icons in each of the two directories (animated and static) are copied
byte-for-byte from the Agri-Agenda PWA in repository molinosantamarta/website-1:
agri-agenda-app/pwa/assets/weather/{animated,static}/

Three additional matching night icons (clear-night, mostly-clear-night and
partly-cloudy-night) are original Meteocons Flat SVG assets from the same
vendored reference, because the Bottega screensaver uses current conditions
including nighttime while Agri-Agenda uses daily forecasts.

No CDN or external icon library. When the screensaver is hidden, or when
prefers-reduced-motion is enabled, the static SVGs replace the animated SVGs.
