// Supabase Client Configuration
// Replace these with your actual Supabase Project Credentials
const SUPABASE_URL = "https://hdgtmoxgcttvjssupclk.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ3Rtb3hnY3R0dmpzc3VwY2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjM1OTIsImV4cCI6MjA5OTQzOTU5Mn0.Ix2dDU4oxduiZLaIeJi4z4uCX7P6bW_5Kq__Rr3NY0M"; 

if (SUPABASE_URL === "https://your-supabase-url.supabase.co" || SUPABASE_ANON_KEY === "your-supabase-anon-key") {
  console.warn("Supabase credentials are placeholders. Please replace them in supabase-config.js with your live database keys.");
}

// Initialize the Supabase client and expose it globally
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabaseClient;
console.log("Supabase Client initialized successfully.");
