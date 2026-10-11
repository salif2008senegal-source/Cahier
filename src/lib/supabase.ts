import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseConfigure = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let client: SupabaseClient | null = null;

export function obtenirSupabase(): SupabaseClient | null {
  if (!supabaseConfigure) return null;
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
    );
  }
  return client;
}