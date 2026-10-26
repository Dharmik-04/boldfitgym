const supabase = require('../config/supabase');

class MembershipPlanService {
  async getAllPlans({ page = 1, limit = 10, search, status }) {
    const fromIndex = (parseInt(page) - 1) * parseInt(limit);
    const toIndex = fromIndex + parseInt(limit) - 1;

    let query = supabase
      .from('membership_plans')
      .select('*', { count: 'exact' });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply search filter (by plan name)
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Default sorting by created_at descending
    query = query.order('created_at', { ascending: false });

    // Apply pagination range
    query = query.range(fromIndex, toIndex);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Map duration_months to duration for response compatibility
    const plans = (data || []).map(plan => ({
      ...plan,
      duration: plan.duration_months
    }));

    return {
      plans,
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: count ? Math.ceil(count / parseInt(limit)) : 0
      }
    };
  }

  async getPlanById(id) {
    const { data: plan, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!plan) {
      throw new Error('Membership plan not found.');
    }

    return {
      ...plan,
      duration: plan.duration_months
    };
  }

  async createPlan(data) {
    const { duration, ...rest } = data;
    
    // Map duration to duration_months for database
    const insertData = {
      ...rest,
      duration_months: duration,
      status: data.status || 'active'
    };

    const { data: newPlan, error } = await supabase
      .from('membership_plans')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      ...newPlan,
      duration: newPlan.duration_months
    };
  }

  async updatePlan(id, data) {
    // Check if the plan exists first
    await this.getPlanById(id);

    const { duration, ...rest } = data;
    
    // Map duration to duration_months if provided
    const updateData = {
      ...rest,
      updated_at: new Date().toISOString()
    };
    
    if (duration !== undefined) {
      updateData.duration_months = duration;
    }

    const { data: updatedPlan, error } = await supabase
      .from('membership_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      ...updatedPlan,
      duration: updatedPlan.duration_months
    };
  }

  async deletePlan(id) {
    // Check if the plan exists first
    await this.getPlanById(id);

    const { error } = await supabase
      .from('membership_plans')
      .delete()
      .eq('id', id);

    if (error) {
      // Handle foreign key constraint violation (e.g. references in memberships table)
      if (error.code === '23503') {
        throw new Error('Cannot delete membership plan because it is currently assigned to one or more memberships/members.');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  async updatePlanStatus(id, status) {
    // Check if the plan exists first
    await this.getPlanById(id);

    const { data: updatedPlan, error } = await supabase
      .from('membership_plans')
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

    return {
      ...updatedPlan,
      duration: updatedPlan.duration_months
    };
  }
}

module.exports = new MembershipPlanService();
