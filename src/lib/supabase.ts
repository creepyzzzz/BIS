import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lfpwgiespycxtqhkiihs.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcHdnaWVzcHljeHRxaGtpaWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzY3MjcsImV4cCI6MjEwNTY1MjcyN30.0OHlqhno7RCW8-epB-pfekTYmaJWVWcAK1VlsB3cehA";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
