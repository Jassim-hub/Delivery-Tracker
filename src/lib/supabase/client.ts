import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine if we are configured for live Supabase or mock fallback
export const isConfiguredForLiveSupabase = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const isUsingMockBackend = 
  import.meta.env.VITE_USE_MOCK_BACKEND === 'true' || !isConfiguredForLiveSupabase;

// Create Supabase client instance (or dummy client if using mock mode)
export const supabase = isConfiguredForLiveSupabase
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://mock-delivery-tracker.supabase.co', 'mock-anon-key-development', {
      auth: {
        persistSession: true,
      },
    });
