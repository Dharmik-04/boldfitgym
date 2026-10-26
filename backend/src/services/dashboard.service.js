const supabase = require('../config/supabase');

class DashboardService {
  async getDashboardStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // First day of current calendar month
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // First day of 6 months ago (for monthly chart data)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    // Last 7 days start date
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Run queries concurrently for optimal performance
    const [
      totalMembersRes,
      activeMembersRes,
      totalTrainersRes,
      activeMembershipsRes,
      todayAttendanceRes,
      currentMonthPaymentsRes,
      recentMembersRes,
      recentPaymentsRes,
      registrationsChartRes,
      revenueChartRes,
      attendanceChartRes
    ] = await Promise.all([
      // 1. Total Members
      supabase.from('members').select('*', { count: 'exact', head: true }),
      // 2. Active Members
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      // 3. Total Trainers
      supabase.from('trainers').select('*', { count: 'exact', head: true }),
      // 4. Active Memberships
      supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      // 5. Today's Attendance
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('attendance_date', todayStr),
      // 6. Monthly Revenue (Completed payments for the current month)
      supabase.from('payments').select('amount').eq('payment_status', 'completed').gte('payment_date', firstDayOfCurrentMonth),
      // 7. Recent Members (last 5)
      supabase.from('members').select('id, first_name, last_name, email, join_date, status').order('created_at', { ascending: false }).limit(5),
      // 8. Recent Payments (last 5)
      supabase.from('payments').select('id, amount, currency, payment_method, payment_status, payment_date, members(first_name, last_name)').order('payment_date', { ascending: false }).limit(5),
      // Chart: registrations by month (since 6 months ago)
      supabase.from('members').select('join_date').gte('join_date', sixMonthsAgoStr),
      // Chart: revenue by month (since 6 months ago)
      supabase.from('payments').select('amount, payment_date').eq('payment_status', 'completed').gte('payment_date', sixMonthsAgo.toISOString()),
      // Chart: attendance last 7 days
      supabase.from('attendance').select('attendance_date').gte('attendance_date', sevenDaysAgoStr)
    ]);

    // Check for critical errors
    const errors = [
      totalMembersRes.error,
      activeMembersRes.error,
      totalTrainersRes.error,
      activeMembershipsRes.error,
      todayAttendanceRes.error,
      currentMonthPaymentsRes.error,
      recentMembersRes.error,
      recentPaymentsRes.error,
      registrationsChartRes.error,
      revenueChartRes.error,
      attendanceChartRes.error
    ].filter(Boolean);

    if (errors.length > 0) {
      throw new Error(`Supabase query failed: ${errors[0].message}`);
    }

    // Process KPI values
    const totalMembers = totalMembersRes.count || 0;
    const activeMembers = activeMembersRes.count || 0;
    const totalTrainers = totalTrainersRes.count || 0;
    const activeMemberships = activeMembershipsRes.count || 0;
    const todayAttendance = todayAttendanceRes.count || 0;

    const monthlyRevenue = currentMonthPaymentsRes.data
      ? currentMonthPaymentsRes.data.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
      : 0;

    // Process Recent list data
    const recentMembers = recentMembersRes.data || [];
    const recentPayments = (recentPaymentsRes.data || []).map(pay => ({
      id: pay.id,
      amount: pay.amount,
      currency: pay.currency,
      payment_method: pay.payment_method,
      payment_status: pay.payment_status,
      payment_date: pay.payment_date,
      member_name: pay.members ? `${pay.members.first_name} ${pay.members.last_name}` : 'Unknown Member'
    }));

    // Process Chart Data: Helper to get last 6 months keys
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      last6Months.push({ key, label, registrations: 0, revenue: 0 });
    }

    // Group Member Registrations by month
    if (registrationsChartRes.data) {
      registrationsChartRes.data.forEach(m => {
        if (!m.join_date) return;
        const [year, month] = m.join_date.split('-');
        const key = `${year}-${month}`;
        const match = last6Months.find(mObj => mObj.key === key);
        if (match) {
          match.registrations += 1;
        }
      });
    }

    // Group Revenue by month
    if (revenueChartRes.data) {
      revenueChartRes.data.forEach(p => {
        if (!p.payment_date) return;
        const dateObj = new Date(p.payment_date);
        const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const match = last6Months.find(mObj => mObj.key === key);
        if (match) {
          match.revenue += parseFloat(p.amount || 0);
        }
      });
    }

    // Process Chart Data: Attendance last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleString('default', { weekday: 'short' });
      const key = d.toISOString().split('T')[0];
      last7Days.push({ key, label, count: 0 });
    }

    if (attendanceChartRes.data) {
      attendanceChartRes.data.forEach(att => {
        if (!att.attendance_date) return;
        const key = att.attendance_date;
        const match = last7Days.find(dObj => dObj.key === key);
        if (match) {
          match.count += 1;
        }
      });
    }

    return {
      kpis: {
        total_members: totalMembers,
        active_members: activeMembers,
        total_trainers: totalTrainers,
        active_memberships: activeMemberships,
        today_attendance: todayAttendance,
        monthly_revenue: monthlyRevenue
      },
      recent_members: recentMembers,
      recent_payments: recentPayments,
      charts: {
        registrations_by_month: last6Months.map(m => ({ label: m.label, registrations: m.registrations })),
        revenue_by_month: last6Months.map(m => ({ label: m.label, revenue: m.revenue })),
        attendance_last_7_days: last7Days.map(d => ({ label: d.label, date: d.key, count: d.count }))
      }
    };
  }
}

module.exports = new DashboardService();
