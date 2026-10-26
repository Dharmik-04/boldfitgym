const supabase = require('../config/supabase');

class TrainerAssignmentService {
  async getAllAssignments({ page = 1, limit = 10, member, trainer, member_id, trainer_id, status }) {
    const fromIndex = (parseInt(page) - 1) * parseInt(limit);
    const toIndex = fromIndex + parseInt(limit) - 1;

    let selectStr = '*, member:members(*), trainer:trainers(*)';
    if (member) {
      selectStr = selectStr.replace('member:members(*)', 'member:members!inner(*)');
    }
    if (trainer) {
      selectStr = selectStr.replace('trainer:trainers(*)', 'trainer:trainers!inner(*)');
    }

    let query = supabase
      .from('trainer_assignments')
      .select(selectStr, { count: 'exact' });

    // Search by member (first_name, last_name, or email)
    if (member) {
      query = query.or(`first_name.ilike.%${member}%,last_name.ilike.%${member}%,email.ilike.%${member}%`, { foreignTable: 'members' });
    }

    // Search by trainer (first_name, last_name, or email)
    if (trainer) {
      query = query.or(`first_name.ilike.%${trainer}%,last_name.ilike.%${trainer}%,email.ilike.%${trainer}%`, { foreignTable: 'trainers' });
    }

    // Filter by member ID
    if (member_id) {
      query = query.eq('member_id', member_id);
    }

    // Filter by trainer ID
    if (trainer_id) {
      query = query.eq('trainer_id', trainer_id);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Sort by newest first
    query = query.order('created_at', { ascending: false });

    // Apply range pagination
    query = query.range(fromIndex, toIndex);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      assignments: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: count ? Math.ceil(count / parseInt(limit)) : 0
      }
    };
  }

  async getAssignmentById(id) {
    const { data: assignment, error } = await supabase
      .from('trainer_assignments')
      .select('*, member:members(*), trainer:trainers(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!assignment) {
      throw new Error('Trainer assignment not found.');
    }

    return assignment;
  }

  async createAssignment(data) {
    const { member_id, trainer_id, start_date, end_date, status } = data;
    const targetStatus = status || 'active';

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

    // 2. Verify trainer exists
    const { data: trainer, error: trainerError } = await supabase
      .from('trainers')
      .select('id')
      .eq('id', trainer_id)
      .maybeSingle();

    if (trainerError) {
      throw new Error(`Database error: ${trainerError.message}`);
    }
    if (!trainer) {
      throw new Error('Trainer not found.');
    }

    // 3. Verify date constraint: end_date >= start_date
    if (end_date) {
      if (new Date(end_date) < new Date(start_date)) {
        throw new Error('End date must be greater than or equal to start date.');
      }
    }

    // 4. Prevent duplicate active assignments for the same member and trainer
    if (targetStatus === 'active') {
      const { data: activeAssignment, error: activeError } = await supabase
        .from('trainer_assignments')
        .select('id')
        .eq('member_id', member_id)
        .eq('trainer_id', trainer_id)
        .eq('status', 'active')
        .maybeSingle();

      if (activeError) {
        throw new Error(`Database error: ${activeError.message}`);
      }
      if (activeAssignment) {
        throw new Error('Member already has an active assignment with this trainer.');
      }
    }

    // 5. Perform insert
    const { data: newAssignment, error: insertError } = await supabase
      .from('trainer_assignments')
      .insert({
        member_id,
        trainer_id,
        start_date,
        end_date: end_date || null,
        status: targetStatus
      })
      .select('*, member:members(*), trainer:trainers(*)')
      .single();

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    return newAssignment;
  }

  async updateAssignment(id, data) {
    // 1. Verify assignment exists first
    const current = await this.getAssignmentById(id);

    const memberId = data.member_id !== undefined ? data.member_id : current.member_id;
    const trainerId = data.trainer_id !== undefined ? data.trainer_id : current.trainer_id;
    const startDate = data.start_date !== undefined ? data.start_date : current.start_date;
    const endDate = data.end_date !== undefined ? data.end_date : current.end_date;
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

    // 3. Verify trainer if changing
    if (data.trainer_id !== undefined && data.trainer_id !== current.trainer_id) {
      const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .select('id')
        .eq('id', data.trainer_id)
        .maybeSingle();

      if (trainerError) {
        throw new Error(`Database error: ${trainerError.message}`);
      }
      if (!trainer) {
        throw new Error('Trainer not found.');
      }
    }

    // 4. Verify date constraint end_date >= start_date
    if (endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        throw new Error('End date must be greater than or equal to start date.');
      }
    }

    // 5. Prevent duplicate active assignments for the same member and trainer
    if (targetStatus === 'active') {
      const { data: activeAssignment, error: activeError } = await supabase
        .from('trainer_assignments')
        .select('id')
        .eq('member_id', memberId)
        .eq('trainer_id', trainerId)
        .eq('status', 'active')
        .neq('id', id)
        .maybeSingle();

      if (activeError) {
        throw new Error(`Database error: ${activeError.message}`);
      }
      if (activeAssignment) {
        throw new Error('Member already has an active assignment with this trainer.');
      }
    }

    // 6. Perform update
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    const { data: updatedAssignment, error: updateError } = await supabase
      .from('trainer_assignments')
      .update(updateData)
      .eq('id', id)
      .select('*, member:members(*), trainer:trainers(*)')
      .single();

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    return updatedAssignment;
  }

  async deleteAssignment(id) {
    // Verify assignment exists first
    await this.getAssignmentById(id);

    const { error } = await supabase
      .from('trainer_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }

  async updateAssignmentStatus(id, status) {
    // 1. Verify assignment exists first
    const current = await this.getAssignmentById(id);

    // 2. Prevent duplicate active assignments for the same member and trainer
    if (status === 'active') {
      const { data: activeAssignment, error: activeError } = await supabase
        .from('trainer_assignments')
        .select('id')
        .eq('member_id', current.member_id)
        .eq('trainer_id', current.trainer_id)
        .eq('status', 'active')
        .neq('id', id)
        .maybeSingle();

      if (activeError) {
        throw new Error(`Database error: ${activeError.message}`);
      }
      if (activeAssignment) {
        throw new Error('Member already has an active assignment with this trainer.');
      }
    }

    // 3. Perform update
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('trainer_assignments')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, member:members(*), trainer:trainers(*)')
      .single();

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    return updatedAssignment;
  }
}

module.exports = new TrainerAssignmentService();
