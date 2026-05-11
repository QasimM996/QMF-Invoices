// js/supabase.js

const SUPABASE_URL = "https://bybbtpsglzfdvsxtvskd.supabase.co";

const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5YmJ0cHNnbHpmZHZzeHR2c2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDgxNTEsImV4cCI6MjA4OTYyNDE1MX0.Oa0e121Pa4mK-CJVmKgc0q2UPU5B8xGgs-AmlAviIYY"
;

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "qmf-auth-token"
    }
  }
);
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = supabaseClient;

