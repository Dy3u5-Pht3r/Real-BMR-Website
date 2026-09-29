export type LayerSource = "osm" | "seed" | "community";

export interface LayerConfig {
  id: string;
  label: string;
  emoji: string;
  color: string;
  source: LayerSource;
  /** Path to the GeoJSON file under src/data, relative, no extension */
  dataFile: string;
  description: string;
}

// Layers backed by OpenStreetMap / Overpass (run scripts/fetch-osm-layers.mjs to populate)
export const OSM_LAYERS: LayerConfig[] = [
  {
    id: "mosques",
    label: "Mosques",
    emoji: "🕌",
    color: "#0f766e",
    source: "osm",
    dataFile: "mosques",
    description: "Mosques and musallas (prayer rooms) in the Bangkok Metropolitan Region.",
  },
  {
    id: "islamic-schools",
    label: "Islamic Schools",
    emoji: "📗",
    color: "#1d4ed8",
    source: "osm",
    dataFile: "islamic-schools",
    description: "Islamic schools, madrasahs, and pondok.",
  },
  {
    id: "halal-food",
    label: "Halal Food",
    emoji: "🍽️",
    color: "#ea580c",
    source: "osm",
    dataFile: "halal-food",
    description: "Halal restaurants, shops, and certified markets.",
  },
  {
    id: "cemeteries",
    label: "Muslim Cemeteries",
    emoji: "⬛",
    color: "#44403c",
    source: "osm",
    dataFile: "cemeteries",
    description: "Muslim burial grounds.",
  },
  {
    id: "wudu",
    label: "Wudu Facilities",
    emoji: "🚰",
    color: "#0284c7",
    source: "osm",
    dataFile: "wudu",
    description: "Ablution facilities, usually attached to mosques.",
  },
  {
    id: "public-transport",
    label: "Public Transport",
    emoji: "🚌",
    color: "#64748b",
    source: "osm",
    dataFile: "public-transport",
    description: "Nearby BTS/MRT/bus stops for access to facilities.",
  },
];

// Layers with no reliable OSM tagging: research + seed manually, then open to public submissions
export const SEED_LAYERS: LayerConfig[] = [
  {
    id: "universities",
    label: "Muslim-friendly Universities",
    emoji: "🎓",
    color: "#7c3aed",
    source: "seed",
    dataFile: "universities",
    description: "Universities with prayer rooms, halal canteens, or active Muslim student groups.",
  },
  {
    id: "businesses",
    label: "Muslim-owned Businesses",
    emoji: "🏪",
    color: "#b45309",
    source: "community",
    dataFile: "businesses",
    description: "Muslim-owned shops and services.",
  },
  {
    id: "healthcare",
    label: "Muslim-friendly Healthcare",
    emoji: "🏥",
    color: "#dc2626",
    source: "seed",
    dataFile: "healthcare",
    description: "Clinics/hospitals known to accommodate Muslim patients (halal food, prayer space, gender-concordant staff on request).",
  },
  {
    id: "mental-health",
    label: "Mental Health Services",
    emoji: "🧠",
    color: "#0d9488",
    source: "seed",
    dataFile: "mental-health",
    description: "Mental health services, ideally culturally-aware providers.",
  },
  {
    id: "elderly",
    label: "Elderly Services",
    emoji: "🧓",
    color: "#a16207",
    source: "seed",
    dataFile: "elderly",
    description: "Elderly care and community centers.",
  },
  {
    id: "child-welfare",
    label: "Orphan / Child Welfare",
    emoji: "🧒",
    color: "#be185d",
    source: "seed",
    dataFile: "child-welfare",
    description: "Orphan care and child welfare organizations.",
  },
  {
    id: "zakat",
    label: "Zakat / Sadaqah Organizations",
    emoji: "🤲",
    color: "#15803d",
    source: "seed",
    dataFile: "zakat",
    description: "Organizations collecting/distributing zakat and sadaqah.",
  },
  {
    id: "womens-facilities",
    label: "Women's Facilities",
    emoji: "🧕",
    color: "#c026d3",
    source: "seed",
    dataFile: "womens-facilities",
    description: "Women-only prayer spaces, changing rooms, and services.",
  },
  {
    id: "shelters",
    label: "Emergency Shelters",
    emoji: "🚨",
    color: "#e11d48",
    source: "seed",
    dataFile: "shelters",
    description: "Emergency shelters accessible in a crisis.",
  },
  {
    id: "gov-services",
    label: "Government Services",
    emoji: "🏛️",
    color: "#334155",
    source: "seed",
    dataFile: "gov-services",
    description: "Relevant government offices (Islamic Committee offices, district offices).",
  },
  {
    id: "legal-aid",
    label: "Legal / Social Assistance",
    emoji: "⚖️",
    color: "#374151",
    source: "seed",
    dataFile: "legal-aid",
    description: "Legal aid and social assistance organizations.",
  },
];

// Context layers (areas/polygons, not points)
export const CONTEXT_LAYERS: LayerConfig[] = [
  {
    id: "muslim-communities",
    label: "Muslim-majority Communities",
    emoji: "🏘️",
    color: "#166534",
    source: "seed",
    dataFile: "muslim-communities",
    description: "Districts/sub-districts (tambon) with a high share of Muslim residents.",
  },
  {
    id: "flood-prone",
    label: "Flood-prone Areas",
    emoji: "🌊",
    color: "#0369a1",
    source: "osm",
    dataFile: "flood-prone",
    description: "Areas with known flood risk.",
  },
];

export const NEEDS_GAP_LAYER: LayerConfig = {
  id: "needs-gap",
  label: "Community Needs Gap",
  emoji: "📊",
  color: "#9f1239",
  source: "seed",
  dataFile: "needs-gap",
  description:
    "Estimated Muslim population per area vs. distance to nearest key facility (halal food, Islamic school, prayer facility, emergency shelter). Population figures are approximate, drawn from the best available census/survey estimates.",
};

// Base administrative layer: district boundaries across the BMR
export const BASE_LAYERS: LayerConfig[] = [
  {
    id: "districts",
    label: "District Boundaries",
    emoji: "🗺️",
    color: "#78716c",
    source: "osm",
    dataFile: "districts",
    description: "District (khet/amphoe) boundaries across the Bangkok Metropolitan Region.",
  },
];

export const ALL_LAYERS: LayerConfig[] = [
  ...BASE_LAYERS,
  ...OSM_LAYERS,
  ...SEED_LAYERS,
  ...CONTEXT_LAYERS,
  NEEDS_GAP_LAYER,
];
