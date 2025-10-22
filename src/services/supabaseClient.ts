import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://rfsbovvvryfmgpoehlrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmc2JvdnZ2cnlmbWdwb2VobHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTAwNTEsImV4cCI6MjA3NTMyNjA1MX0.ljhaRpb_DVjTQsQAYAhECVy5ADQ3dm1GxH0s1uxgOws';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key must be provided.");
}

// Client for standard user authentication and RLS-protected queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
