// ============================================================
// Supabase Client — Dr. Josh Therapy Centre
// ============================================================
// Loaded as ES module via <script type="module">

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://xiqrsujzxrzddmmtaose.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcXJzdWp6eHJ6ZGRtbXRhb3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDg0MzAsImV4cCI6MjA5NTI4NDQzMH0.CpLxXzhVXeSpUx1WfCFykST0G7gWBYmv8ccTgmHZ19o';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
