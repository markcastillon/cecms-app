// Picks the backend once at start-up: Supabase when its keys are set in .env,
// otherwise demo mode with sample data stored in the browser.
import { createDemoApi } from "./demoApi.js";
import { createSupabaseApi } from "./supabaseApi.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const api = url && key ? createSupabaseApi(url, key) : createDemoApi();
