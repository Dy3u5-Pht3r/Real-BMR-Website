import Link from "next/link";
import { RESOURCES, RESOURCE_DISCLAIMER, Resource } from "@/lib/resources";

const CATEGORIES: Resource["category"][] = [
  "Emergency",
  "Mental Health & Social",
  "Islamic Organizations",
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Back to the map
      </Link>
      <h1 className="mt-2 text-xl font-bold text-emerald-700">Resources & Helplines</h1>
      <p className="mt-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
        {RESOURCE_DISCLAIMER}
      </p>

      {CATEGORIES.map((category) => {
        const items = RESOURCES.filter((r) => r.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category} className="mt-6">
            <h2 className="text-sm font-semibold uppercase text-neutral-400">
              {category}
            </h2>
            <div className="mt-2 space-y-3">
              {items.map((r) => (
                <div
                  key={r.name}
                  className="rounded-md border border-neutral-200 p-3"
                >
                  <p className="font-semibold">{r.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">{r.detail}</p>
                  {r.contact && (
                    <p className="mt-2 text-lg font-bold text-emerald-700">{r.contact}</p>
                  )}
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm text-emerald-700 underline"
                    >
                      Visit official website →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <p className="mt-8 text-xs text-neutral-400">
        Know an organization that should be listed here? Edit{" "}
        <code>src/lib/resources.ts</code> and add it — this list is
        maintained directly in the codebase rather than through public
        submissions, since accuracy matters most here.
      </p>
    </div>
  );
}
