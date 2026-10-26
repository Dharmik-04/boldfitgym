const supabase = require('../config/supabase');
const dayjs = require('dayjs');

class MembershipService {
  /**
   * Automatically updates active memberships to expired if their end_date is in the past.
   */
  async checkAndExpireMemberships() {
    try {
      const todayStr = dayjs().format('YYYY-MM-DD');
      
      // Update all active memberships where end_date is less than today
      const { error } = await supabase
        .from('memberships')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'active')
        .lt('end_date', todayStr);

      if (error) {
        console.error('Error during auto-expiring memberships:', error.message);
      }
    } catch (err) {
      console.error('Unexpected error during auto-expiration:', err.message);
    }
  }

  async getAllMemberships({ page = 1, limit = 10, search, status, plan, sortBy = 'newest' }) {
    // Run lazy expiration update
    await this.checkAndExpireMemberships();

    const fromIndex = (parseInt(page) - 1) * parseInt(limit);
    const toIndex = fromIndex + parseInt(limit) - 1;

    let query;
    if (search) {
      // Use !inner join to search on nested members fields
      query = supabase
        .from('memberships')
        .select('*, member:members!inner(*), plan:membership_plans(*)', { count: 'exact' })
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`, { foreignTable: 'members' });
    } else {
      query = supabase
        .from('memberships')
        .select('*, member:members(*), plan:membership_plans(*)', { count: 'exact' });
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply plan filter (plan_id)
    if (plan) {
      query = query.eq('plan_id', plan);
    }

    // Default sorting by created_at descending
    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
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
      memberships: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: count ? Math.ceil(count / parseInt(limit)) : 0
      }
    };
  }

  async getMembershipById(id) {
    // Run lazy expiration update
    await this.checkAndExpireMemberships();

    const { data: membership, error } = await supabase
      .from('memberships')
      .select('*, member:members(*), plan:membership_plans(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!membership) {
      throw new Error('Membership not found.');
    }

    return membership;
  }

  async createMembership(data) {
    const { member_id, plan_id, start_date, status, auto_renew, freeze_days } = data;

    // 1. Verify member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('id', member_id)
      .maybeSingle();

    if (memberError) {
      throw new Error(`Database error: ${memberError.message}`);
    }
    if (!member) {
      throw new Error('Member not found.');
    }

    // 2. Verify plan exists
    const { data: plan, error: planError } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', plan_id)
      .maybeSingle();

    if (planError) {
      throw new Error(`Database error: ${planError.message}`);
    }
    if (!plan) {
      throw new Error('Membership plan not found.');
    }

    // 3. Verify active membership constraint
    if (status === 'active') {
      const { data: activeMembership, error: activeError } = await supabase
        .from('memberships')
        .select('id')
        .eq('member_id', member_id)
        .eq('status', 'active')
        .maybeSingle();

      if (activeError) {
        throw new Error(`Database error: ${activeError.message}`);
      }
      if (activeMembership) {
        throw new Error('Member already has an active membership.');
      }
    }

    // 4. Calculate end_date
    const durationMonths = plan.duration_months;
    const endDate = dayjs(start_date).add(durationMonths, 'month').format('YYYY-MM-DD');

    // 5. Insert record
    const { data: newMembership, error: insertError } = await supabase
      .from('memberships')
      .insert({
        member_id,
        plan_id,
        start_date,
        end_date: endDate,
        status,
        auto_renew: auto_renew !== undefined ? auto_renew : false,
        freeze_days: freeze_days !== undefined ? freeze_days : 0
      })
      .select('*, member:members(*), plan:membership_plans(*)')
      .single();

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    return newMembership;
  }

  async updateMembership(id, data) {
    // 1. Verify membership exists
    const current = await this.getMembershipById(id);

    const memberId = data.member_id !== undefined ? data.member_id : current.member_id;
    const planId = data.plan_id !== undefined ? data.plan_id : current.plan_id;
    const startDate = data.start_date !== undefined ? data.start_date : current.start_date;
    const targetStatus = data.status !== undefined ? data.status : current.status;

    // 2. Verify member if changing
    if (data.member_id !== undefined && data.member_id !== current.member_id) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('id', data.member_id)
        .maybeSingle();

      if (memberError) {
        throw new Error(`Database error: ${memberError.message}`);
      }
      if (!member) {
        throw new Error('Member not found.');
      }
    }

    // 3. Verify plan and fetch details if plan_id or start_date changed
    let plan = current.plan;
    if (data.plan_id !== undefined && data.plan_id !== current.plan_id) {
      const { data: newPlan, error: planError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('id', data.plan_id)
        .maybeSingle();

      if (planError) {
        throw new Error(`Database error: ${planError.message}`);
      }
      if (!plan) {
        throw new Error('Membership plan not found.');
      }
      plan = newPlan;
    }

    // 4. Recalculate end_date if plan or start_date changed
    let endDate = current.end_date;
    if (data.start_date !== undefined || data.plan_id !== undefined) {
      const durationMonths = plan.duration_months;
      endDate = dayjs(startDate).add(durationMonths, 'month').format('YYYY-MM-DD');
    }

    // 5. Verify active membership constraint if status is active
    if (targetStatus === 'active') {
      const { data: activeMembership, error: activeError } = await supabase
        .from('memberships')
        .select('id')
        .eq('member_id', memberId)
        .eq('status', 'active')
        .neq('id', id)
        .maybeSingle();

      if (activeError) {
        throw new Error(`Database error: ${activeError.message}`);
      }
      if (activeMembership) {
        throw new Error('Member already has an active membership.');
      }
    }

    // 6. Perform update
    const updateData = {
      ...data,
      end_date: endDate,
      updated_at: new Date().toISOString()
    };

    const { data: updatedMembership, error: updateError } = await supabase
      .from('memberships')
      .update(updateData)
      .eq('id', id)
      .select('*, member:members(*), plan:membership_plans(*)')
      .single();

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    return updatedMembership;
  }

  async deleteMembership(id) {
    // Verify membership exists
    await this.getMembershipById(id);

    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  async updateMembershipStatus(id, status) {
    // 1. Verify membership exists
    const current = await this.getMembershipById(id);

    // 2. Verify active membership constraint
    if (status === 'active') {
      const { data: activeMembership, error: activeError } = await supabase
        .from('memberships')
        .select('id')
        .eq('member_id', current.member_id)
        .eq('status', 'active')
        .neq('id', id)
        .maybeSingle();

      if (activeError) {
        throw new Error(`Database error: ${activeError.message}`);
      }
      if (activeMembership) {
        throw new Error('Member already has an active membership.');
      }
    }

    // 3. Perform update
    const { data: updatedMembership, error: updateError } = await supabase
      .from('memberships')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, member:members(*), plan:membership_plans(*)')
      .single();

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    return updatedMembership;
  }
}

module.exports = new MembershipService();
