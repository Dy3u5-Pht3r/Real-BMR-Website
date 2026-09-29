"use client";

import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ALL_LAYERS, LayerConfig } from "@/lib/layers";
import { getSupabase, SUPABASE_CONFIGURED, SubmissionRow } from "@/lib/supabase";

// Statically import every built-in layer's GeoJSON. Empty files render nothing until populated.
import districts from "@/data/districts.json";
import mosques from "@/data/mosques.json";
import islamicSchools from "@/data/islamic-schools.json";
import halalFood from "@/data/halal-food.json";
import cemeteries from "@/data/cemeteries.json";
import wudu from "@/data/wudu.json";
import publicTransport from "@/data/public-transport.json";
import universities from "@/data/universities.json";
import businesses from "@/data/businesses.json";
import healthcare from "@/data/healthcare.json";
import mentalHealth from "@/data/mental-health.json";
import elderly from "@/data/elderly.json";
import childWelfare from "@/data/child-welfare.json";
import zakat from "@/data/zakat.json";
import womensFacilities from "@/data/womens-facilities.json";
import shelters from "@/data/shelters.json";
import govServices from "@/data/gov-services.json";
import legalAid from "@/data/legal-aid.json";
import muslimCommunities from "@/data/muslim-communities.json";
import floodProne from "@/data/flood-prone.json";
import needsGap from "@/data/needs-gap.json";

type GeoFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
};

type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

const BUILT_IN_DATA: Record<string, GeoFeatureCollection> = {
  districts,
  mosques,
  "islamic-schools": islamicSchools,
  "halal-food": halalFood,
  cemeteries,
  wudu,
  "public-transport": publicTransport,
  universities,
  businesses,
  healthcare,
  "mental-health": mentalHealth,
  elderly,
  "child-welfare": childWelfare,
  zakat,
  "womens-facilities": womensFacilities,
  shelters,
  "gov-services": govServices,
  "legal-aid": legalAid,
  "muslim-communities": muslimCommunities,
  "flood-prone": floodProne,
  "needs-gap": needsGap,
} as unknown as Record<string, GeoFeatureCollection>;

// A layer added at runtime by dropping in a GeoJSON file — no code changes needed.
interface UploadedLayer {
  id: string;
  label: string;
  emoji: string;
  color: string;
  data: GeoFeatureCollection;
}

const UPLOAD_COLORS = ["#f97316", "#22c55e", "#3b82f6", "#e11d48", "#a855f7", "#eab308"];

// Bangkok Metropolitan Region center
const BMR_CENTER: [number, number] = [13.75, 100.55];
const BMR_ZOOM = 11;

function featureLabel(properties: Record<string, unknown>, fallback: string) {
  return String(
    properties.name ?? properties.district ?? properties.title ?? fallback
  );
}

function popupContent(layer: { emoji: string; label: string }, properties: Record<string, unknown>) {
  const skip = new Set(["name", "osm_id"]);
  const rows = Object.entries(properties).filter(
    ([k, v]) => !skip.has(k) && v !== null && v !== undefined && v !== ""
  );
  return (
    <div className="text-sm">
      <p className="font-semibold">
        {layer.emoji} {featureLabel(properties, layer.label)}
      </p>
      {rows.slice(0, 6).map(([k, v]) => (
        <p key={k} className="mt-0.5 text-neutral-600">
          <span className="capitalize text-neutral-400">{k}:</span> {String(v)}
        </p>
      ))}
    </div>
  );
}

