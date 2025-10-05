
(function(){
  const dict = {
    es: {
      nav_home: "🏠 Inicio",
      nav_3d: "🪐 3D",
      nav_ar: "📱 AR",
      nav_vr: "🕶️ VR",
      nav_map: "🛰️ Ground-Track",
      nav_help: "❓ Ayuda",
      nav_globe: "🌍 Globo 3D",

      index_title_3d: "🪐 Sistema Solar 3D",
      index_desc_3d: "Visualización con órbitas y panel rápido AR/VR.",
      index_title_ar: "📱 Realidad Aumentada",
      index_desc_ar: "ISS y Júpiter .glb (model-viewer/WebXR).",
      index_title_vr: "🕶️ Realidad Virtual",
      index_desc_vr: "Escena simple con ISS (A-Frame).",
      index_title_map: "🛰️ Ground-Track",
      index_desc_map: "Búsqueda incremental, filtro LEO/MEO/GEO, HUD con “Seguir”.",
      index_title_help: "❓ Ayuda",
      index_desc_help: "Guía y troubleshooting.",

      map_title: "🛰️ Ground-Track Satélites",
      lbl_sat: "Satélite",
      lbl_altmin: "Altitud min (km)",
      lbl_altmax: "Altitud max (km)",
      lbl_incmin: "Inclinación min (°)",
      lbl_incmax: "Inclinación max (°)",
      lbl_regime: "Regímen orbital",
      opt_all: "Todos",
      lbl_search: "Búsqueda",
      lbl_colorlegend: "Color:",
      chk_track: "Dibujar traza (90′)",
      chk_autorefresh: "Auto-refresh (30 s)",
      btn_load: "🔄 Cargar",
      btn_export: "⬇️ Exportar GeoJSON",
      tip_active: "Tip: activa “Cargar Activos (lento)” para miles de TLEs (puede tardar).",
      cov_title: "Cobertura",
      btn_footprint: "🌐 Footprint",
      fov_label: "FOV (°)",
      btn_fov: "🎯 Dibujar FOV",
      export_link: "Exportar & Enlace",
      btn_kml: "📤 KML",
      btn_gpx: "📤 GPX",
      btn_link: "🔗 Copiar enlace",
      class_pro: "🎓 Modo Clase Pro (escenas)",
      preset_select: "Selecciona una escena…",
      preset_iss: "ISS sobre Chile",
      preset_geo: "Anillo GEO",
      preset_passes: "Pases de hoy",
      btn_apply: "▶️ Aplicar",
      time_label: "Tiempo (±12 h)",
      btn_now: "⏱️ Ahora",
      passes_label: "Predicción de pases (24 h)",
      notice_geo: "Si dejas lat/lon vacíos, usamos tu ubicación del navegador (si la autorizas).",

      solar_title: "🪐 Sistema Solar 3D",
      solar_present: "🎬 Presentación",

      ar_title: "📱 Realidad Aumentada",
      vr_title: "🕶️ Realidad Virtual",
      globe_title: "🌍 Globo 3D con terminador"
    },
    en: {
      nav_home: "🏠 Home",
      nav_3d: "🪐 3D",
      nav_ar: "📱 AR",
      nav_vr: "🕶️ VR",
      nav_map: "🛰️ Ground-Track",
      nav_help: "❓ Help",
      nav_globe: "🌍 3D Globe",

      index_title_3d: "🪐 Solar System 3D",
      index_desc_3d: "Orbits visualization with quick AR/VR panel.",
      index_title_ar: "📱 Augmented Reality",
      index_desc_ar: "ISS and Jupiter .glb (model-viewer/WebXR).",
      index_title_vr: "🕶️ Virtual Reality",
      index_desc_vr: "Simple scene with ISS (A-Frame).",
      index_title_map: "🛰️ Ground-Track",
      index_desc_map: "Incremental search, LEO/MEO/GEO filter, HUD with “Follow”.",
      index_title_help: "❓ Help",
      index_desc_help: "Guide & troubleshooting.",

      map_title: "🛰️ Satellite Ground-Track",
      lbl_sat: "Satellite",
      lbl_altmin: "Min altitude (km)",
      lbl_altmax: "Max altitude (km)",
      lbl_incmin: "Min inclination (°)",
      lbl_incmax: "Max inclination (°)",
      lbl_regime: "Orbital regime",
      opt_all: "All",
      lbl_search: "Search",
      lbl_colorlegend: "Color:",
      chk_track: "Draw track (90′)",
      chk_autorefresh: "Auto-refresh (30 s)",
      btn_load: "🔄 Load",
      btn_export: "⬇️ Export GeoJSON",
      tip_active: "Tip: use “Load Actives (slow)” for thousands of TLEs (may take a while).",
      cov_title: "Coverage",
      btn_footprint: "🌐 Footprint",
      fov_label: "FOV (°)",
      btn_fov: "🎯 Draw FOV",
      export_link: "Export & Link",
      btn_kml: "📤 KML",
      btn_gpx: "📤 GPX",
      btn_link: "🔗 Copy link",
      class_pro: "🎓 Class Mode Pro (scenes)",
      preset_select: "Pick a scene…",
      preset_iss: "ISS over Chile",
      preset_geo: "GEO ring",
      preset_passes: "Passes today",
      btn_apply: "▶️ Apply",
      time_label: "Time (±12 h)",
      btn_now: "⏱️ Now",
      passes_label: "Pass prediction (24 h)",
      notice_geo: "Leave lat/lon blank to use your browser location (if allowed).",

      solar_title: "🪐 Solar System 3D",
      solar_present: "🎬 Presentation",

      ar_title: "📱 Augmented Reality",
      vr_title: "🕶️ Virtual Reality",
      globe_title: "🌍 3D Globe with terminator"
    }
  };

  function applyLang(lang){
    const d = dict[lang] || dict.es;
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if(d[key]) el.textContent = d[key];
    });
    localStorage.setItem('lang', lang);
  }
  function init(){
    const lang = localStorage.getItem('lang') || 'es';
    applyLang(lang);
    const enBtn = document.getElementById('btnEN');
    const esBtn = document.getElementById('btnES');
    enBtn && enBtn.addEventListener('click', ()=> applyLang('en'));
    esBtn && esBtn.addEventListener('click', ()=> applyLang('es'));
  }
  document.addEventListener('DOMContentLoaded', init);
  window.SOLARSAT_I18N = {applyLang};
})();
