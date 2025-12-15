import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gkeefpikeelluidtutqn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZWVmcGlrZWVsbHVpZHR1dHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzQ0NzEsImV4cCI6MjA4MTM1MDQ3MX0.RbPCCmB5UGYmJLM6qZqwworcPUwxrXn5xdnhrnoeN6c';

export const supabase = createClient(supabaseUrl, supabaseKey);