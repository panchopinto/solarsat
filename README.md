# 🌞🛰️ SolarSat — Sistema Solar + Rastreador Satelital + Mapa 2D (Leaflet)

**NUEVO (v2):**
- 🗺️ **Mapa 2D con Leaflet** y *ground-track* (trayectoria sobre la Tierra).
- 🎛️ **Filtros por altitud e inclinación** (mín/máx) tanto en 3D como en 2D.
- 🔎 **Búsqueda por NORAD** (mantener).
- 📷 **Captura de canvas** (mantener).

## Páginas
- `index.html` → 🌍 Visor 3D de satélites (three.js + satellite.js) **con filtros**.
- `map.html` → 🗺️ Mapa 2D Leaflet + ground-track en vivo **con filtros**.
- `planets.html` → ☀️ Sistema Solar 3D (educativo).

## Rápido inicio
1. Servidor local (evita CORS):
   - Python: `python -m http.server 8000`
   - Node: `npx http-server .`
2. Abre `http://localhost:8000`
3. Usa los botones: Starlink/NOAA/Weather/Active, o busca por NORAD.

## Fuentes TLE (CelesTrak)
- Starlink: `https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle`
- NOAA: `https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=tle`
- Weather: `https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle`
- Active: `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle`
- NORAD: `https://celestrak.org/NORAD/elements/gp.php?CATNR=<ID>&FORMAT=tle`

> Si tu navegador bloquea CORS, usa el servidor local o publica en GitHub Pages.

Hecho con cariño para Pancho 💚 • 2025-10-05
