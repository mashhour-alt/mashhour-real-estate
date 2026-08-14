/**
 * Basemap tiles come from MapTiler so that place labels can follow the site
 * language. MapTiler serves one rasterised map per published style, and the
 * label language is baked into the style — so we point at two style IDs rather
 * than passing a language query parameter (the raster endpoint has none).
 *
 * The key is public by design (it ships in the browser bundle); it is protected
 * by the allowed-origins list configured in the MapTiler dashboard.
 */
export const MAPTILER_KEY = "8f6i18JLx3QHFJJJTOjc";

/** Local-language labels: in the UAE this renders Arabic place names. */
export const MAP_STYLE_ARABIC = "streets-v2";

/**
 * English-label style. Replace with the ID of a style duplicated in MapTiler
 * Map Designer with its label language set to English; until then it falls back
 * to the local-language style so the map still renders.
 */
export const MAP_STYLE_ENGLISH = "streets-v2";

export const MAPTILER_ATTRIBUTION =
  '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>';

export const tileUrlFor = (arabic: boolean) =>
  `https://api.maptiler.com/maps/${arabic ? MAP_STYLE_ARABIC : MAP_STYLE_ENGLISH}/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
