# SOLARSAT

Repositorio listo para abrir en local y correr todo en el navegador: **Sistema Solar 3D** + **Mapa 2D con ground-track** y **filtros por altitud/inclinación**.

## Cómo ejecutar
- Solo **abre `index.html`** haciendo doble clic. Todo usa CDNs con HTTPS (no requiere servidor local).
- Para el mapa, se consultan TLEs desde **CelesTrak** por HTTPS. Si estás **offline**, verás demo con ISS precargada.

## Si “no cargan los satélites” (checklist)
1. **Bloqueo por conexión**: ¿Estás sin internet o detrás de un firewall que bloquea `celestrak.org`?
2. **CORS/HTTPS**: El repo usa `fetch` hacia HTTPS, que funciona desde `file://` en Chrome/Edge. Si tu navegador bloquea, prueba abrir con **Live Server** (VSCode) o `python -m http.server`.
3. **Demasiados satélites**: El filtro por defecto trae pocos objetos (ISS, HUBBLE, NOAA). Activa **“Cargar Activos (lento)”** para más, o mantén el conjunto pequeño.
4. **Reloj del sistema**: Si tu hora local está fuera de rango, la traza puede verse desfasada. Ajusta el reloj.
5. **Errores de consola**: Abre F12 y revisa. El panel superior mostrará el último error legible.

## 5 sugerencias implementadas
1. **🎚️ Filtros por altitud e inclinación** (numéricos con rango).
2. **🕒 Auto‑refresh** cada 30 s (toggleable).
3. **🗺️ Modo “solo posición” vs “posición + traza 90′”** para rendimiento.
4. **📦 Bundle “Demo Offline”** (ISS incluida localmente si CelesTrak falla).
5. **💾 Exportar GeoJSON** de la traza actual (botón “Exportar”).

## Roadmap (próximas ideas)
- Clustering de satélites + búsqueda por NORAD/Name.
- Colorear por tipo (LEO/MEO/GEO) y leyenda.
- Líneas de sensor FOV y footprint.
- Botón “Seguir satélite” con recuadro de datos en vivo.
- Cache de TLE (localStorage) con expiración de 24 h.
