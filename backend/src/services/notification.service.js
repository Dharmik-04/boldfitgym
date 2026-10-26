const supabase = require('../config/supabase');

class NotificationService {
  async getAllNotifications({ adminId, page = 1, limit = 10 }) {
    const fromIndex = (parseInt(page) - 1) * parseInt(limit);
    const toIndex = fromIndex + parseInt(limit) - 1;

    // 1. Query unread count for this admin
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .or(`admin_id.eq.${adminId},admin_id.is.null`);

    if (countError) {
      throw new Error(`Database error: ${countError.message}`);
    }

    // 2. Query notifications list
    const { data, count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .or(`admin_id.eq.${adminId},admin_id.is.null`)
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      notifications: data || [],
      unread_count: unreadCount || 0,
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: count ? Math.ceil(count / parseInt(limit)) : 0
      }
    };
  }

  async createNotification(data) {
    const { title, message, type, member_id, admin_id } = data;

    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type: type || 'system',
        member_id: member_id || null,
        admin_id: admin_id || null,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return newNotification;
  }

  async markAsRead(id) {
    const { data: updated, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updated;
  }

  async deleteNotification(id) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }
}

module.exports = new NotificationService();
