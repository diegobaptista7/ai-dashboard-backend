import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gzuzviorzodeyrnofbag.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXp2aW9yem9kZXlybm9mYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjc1ODUsImV4cCI6MjA4ODc0MzU4NX0.v33oErAl7ETs2G0whvkuudq7pXRei-SXFR2HY3HQ1NU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data: deployed } = await supabase.from('deployed_projects').select('projects');
  const { data: dev } = await supabase.from('development_projects').select('projects');
  
  const deployedLens = deployed.map((r) => r.projects ? r.projects.length : 0);
  const devLens = dev.map((r) => r.projects ? r.projects.length : 0);
  
  const maxDep = Math.max(...deployedLens);
  const maxDev = Math.max(...devLens);
  
  console.log('Max len deployed:', maxDep);
  console.log('Max len dev:', maxDev);
  
  const longestDep = deployed.reduce((max, r) => (r.projects && r.projects.length > max.length) ? r.projects : max, "");
  const longestDev = dev.reduce((max, r) => (r.projects && r.projects.length > max.length) ? r.projects : max, "");
  
  console.log("Longest Deployed:", longestDep);
  console.log("Longest Dev:", longestDev);
}
check();
