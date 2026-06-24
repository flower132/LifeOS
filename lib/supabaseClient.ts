import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "lifeos-supabase-auth",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type SupabaseUser = ReturnType<typeof supabase.auth.getUser> extends Promise<{ data: { user: infer U } }> ? U : never;
