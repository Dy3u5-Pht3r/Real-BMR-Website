#!/usr/bin/env node
/**
 * Pulls OSM-backed layers for riaayahBMR via the Overpass API and writes
 * GeoJSON into src/data/. Run locally (this project's sandbox can't reach
 * the Overpass API): `node scripts/fetch-osm-layers.mjs`
 *
 * Bounding box roughly covers the Bangkok Metropolitan Region (Bangkok +
 * Nonthaburi, Pathum Thani, Samut Prakan, Nakhon Pathom, Samut Sakhon).
 * Tighten it if queries time out.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const BBOX = "13.40,100.20,14.20,100.95"; // south,west,north,east
const DATA_DIR = new URL("../src/data/", import.meta.url);

// Each entry: output filename (without .json) -> Overpass QL query body
const QUERIES = {
  mosques: `
    node["amenity"="place_of_worship"]["religion"="muslim"](${BBOX});
    way["amenity"="place_of_worship"]["religion"="muslim"](${BBOX});
  `,
  "islamic-schools": `
    node["amenity"="school"]["religion"="muslim"](${BBOX});
    way["amenity"="school"]["religion"="muslim"](${BBOX});
    node["amenity"="place_of_worship"]["religion"="muslim"]["madrasa"="yes"](${BBOX});
  `,
  "halal-food": `
    node["diet:halal"="only"](${BBOX});
    node["diet:halal"="yes"](${BBOX});
    way["diet:halal"="only"](${BBOX});
    way["diet:halal"="yes"](${BBOX});
  `,
  cemeteries: `
    node["landuse"="cemetery"]["religion"="muslim"](${BBOX});
    way["landuse"="cemetery"]["religion"="muslim"](${BBOX});
  `,
  wudu: `
    node["amenity"="place_of_worship"]["religion"="muslim"]["ablution"="yes"](${BBOX});
  `,
  "public-transport": `
    node["highway"="bus_stop"](${BBOX});
    node["railway"="station"](${BBOX});
  `,
};

function toGeoJSON(overpassJson) {
  const features = overpassJson.elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) return null;
      return {
        type: "Feature",
        properties: {
          name: el.tags?.name ?? el.tags?.["name:en"] ?? "Unnamed",
          osm_id: el.id,
          ...el.tags,
        },
        geometry: { type: "Point", coordinates: [lon, lat] },
      };
    })
    .filter(Boolean);
  return { type: "FeatureCollection", features };
}

async function fetchLayer(name, body) {
  const query = `[out:json][timeout:60];(${body});out center;`;
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });
  if (!res.ok) {
    throw new Error(`Overpass query for "${name}" failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const geojson = toGeoJSON(json);
  const outPath = new URL(`${name}.json`, DATA_DIR);
  await writeFile(outPath, JSON.stringify(geojson, null, 2));
  console.log(`✓ ${name}: ${geojson.features.length} features -> ${path.basename(outPath.pathname)}`);
}

async function main() {
  for (const [name, body] of Object.entries(QUERIES)) {
    try {
      await fetchLayer(name, body);
      // Be polite to the public Overpass instance.
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`✗ ${name}:`, err.message);
    }
  }
}

main();
