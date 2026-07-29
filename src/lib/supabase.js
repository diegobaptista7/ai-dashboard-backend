import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzuzviorzodeyrnofbag.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXp2aW9yem9kZXlybm9mYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjc1ODUsImV4cCI6MjA4ODc0MzU4NX0.v33oErAl7ETs2G0whvkuudq7pXRei-SXFR2HY3HQ1NU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