export default function MapView() {
  const [dark, setDark] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(
    () => new Set(["districts", "mosques", "halal-food", "islamic-schools"])
  );
  const [uploadedLayers, setUploadedLayers] = useState<UploadedLayer[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [approvedByLayer, setApprovedByLayer] = useState<Record<string, GeoFeature[]>>({});

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase
      .from("submissions")
      .select("*")
      .eq("status", "approved")
      .then(({ data, error }) => {
        if (error || !data) return;
        const grouped: Record<string, GeoFeature[]> = {};
        for (const row of data as SubmissionRow[]) {
          const feature: GeoFeature = {
            type: "Feature",
            properties: { name: row.name, notes: row.description ?? undefined },
            geometry: { type: "Point", coordinates: [row.lng, row.lat] },
          };
          (grouped[row.layer_id] ??= []).push(feature);
        }
        setApprovedByLayer(grouped);
      });
  }, []);

  const toggleLayer = (id: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFile = useCallback(
    (file: File) => {
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const fc: GeoFeatureCollection | null =
            parsed.type === "FeatureCollection"
              ? parsed
              : parsed.type === "Feature"
              ? { type: "FeatureCollection", features: [parsed] }
              : null;
          if (!fc) throw new Error("Not a GeoJSON Feature or FeatureCollection");

          const id = `upload-${Date.now()}`;
          const color = UPLOAD_COLORS[uploadedLayers.length % UPLOAD_COLORS.length];
          const label = file.name.replace(/\.(geo)?json$/i, "");
          setUploadedLayers((prev) => [...prev, { id, label, emoji: "📌", color, data: fc }]);
          setActiveLayers((prev) => new Set(prev).add(id));
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : "Couldn't read that file");
        }
      };
      reader.readAsText(file);
    },
    [uploadedLayers.length]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const layersWithCounts = useMemo(
    () =>
      ALL_LAYERS.map((layer) => {
        const base = BUILT_IN_DATA[layer.dataFile]?.features.length ?? 0;
        const approved = approvedByLayer[layer.id]?.length ?? 0;
        return { layer, count: base + approved };
      }),
    [approvedByLayer]
  );

  const mergedData = useCallback(
    (layer: LayerConfig): GeoFeatureCollection => {
      const base = BUILT_IN_DATA[layer.dataFile]?.features ?? [];
      const approved = approvedByLayer[layer.id] ?? [];
      return { type: "FeatureCollection", features: [...base, ...approved] };
    },
    [approvedByLayer]
  );

  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div
      className={`flex h-screen w-full ${dark ? "dark" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              riaayahBMR
            </h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Muslim community safety & resource map — BMR
            </p>
          </div>
          <button
            onClick={() => setDark((d) => !d)}
            className="shrink-0 rounded-full border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
            title="Toggle dark mode"
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="mt-4 space-y-1">
          {layersWithCounts.map(({ layer, count }) => (
            <LayerToggle
              key={layer.id}
              layer={layer}
              active={activeLayers.has(layer.id)}
              count={count}
              onToggle={() => toggleLayer(layer.id)}
            />
          ))}
        </div>

        {uploadedLayers.length > 0 && (
          <>
            <p className="mt-4 text-xs font-semibold uppercase text-neutral-400">
              Your uploads
            </p>
            <div className="mt-1 space-y-1">
              {uploadedLayers.map((layer) => (
                <LayerToggle
                  key={layer.id}
                  layer={layer}
                  active={activeLayers.has(layer.id)}
                  count={layer.data.features.length}
                  onToggle={() => toggleLayer(layer.id)}
                />
              ))}
            </div>
          </>
        )}

        <label className="mt-4 block cursor-pointer rounded-md border-2 border-dashed border-neutral-300 p-3 text-center text-xs text-neutral-500 hover:border-emerald-400 hover:text-emerald-700 dark:border-neutral-700 dark:text-neutral-400">
          Drop a .geojson file here, or click to add a layer
          <input
            type="file"
            accept=".json,.geojson,application/json,application/geo+json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}

        <div className="mt-4 rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Layers with a count of 0 have no data yet. See{" "}
          <code>scripts/fetch-osm-layers.mjs</code> to pull live OSM data, or
          drop in your own GeoJSON above.
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <Link href="/resources" className="text-emerald-700 underline dark:text-emerald-400">
            Resources & Helplines
          </Link>
          <Link href="/submit" className="text-emerald-700 underline dark:text-emerald-400">
            + Submit a location
          </Link>
          <Link href="/admin" className="text-neutral-400 underline">
            Admin
          </Link>
        </div>
        {!SUPABASE_CONFIGURED && (
          <p className="mt-1 text-xs text-neutral-400">
            (Community submissions need Supabase env vars set — see README)
          </p>
        )}
      </aside>

      <main className="relative flex-1">
        <MapContainer
          center={BMR_CENTER}
          zoom={BMR_ZOOM}
          scrollWheelZoom
          className={`h-full w-full ${dark ? "map-dark" : ""}`}
        >
          <TileLayer attribution={tileAttribution} url={tileUrl} />

          {ALL_LAYERS.filter((l) => activeLayers.has(l.id)).map((layer) =>
            renderLayer(layer, mergedData(layer))
          )}

          {uploadedLayers
            .filter((l) => activeLayers.has(l.id))
            .map((layer) => renderLayer(layer, layer.data))}
        </MapContainer>
      </main>
    </div>
  );
}

function renderLayer(
  layer: { id: string; color: string; emoji: string; label: string },
  fc: GeoFeatureCollection | undefined
) {
  if (!fc) return null;

  const points = fc.features.filter((f) => f.geometry.type === "Point");
  const shapes = fc.features.filter(
    (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
  );

  return (
    <Fragment key={layer.id}>
      {shapes.length > 0 && (
        <GeoJSON
          key={`${layer.id}-shapes`}
          data={{ type: "FeatureCollection", features: shapes } as never}
          style={{ color: layer.color, weight: 1.5, fillOpacity: 0.15 }}
          onEachFeature={(feature, leafletLayer) => {
            leafletLayer.bindPopup(
              `<div style="font-size:13px"><strong>${layer.emoji} ${featureLabel(
                feature.properties ?? {},
                layer.label
              )}</strong></div>`
            );
          }}
        />
      )}
      {points.map((feature, idx) => {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        return (
          <CircleMarker
            key={`${layer.id}-pt-${idx}`}
            center={[lat, lng]}
            radius={7}
            pathOptions={{ color: layer.color, fillColor: layer.color, fillOpacity: 0.85 }}
          >
            <Popup>{popupContent(layer, feature.properties)}</Popup>
          </CircleMarker>
        );
      })}
    </Fragment>
  );
}

function LayerToggle({
  layer,
  active,
  count,
  onToggle,
}: {
  layer: Pick<LayerConfig, "emoji" | "label">;
  active: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition ${
        active
          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          : "text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900"
      }`}
    >
      <span className="flex items-center gap-2">
        <span>{layer.emoji}</span>
        <span>{layer.label}</span>
      </span>
      <span
        className={`rounded-full px-1.5 text-xs ${
          count > 0
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
            : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
