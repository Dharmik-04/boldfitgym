'use client';

import { API_BASE_URL } from '@/lib/apiConfig';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Info,
  Clock,
  UserCheck,
  UserX,
  Smartphone,
  Calendar
} from 'lucide-react';

interface MemberOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AttendanceRecord {
  id: string;
  member_id: string;
  attendance_date: string;
  check_in: string;
  check_out?: string;
  status: string;
  device?: string;
  created_at: string;
  member?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function AttendanceTab() {
  // Lists & pagination
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & form fields
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Form State
  const [formFields, setFormFields] = useState({
    member_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    check_in: '', // Empty means backend defaults to current time
    status: 'present',
    device: 'Desktop Panel'
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const getHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Pre-load members list for dropdown
  const loadOptions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await fetch(`${API_BASE_URL}/api/members?limit=100`, { headers });
      if (response.ok) {
        const mData = await response.json();
        setMembersList(mData.data.members || []);
      }
    } catch (err) {
      console.error('Failed to load members for selector:', err);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8'
      });
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (dateFilter) queryParams.append('date', dateFilter);

      const response = await fetch(`${API_BASE_URL}/api/attendance?${queryParams.toString()}`, {
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load attendance logs.');
      }

      setRecords(data.data.attendance || []);
      setTotalPages(data.data.pagination.pages || 1);
      setTotalCount(data.data.pagination.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error while searching attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [page, statusFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAttendance();
  };

  const resetForm = () => {
    setFormFields({
      member_id: '',
      attendance_date: new Date().toISOString().split('T')[0],
      check_in: '',
      status: 'present',
      device: 'Desktop Panel'
    });
    setFormErrors({});
  };

  const handleOpenCheckinModal = () => {
    resetForm();
    setIsCheckinModalOpen(true);
  };

  const handleOpenDeleteModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formFields.member_id) errors.member_id = 'Please select a member to check in.';
    if (!formFields.attendance_date) errors.attendance_date = 'Date is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        member_id: formFields.member_id,
        attendance_date: formFields.attendance_date,
        status: formFields.status,
        device: formFields.device
      };
      if (formFields.check_in) {
        // Map local datetime picker input to ISO string
        payload.check_in = new Date(`${formFields.attendance_date}T${formFields.check_in}`).toISOString();
      }

      const response = await fetch(`${API_BASE_URL}/api/attendance/check-in`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to check in member.');
      }

      setIsCheckinModalOpen(false);
      triggerSuccess('Member check-in recorded successfully!');
      fetchAttendance();
    } catch (err: any) {
      setErrorMsg(err.message || 'Check-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (record: AttendanceRecord) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/${record.id}/check-out`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          check_out: new Date().toISOString()
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Checkout request failed.');
      }

      triggerSuccess('Member checkout complete.');
      fetchAttendance();
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed.');
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete record.');
      }

