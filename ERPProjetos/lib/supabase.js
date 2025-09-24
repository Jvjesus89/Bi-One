import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eagpcgcblczpyztocqim.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZ3BjZ2NibGN6cHl6dG9jcWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NzE5MDUsImV4cCI6MjA3NDI0NzkwNX0.iXb7ivKxfbxcdG9Mg0xiUUfVkfLzN-fRGdFsUzqqbJU';

// Cliente com anon key (para operações normais)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Para contornar RLS, você pode usar a Service Role Key:
// const supabaseServiceKey = 'sua_service_role_key_aqui';
// export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); 