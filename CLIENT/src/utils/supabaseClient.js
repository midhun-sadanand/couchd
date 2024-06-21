const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

function createClerkSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing!");
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    fetch: async (url, options = {}) => {
      try {
        const clerkToken = await window.Clerk.session.getToken({
          template: "supabase",
        });

        const headers = new Headers(options.headers);
        headers.set("Authorization", `Bearer ${clerkToken}`);

        // Modify options to include the new headers
        const modifiedOptions = {
          ...options,
          headers,
        };

        return fetch(url, modifiedOptions);
      } catch (error) {
        console.error("Error fetching Clerk token:", error);
        // Fall back to default fetch if Clerk token can't be retrieved
        return fetch(url, options);
      }
    },
  });

  return supabase;
}

const client = createClerkSupabaseClient();

module.exports = client;