      setIsDeleteModalOpen(false);
      triggerSuccess('Attendance log deleted.');
      fetchAttendance();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete record.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDurationStr = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return 'Active session';
    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (diffMs < 0) return '—';
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} mins`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Popups */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#FFE600] text-black px-4 py-3 rounded-xl font-bold shadow-2xl animate-bounce">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center justify-between gap-4 bg-red-950 border border-red-900 text-red-200 px-4 py-3 rounded-xl font-bold shadow-2xl animate-shake">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-zinc-500 hover:text-white font-bold text-xs">✕</button>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-[#0c0c0e]/80 border border-zinc-800 p-6 rounded-2xl shadow-xl backdrop-blur-md w-full">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search checked-in member name..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-24 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[10px] uppercase font-bold tracking-widest text-[#FFE600]"
          >
            Find
          </button>
        </form>

        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto justify-start sm:justify-end">
          {/* Date filter select */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setPage(1);
                setDateFilter(e.target.value);
              }}
              className="bg-transparent border-none text-zinc-300 focus:outline-none cursor-pointer uppercase text-[10px]"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-zinc-500 hover:text-white font-bold ml-1">✕</button>
            )}
          </div>

          {/* Status filter select */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="bg-transparent border-none text-zinc-300 focus:outline-none cursor-pointer uppercase font-black tracking-wider text-[10px]"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present Only</option>
              <option value="late">Late Checkin</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          <button
            onClick={handleOpenCheckinModal}
            className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-md shadow-[#FFE600]/10"
          >
            <Plus className="w-4 h-4 text-black" /> Check In Member
          </button>
        </div>
      </div>

      {/* Skeletons or Attendance Table */}
      {loading ? (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-zinc-900/40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0c0c0e]/80 border border-zinc-850 space-y-4 shadow-xl">
          <Info className="w-10 h-10 text-zinc-650 mx-auto animate-pulse" />
          <h4 className="text-md font-bold text-white uppercase tracking-wider">No Attendance Logs Found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing the filters, or recording a new check-in.
          </p>
        </div>
      ) : (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-850 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Gym Member</th>
                  <th className="px-6 py-4">Check In Time</th>
                  <th className="px-6 py-4">Check Out Time</th>
                  <th className="px-6 py-4">Session Duration</th>
                  <th className="px-6 py-4">Device / Client</th>
                  <th className="px-6 py-4">Attendance Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 bg-zinc-900/10">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {rec.member ? `${rec.member.first_name} ${rec.member.last_name}` : 'Unknown Member'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400 flex items-center gap-1.5 mt-2 border-none">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {new Date(rec.check_in).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                      {rec.check_out ? (
                        new Date(rec.check_out).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <button
                          onClick={() => handleCheckOut(rec)}
                          className="px-2.5 py-1 rounded-lg border border-[#FFE600]/40 text-[#FFE600] bg-[#FFE600]/5 hover:bg-[#FFE600]/10 text-[9px] uppercase font-black tracking-wider transition-colors"
                        >
                          Checkout Now
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold ${!rec.check_out ? 'text-[#FFE600] animate-pulse' : 'text-zinc-300'}`}>
                        {getDurationStr(rec.check_in, rec.check_out)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450 text-xs flex items-center gap-1.5 border-none mt-2">
                      <Smartphone className="w-3.5 h-3.5 text-zinc-650" />
                      {rec.device || 'Desktop'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450 text-xs">
                      {new Date(rec.attendance_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        rec.status === 'present'
                          ? 'bg-green-950/40 border border-green-800/50 text-green-400'
                          : rec.status === 'late'
                          ? 'bg-yellow-950/40 border border-yellow-800/50 text-yellow-400'
                          : 'bg-red-950/40 border border-red-800/50 text-red-400'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDeleteModal(rec)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-red-450 hover:text-red-300 transition-colors"
                          title="Delete Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-450 bg-zinc-950/50">
              <span>Showing {records.length} of {totalCount} attendance entries</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 font-bold text-white">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkin Modal Dialog Overlay */}
      {isCheckinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">
                Member Check-in Portal
              </h3>
              <button
                onClick={() => setIsCheckinModalOpen(false)}
                className="text-zinc-500 hover:text-white font-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-6">
              {/* Member Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Select Gym Member *</label>
                <select
                  value={formFields.member_id}
                  onChange={(e) => setFormFields({ ...formFields, member_id: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.member_id ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300`}
                >
                  <option value="">-- Choose Member --</option>
                  {membersList.map(m => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.email})</option>
                  ))}
                </select>
                {formErrors.member_id && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.member_id}</p>}
              </div>

              {/* Date & Time Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Attendance Date *</label>
                  <input
                    type="date"
                    value={formFields.attendance_date}
                    onChange={(e) => setFormFields({ ...formFields, attendance_date: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Check-in Time (Optional)</label>
                  <input
                    type="time"
                    value={formFields.check_in}
                    onChange={(e) => setFormFields({ ...formFields, check_in: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white"
                  />
                </div>
              </div>

              {/* Status & Device */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Attendance Status</label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late Checkin</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Check-in Device Client</label>
                  <input
                    type="text"
                    value={formFields.device}
                    onChange={(e) => setFormFields({ ...formFields, device: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white"
                  />
                </div>
              </div>

              {/* Modal footer submit */}
              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCheckinModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-xs shadow-md shadow-[#FFE600]/10 disabled:opacity-50"
                >
                  {submitting ? 'Checking In...' : 'Verify & Check In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">Delete Attendance Record?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete the attendance log for <strong>{selectedRecord.member ? `${selectedRecord.member.first_name} ${selectedRecord.member.last_name}` : 'this member'}</strong> on {new Date(selectedRecord.attendance_date).toLocaleDateString()}?
                This action is irreversible and will remove all their records from the database.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-bold uppercase tracking-wider text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-500 text-white font-extrabold uppercase tracking-wider text-xs disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
