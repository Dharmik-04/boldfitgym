const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

class AuthService {
  async login(usernameOrEmail, password, ipAddress) {
    // 1. Fetch user from database
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!admin) {
      throw new Error('Invalid credentials.');
    }

    // 2. Check if account is locked
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      const waitMinutes = Math.ceil((new Date(admin.locked_until) - new Date()) / (60 * 1000));
      throw new Error(`Account is locked. Try again in ${waitMinutes} minutes.`);
    }

    // 3. Check status
    if (admin.status === 'inactive' || admin.status === 'suspended') {
      throw new Error(`Access denied. Your account is ${admin.status}.`);
    }

    // 4. Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      // Increment failed attempts
      const attempts = (admin.failed_login_attempts || 0) + 1;
      const updates = { failed_login_attempts: attempts };
      
      if (attempts >= 5) {
        updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock
      }

      await supabase
        .from('admins')
        .update(updates)
        .eq('id', admin.id);

      // Log failed attempt
      await this.logActivity(admin.id, 'LOGIN_FAILED', ipAddress, { attempts });

      throw new Error('Invalid credentials.');
    }

    // 5. Successful login
    const updates = {
      failed_login_attempts: 0,
      locked_until: null,
      last_login: new Date().toISOString()
    };

    await supabase
      .from('admins')
      .update(updates)
      .eq('id', admin.id);

    // Log success
    await this.logActivity(admin.id, 'LOGIN_SUCCESS', ipAddress, {
      user_agent: 'Node/Express Agent'
    });

    // 6. Generate tokens
    const accessToken = jwt.sign(
      { id: admin.id, username: admin.username, role: "Super Admin" },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    const refreshToken = jwt.sign(
      { id: admin.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        role: "Super Admin"
      },
      accessToken,
      refreshToken
    };
  }

  async getProfile(adminId) {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .maybeSingle();

    if (error || !admin) {
      throw new Error('Admin not found.');
    }

    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      role: "Super Admin",
      status: admin.status
    };
  }

  async logActivity(adminId, action, ipAddress, details = {}) {
    try {
      await supabase
        .from('activity_logs')
        .insert({
          admin_id: adminId,
          action,
          ip_address: ipAddress,
          details
        });
    } catch (e) {
      console.error('Failed to write activity logs:', e.message);
    }
  }
}

module.exports = new AuthService();
