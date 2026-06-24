import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabaseTypes";

/**
 * Lazy-initialized Supabase client.
 * Safe to import during build – client is only created on first use.
 */

let _client: SupabaseClient<Database> | null = null;

function getUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/** Get a live Supabase client. Throws with a clear message if not configured. */
export function getSupabase(): SupabaseClient<Database> {
  if (_client) return _client;

  const url = getUrl();
  const key = getKey();

  if (!url || !key) {
    throw new Error(
      "[Supabase] Missing env vars.\n" +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
      "in Vercel project settings → Environment Variables."
    );
  }

  _client = createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      storageKey: "lifeos-supabase-auth",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });

  return _client;
}

/** Reset the cached client (useful after signOut or env change). */
export function resetSupabase(): void {
  _client = null;
}
