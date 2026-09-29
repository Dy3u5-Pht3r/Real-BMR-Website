"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase, SUPABASE_CONFIGURED, SubmissionRow } from "@/lib/supabase";
import { ALL_LAYERS } from "@/lib/layers";
import type { Session } from "@supabase/supabase-js";

const LAYER_LABELS = Object.fromEntries(ALL_LAYERS.map((l) => [l.id, `${l.emoji} ${l.label}`]));

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [pending, setPending] = useState<SubmissionRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowError, setRowError] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadPending = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoadingRows(true);
    setRowError("");
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true });
    setLoadingRows(false);
    if (error) {
      setRowError(error.message);
      return;
    }
    setPending(data as SubmissionRow[]);
  };

  useEffect(() => {
    if (session) loadPending();
  }, [session]);

  if (!SUPABASE_CONFIGURED) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-sm text-neutral-500">
        <p>No database connected yet.</p>
        <p className="mt-1">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable the admin queue.
        </p>
        <Link href="/" className="mt-4 inline-block text-emerald-700 underline">
          Back to the map
        </Link>
      </div>
    );
  }

  if (checkingSession) return null;

  if (!session) {
    return (
      <div className="mx-auto mt-16 max-w-sm p-6">
        <h1 className="text-xl font-bold text-emerald-700">Admin sign in</h1>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoginError("");
            const supabase = getSupabase();
            const { error } = await supabase!.auth.signInWithPassword({ email, password });
            if (error) setLoginError(error.message);
          }}
        >
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 p-2 text-sm"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 p-2 text-sm"
          />
          {loginError && <p className="text-sm text-red-500">{loginError}</p>}
          <button className="w-full rounded-md bg-emerald-700 py-2 text-sm font-medium text-white">
            Sign in
          </button>
        </form>
        <p className="mt-3 text-xs text-neutral-400">
          Admin accounts are created in the Supabase dashboard (Authentication
          &gt; Users), not by signing up here.
        </p>
      </div>
    );
  }

  const review = async (id: string, status: "approved" | "rejected") => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase
      .from("submissions")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setRowError(error.message);
      return;
    }
    setPending((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-neutral-500 hover:underline">
            ← Back to the map
          </Link>
          <h1 className="mt-1 text-xl font-bold text-emerald-700">
            Pending submissions ({pending.length})
          </h1>
        </div>
        <button
          onClick={() => getSupabase()?.auth.signOut()}
          className="text-sm text-neutral-500 hover:underline"
        >
          Sign out
        </button>
      </div>

      {rowError && <p className="mt-3 text-sm text-red-500">{rowError}</p>}
      {loadingRows && <p className="mt-3 text-sm text-neutral-400">Loading...</p>}
      {!loadingRows && pending.length === 0 && (
        <p className="mt-6 text-sm text-neutral-400">Nothing waiting for review.</p>
      )}

      <div className="mt-4 space-y-3">
        {pending.map((row) => (
          <div
            key={row.id}
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <p className="text-xs text-neutral-400">
              {LAYER_LABELS[row.layer_id] ?? row.layer_id}
            </p>
            <p className="font-semibold">{row.name}</p>
            {row.description && (
              <p className="mt-1 text-sm text-neutral-500">{row.description}</p>
            )}
            <p className="mt-1 text-xs text-neutral-400">
              {row.lat.toFixed(5)}, {row.lng.toFixed(5)} · submitted{" "}
              {new Date(row.submitted_at).toLocaleDateString()}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => review(row.id, "approved")}
                className="rounded-md bg-emerald-700 px-3 py-1 text-sm text-white"
              >
                Approve
              </button>
              <button
                onClick={() => review(row.id, "rejected")}
                className="rounded-md bg-neutral-200 px-3 py-1 text-sm text-neutral-700"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
