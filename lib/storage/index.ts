import { LocalStorageAdapter } from "./localStorageAdapter";
import { SupabaseAdapter } from "./supabaseAdapter";
import { StorageAdapter } from "./types";

function createStorageAdapter(): StorageAdapter {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    return new SupabaseAdapter(supabaseUrl, supabaseKey);
  }

  return new LocalStorageAdapter();
}

export const storage = createStorageAdapter();
export type { StorageAdapter };
export { LocalStorageAdapter, SupabaseAdapter };
