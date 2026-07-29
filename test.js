import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://gzuzviorzodeyrnofbag.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dXp2aW9yem9kZXlybm9mYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjc1ODUsImV4cCI6MjA4ODc0MzU4NX0.v33oErAl7ETs2G0whvkuudq7pXRei-SXFR2HY3HQ1NU');

const run = async () => {
    const { data } = await supabase.from('extra_information').select('project/organization');
    console.log(data.filter(d => (d['project/organization'] || '').toLowerCase().includes('pivot')));
}

run();
