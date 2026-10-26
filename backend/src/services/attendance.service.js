const supabase = require('../config/supabase');

class AttendanceService {
  async getAllAttendance({ page = 1, limit = 10, search, status, date }) {
    const fromIndex = (parseInt(page) - 1) * parseInt(limit);
    const toIndex = fromIndex + parseInt(limit) - 1;

    let selectStr = '*, member:members(*)';
    if (search) {
      selectStr = '*, member:members!inner(*)';
    }

    let query = supabase
      .from('attendance')
      .select(selectStr, { count: 'exact' });

    // Filter by member search terms
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`, { foreignTable: 'members' });
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by date
    if (date) {
      query = query.eq('attendance_date', date);
    }

    // Order by check_in time descending
    query = query.order('check_in', { ascending: false });

    // Apply pagination range
    query = query.range(fromIndex, toIndex);

    const { data, count, error } = await query;
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      attendance: data || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: count ? Math.ceil(count / parseInt(limit)) : 0
      }
    };
  }

  async checkIn({ member_id, attendance_date, check_in, status, device }) {
    // 1. Verify member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, first_name, last_name')
      .eq('id', member_id)
      .maybeSingle();

    if (memberError) {
      throw new Error(`Database error: ${memberError.message}`);
    }
    if (!member) {
      throw new Error('Member not found.');
    }

    const todayStr = attendance_date || new Date().toISOString().split('T')[0];

    // 2. Check for active check-in (check_out is null for this member on this date)
    const { data: activeCheckin, error: checkError } = await supabase
      .from('attendance')
      .select('id')
      .eq('member_id', member_id)
      .eq('attendance_date', todayStr)
      .is('check_out', null)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Database error: ${checkError.message}`);
    }
    if (activeCheckin) {
      throw new Error('Member is already checked in and has not checked out yet.');
    }

    // 3. Perform check-in insert
    const insertPayload = {
      member_id,
      attendance_date: todayStr,
      check_in: check_in || new Date().toISOString(),
      status: status || 'present',
      device: device || null
    };

    const { data: record, error: insertError } = await supabase
      .from('attendance')
      .insert(insertPayload)
      .select('*, member:members(*)')
      .single();

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    return record;
  }

  async checkOut(id, { check_out }) {
    // 1. Fetch attendance record
    const { data: record, error: getError } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (getError) {
      throw new Error(`Database error: ${getError.message}`);
    }
    if (!record) {
      throw new Error('Attendance record not found.');
    }
    if (record.check_out) {
      throw new Error('Member has already checked out of this session.');
    }

    const checkOutTime = check_out || new Date().toISOString();

    // 2. Update record with checkout time
    const { data: updatedRecord, error: updateError } = await supabase
      .from('attendance')
      .update({
        check_out: checkOutTime
      })
      .eq('id', id)
      .select('*, member:members(*)')
      .single();

    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }

    return updatedRecord;
  }

  async deleteAttendance(id) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  }
}

module.exports = new AttendanceService();
