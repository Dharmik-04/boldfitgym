const supabase = require('../config/supabase');

class MemberService {
  async getAllMembers({ page = 1, limit = 10, search, status, sortBy = 'newest' }) {
    const fromIndex = (page - 1) * limit;
    const toIndex = fromIndex + limit - 1;

    let query = supabase
      .from('members')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply sorting
    if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination range
    query = query.range(fromIndex, toIndex);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      members: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: count ? Math.ceil(count / limit) : 0
      }
    };
  }

  async getMemberById(id) {
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!member) {
      throw new Error('Member not found.');
    }

    return member;
  }

  async createMember(data) {
    const { email } = data;

    // Check if email already exists
    const { data: existingMember, error: checkError } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Database error: ${checkError.message}`);
    }

    if (existingMember) {
      throw new Error('Email address is already in use by another member.');
    }

    const { data: newMember, error } = await supabase
      .from('members')
      .insert({
        ...data,
        join_date: data.join_date || new Date().toISOString().split('T')[0],
        status: data.status || 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return newMember;
  }

  async updateMember(id, data) {
    // Check if member exists
    await this.getMemberById(id);

    const { email } = data;

    if (email) {
      // Check if email already exists on another member
      const { data: existingMember, error: checkError } = await supabase
        .from('members')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Database error: ${checkError.message}`);
      }

      if (existingMember) {
        throw new Error('Email address is already in use by another member.');
      }
    }

    const { data: updatedMember, error } = await supabase
      .from('members')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedMember;
  }

  async deleteMember(id) {
    // Check if member exists
    await this.getMemberById(id);

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  async updateMemberStatus(id, status) {
    // Check if member exists
    await this.getMemberById(id);

    const { data: updatedMember, error } = await supabase
      .from('members')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedMember;
  }
}

module.exports = new MemberService();
