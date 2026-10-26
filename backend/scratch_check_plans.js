const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
  const { data: plans, error } = await supabase
    .from('membership_plans')
    .select('*');

  if (error) {
    console.error("Database error fetching plans:", error.message);
  } else {
    console.log("Existing membership plans in database:");
    console.log(JSON.stringify(plans, null, 2));
  }
}

run();
