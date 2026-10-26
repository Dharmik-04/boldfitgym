require('dotenv').config();
const supabase = require('../src/config/supabase');

async function createBucket() {
  const { data, error } = await supabase.storage.createBucket('invoices', {
    public: false,
    allowedMimeTypes: ['application/pdf'],
    fileSizeLimit: 5242880 // 5MB
  });

  if (error) {
    console.error('Failed to create bucket:', error);
  } else {
    console.log('Bucket created:', data);
  }
}

createBucket();
