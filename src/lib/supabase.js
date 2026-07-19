import { createClient } from '@supabase/supabase-js'

// NOTE: deliberately no top-level "throw if missing" guard here.
// import.meta.env values are inlined at build time, so a guard like
// `if (!url) throw ...` becomes statically always-true when the env vars
// are absent during a build — and the bundler then removes every module
// that runs after it, shipping a blank app. createClient itself raises a
// clear "supabaseUrl is required" error at startup if the vars are missing.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
