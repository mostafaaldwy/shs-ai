// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://sdwydorgfyggrbxpjuzc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkd3lkb3JnZnlnZ3JieHBqdXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxMjM4ODAsImV4cCI6MjA1NDY5OTg4MH0.XTVioHIEnG9eWm5F9bO3UxEEk336ZqXmQUljkjDo0nE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
