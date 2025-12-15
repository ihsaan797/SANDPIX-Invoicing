import { createClient } from '@supabase/supabase-js';

// Use environment variables if available (Best Practice), otherwise fall back to hardcoded values.
// To update these on Netlify: Go to Site Settings > Environment Variables and add VITE_SUPABASE_URL and VITE_SUPABASE_KEY.

// @ts-ignore
const supabaseUrl = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'https://gkeefpikeelluidtutqn.supabase.co';
// @ts-ignore
const supabaseKey = (import.meta.env && import.meta.env.VITE_SUPABASE_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZWVmcGlrZWVsbHVpZHR1dHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQ0NzEsImV4cCI6MjA4MTM1MDQ3MX0.RbPCCmB5UGYmJLM6qZqwworcPUwxrXn5xdnhrnoeN6c';

export const supabase = createClient(supabaseUrl, supabaseKey);