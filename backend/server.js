require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  GYM Portal Backend Services running`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Port: ${PORT}`);
  console.log(`=========================================`);
});
const supabase = require('./src/config/supabase');

async function testSupabase() {
  const { data, error } = await supabase
    .from('admins')
    .select('*');

  console.log('DATA:', data);
  console.log('ERROR:', error);
}

testSupabase();
