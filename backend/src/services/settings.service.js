const supabase = require('../config/supabase');

const DEFAULT_SETTINGS = {
  gym_name: 'Apex Gym Center',
  address: '456 Innovation Drive, Suite A',
  phone: '+1-555-8900',
  email: 'admin@apexgym.com',
  business_hours: 'Mon-Fri: 5AM-11PM, Sat-Sun: 7AM-9PM',
  currency: 'USD',
  timezone: 'America/New_York'
};

class SettingsService {
  async getSettings() {
    const { data, error } = await supabase
      .from('gym_settings')
      .select('key, value');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const settings = { ...DEFAULT_SETTINGS };
    if (data && data.length > 0) {
      data.forEach(row => {
        if (row.key in settings) {
          settings[row.key] = row.value;
        } else {
          // Keep other keys as well if they exist
          settings[row.key] = row.value;
        }
      });
    }

    return settings;
  }

  async updateSettings(settingsObj) {
    const keys = Object.keys(settingsObj);
    
    // Process update updates sequentially to prevent conflicts
    for (const key of keys) {
      const value = String(settingsObj[key]);

      // 1. Check if key exists
      const { data: existing, error: getError } = await supabase
        .from('gym_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (getError) {
        throw new Error(`Database error on check: ${getError.message}`);
      }

      if (existing) {
        // Update value
        const { error: updateError } = await supabase
          .from('gym_settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key);

        if (updateError) {
          throw new Error(`Database error on update: ${updateError.message}`);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('gym_settings')
          .insert({ key, value });

        if (insertError) {
          throw new Error(`Database error on insert: ${insertError.message}`);
        }
      }
    }

    // Fetch the updated settings dictionary to return
    return this.getSettings();
  }
}

module.exports = new SettingsService();
