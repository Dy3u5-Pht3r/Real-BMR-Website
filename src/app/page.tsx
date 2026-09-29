"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so it must never render on the server.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center text-neutral-400">
      Loading map...
    </div>
  ),
});

export default function Home() {
  return <MapView />;
}
