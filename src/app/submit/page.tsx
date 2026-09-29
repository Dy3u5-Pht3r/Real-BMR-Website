"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ALL_LAYERS } from "@/lib/layers";
import { getSupabase, SUPABASE_CONFIGURED } from "@/lib/supabase";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-md border border-neutral-300 text-sm text-neutral-400">
      Loading map...
    </div>
  ),
});

// Only layers that make sense as a single point submission, and aren't
// auto-populated from OSM (submissions here are a supplement, not a
// replacement, for those — corrections can still go through this form).
const SUBMITTABLE_LAYERS = ALL_LAYERS.filter(
  (l) => l.id !== "districts" && l.id !== "needs-gap" && l.id !== "muslim-communities"
);

export default function SubmitPage() {
  const [layerId, setLayerId] = useState(SUBMITTABLE_LAYERS[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!SUPABASE_CONFIGURED) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-sm text-neutral-500">
        <p>Submissions aren&apos;t connected to a database yet.</p>
        <p className="mt-1">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable this form.
        </p>
        <Link href="/" className="mt-4 inline-block text-emerald-700 underline">
          Back to the map
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      setErrorMsg("Click the map to set a location first.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    const supabase = getSupabase();
    const { error } = await supabase!.from("submissions").insert({
      layer_id: layerId,
      name,
      lat: position.lat,
      lng: position.lng,
      description: description || null,
      status: "pending",
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-lg font-semibold text-emerald-700">
          Thanks — submitted for review.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          An admin will check it before it appears on the map.
        </p>
        <Link href="/" className="mt-4 inline-block text-emerald-700 underline">
          Back to the map
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Back to the map
      </Link>
      <h1 className="mt-2 text-xl font-bold text-emerald-700">Submit a location</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Add a place you know about. It'll be reviewed before it goes live.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">Category</label>
          <select
            value={layerId}
            onChange={(e) => setLayerId(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm"
          >
            {SUBMITTABLE_LAYERS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.emoji} {l.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Al-Falah Mosque"
            className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Location — click the map to place a pin
          </label>
          <div className="mt-1">
            <LocationPicker
              value={position}
              onChange={(lat, lng) => setPosition({ lat, lng })}
            />
          </div>
          {position && (
            <p className="mt-1 text-xs text-neutral-400">
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Notes (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm"
          />
        </div>

        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-md bg-emerald-700 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "submitting" ? "Submitting..." : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
