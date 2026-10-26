// Load environment variables using dotenv
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Supabase client startup failed: SUPABASE_URL environment variable is missing.');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Supabase client startup failed: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = supabase;
