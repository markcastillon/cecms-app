// Connects to Supabase with the keys in .env (see README > Connect Supabase).
// Without them the app shows a setup message instead of starting (main.jsx).
import { createSupabaseApi } from "./supabaseApi.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const missingConfig = !url || !key;
export const api = missingConfig ? null : createSupabaseApi(url, key);
