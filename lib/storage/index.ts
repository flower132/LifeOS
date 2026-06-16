import { LocalStorageAdapter, STORAGE_VERSION } from "./localStorageAdapter";
import { StorageAdapter } from "./types";

function createStorageAdapter(): StorageAdapter {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    // SupabaseAdapter is a placeholder and will crash the app if selected.
    // Until it is fully implemented, always fall back to LocalStorageAdapter.
     
    console.warn(
      "[LifeOS] Supabase env vars detected but SupabaseAdapter is not implemented. Falling back to localStorage."
    );
  }

  return new LocalStorageAdapter();
}

export const storage = createStorageAdapter();
export type { StorageAdapter };
export { LocalStorageAdapter, STORAGE_VERSION };
