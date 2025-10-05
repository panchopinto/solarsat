# 🌞🛰️ SolarSat — Sistema Solar + Rastreador de Satélites (Frontend)

Proyecto web listo para publicar (GitHub Pages / Netlify) que incluye:
- **☀️ Sistema Solar 3D** con órbitas y panel lateral.
- **🌍 Visualizador Satelital** con carga de TLEs desde CelesTrak y propagación con `satellite.js`.
- **🧭 UI colorida con emojis**: botones grandes, tema claro/oscuro, búsqueda por **NORAD ID**.
- **📷 Captura de imagen** del canvas 3D.

## 🧩 Tech
- [three.js] (CDN), [satellite.js] (CDN), WebGL.
- Sin build steps, solo archivos estáticos.

## ▶️ Uso local
Por políticas del navegador, **debes servir los archivos con un servidor local** (CORS).
Opciones rápidas:
- Python 3: `python -m http.server 8000` (y abre http://localhost:8000)
- Node: `npx http-server .`

## 🚀 Páginas
- `index.html` → **🌍 Visualizador Satelital** (carga Starlink, NOAA, Weather, Active).
- `planets.html` → **☀️ Sistema Solar 3D**.

## 🔌 Fuentes de TLE
Se cargan desde CelesTrak (TLE "gp.php | FORMAT=tle"). Puedes cambiar o añadir fuentes en `js/satview.js`.
- Starlink: `https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle`
- NOAA: `https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=tle`
- Weather: `https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle`
- Active: `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle`

> Nota: Si tu navegador bloquea CORS, usa el servidor local. CelesTrak suele permitirlo correctamente.

## 🛰️ Búsqueda por NORAD
En la vista satelital, introduce un **NORAD ID** y pulsa **🔎 Buscar**. Se descargará su TLE desde:
`https://celestrak.org/NORAD/elements/gp.php?CATNR=<ID>&FORMAT=tle`

## 🎨 Personalización
- Colores y tema en `css/styles.css`.
- Constantes de tamaño/escala en `js/planets.js` y `js/satview.js`.

## 📁 Estructura
```
solarsat-repo/
  index.html
  planets.html
  css/styles.css
  js/planets.js
  js/satview.js
  js/ui.js
  assets/ (opcional para imágenes propias)
```

## 📸 Capturas
Usa el botón **📷 Captura** para descargar un PNG del canvas actual.

---

Hecho con cariño para Pancho 💚. Última actualización: 2025-10-05.
