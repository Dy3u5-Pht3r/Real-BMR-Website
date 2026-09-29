import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Lazily creates a browser Supabase client. Returns null if env vars aren't
 * set yet, so pages can render a helpful message instead of crashing.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}

export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export interface SubmissionRow {
  id: string;
  layer_id: string;
  name: string;
  lat: number;
  lng: number;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewer_note: string | null;
}
