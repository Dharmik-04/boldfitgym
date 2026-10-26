'use client';

import { API_BASE_URL } from '@/lib/apiConfig';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Info,
  UserCheck,
  Users,
  Calendar
} from 'lucide-react';

interface MemberOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface TrainerOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization?: string;
}

interface TrainerAssignment {
  id: string;
  member_id: string;
  trainer_id: string;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
  member?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  trainer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function TrainerAssignmentsTab() {
  // Lists & pagination
  const [assignments, setAssignments] = useState<TrainerAssignment[]>([]);
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [trainersList, setTrainersList] = useState<TrainerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [trainerSearch, setTrainerSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & form fields
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TrainerAssignment | null>(null);

  // Form State
  const [formFields, setFormFields] = useState({
    member_id: '',
    trainer_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'active'
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

  // Pre-load members and trainers list options
  const loadOptions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [membersRes, trainersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/members?limit=100`, { headers }),
        fetch(`${API_BASE_URL}/api/trainers?limit=100`, { headers })
      ]);

      if (membersRes.ok && trainersRes.ok) {
        const mData = await membersRes.json();
        const tData = await trainersRes.json();
        setMembersList(mData.data.members || []);
        setTrainersList(mData.data.trainers || []);
      }
    } catch (err) {
      console.error('Failed to load select options:', err);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8'
      });
      if (memberSearch.trim()) queryParams.append('member', memberSearch.trim());
      if (trainerSearch.trim()) queryParams.append('trainer', trainerSearch.trim());
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);

      const response = await fetch(`${API_BASE_URL}/api/trainer-assignments?${queryParams.toString()}`, {
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load assignments.');
      }

      setAssignments(data.data.assignments || []);
      setTotalPages(data.data.pagination.pages || 1);
      setTotalCount(data.data.pagination.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error while searching assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAssignments();
  };

  const resetForm = () => {
    setFormFields({
      member_id: '',
      trainer_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'active'
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (assign: TrainerAssignment) => {
    setSelectedAssignment(assign);
    setFormFields({
      member_id: assign.member_id || '',
      trainer_id: assign.trainer_id || '',
      start_date: assign.start_date || '',
      end_date: assign.end_date || '',
      status: assign.status || 'active'
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (assign: TrainerAssignment) => {
    setSelectedAssignment(assign);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formFields.member_id) errors.member_id = 'Please select a member.';
    if (!formFields.trainer_id) errors.trainer_id = 'Please select a trainer.';
    if (!formFields.start_date) errors.start_date = 'Start date is required.';
    
    if (formFields.end_date && formFields.start_date) {
      if (new Date(formFields.end_date) < new Date(formFields.start_date)) {
        errors.end_date = 'End date cannot be earlier than start date.';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        member_id: formFields.member_id,
        trainer_id: formFields.trainer_id,
        start_date: formFields.start_date,
        status: formFields.status
      };
      if (formFields.end_date) payload.end_date = formFields.end_date;

      const response = await fetch(`${API_BASE_URL}/api/trainer-assignments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          const apiErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            apiErrors[err.field] = err.message;
          });
          setFormErrors(apiErrors);
          throw new Error('Please fix the validation errors below.');
        }
        throw new Error(data.message || 'Failed to create trainer assignment.');
      }

      setIsAddModalOpen(false);
      triggerSuccess('Trainer assigned successfully!');
      fetchAssignments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create trainer assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        member_id: formFields.member_id,
        trainer_id: formFields.trainer_id,
        start_date: formFields.start_date,
        status: formFields.status
      };
      payload.end_date = formFields.end_date || null;

      const response = await fetch(`${API_BASE_URL}/api/trainer-assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.errors && Array.isArray(data.errors)) {
          const apiErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            apiErrors[err.field] = err.message;
          });
          setFormErrors(apiErrors);
          throw new Error('Please fix the validation errors below.');
        }
        throw new Error(data.message || 'Failed to update assignment.');
      }

      setIsEditModalOpen(false);
      triggerSuccess('Trainer assignment updated successfully.');
      fetchAssignments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update trainer assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (assign: TrainerAssignment, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trainer-assignments/${assign.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to change status.');
      }

      triggerSuccess(`Assignment status updated to ${newStatus}.`);
      fetchAssignments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update assignment status.');
    }
  };

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trainer-assignments/${selectedAssignment.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete assignment.');
      }

      setIsDeleteModalOpen(false);
      triggerSuccess('Trainer assignment deleted.');
      fetchAssignments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete assignment.');
    } finally {
      setSubmitting(false);
    }
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
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 flex-1 w-full max-w-full lg:max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search member name..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#FFE600] text-white"
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
            <input
              type="text"
              value={trainerSearch}
              onChange={(e) => setTrainerSearch(e.target.value)}
              placeholder="Search trainer name..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#FFE600] text-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-[10px] uppercase font-bold tracking-widest text-[#FFE600] shrink-0"
          >
            Filter Records
          </button>
        </form>

        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto justify-start sm:justify-end">
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
              <option value="active">Active Only</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-md shadow-[#FFE600]/10"
          >
            <Plus className="w-4 h-4 text-black" /> Assign Trainer
          </button>
        </div>
      </div>

      {/* Skeletons or Assignments Table */}
      {loading ? (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-zinc-900/40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0c0c0e]/80 border border-zinc-850 space-y-4 shadow-xl">
          <Info className="w-10 h-10 text-zinc-650 mx-auto animate-pulse" />
          <h4 className="text-md font-bold text-white uppercase tracking-wider">No Assignments Found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing the filters, or allocating a member to a coaching guide.
          </p>
        </div>
      ) : (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-850 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Gym Member</th>
                  <th className="px-6 py-4">Allocated Trainer</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 bg-zinc-900/10">
                {assignments.map((assign) => (
                  <tr key={assign.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {assign.member ? `${assign.member.first_name} ${assign.member.last_name}` : 'Unknown Member'}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#FFE600] whitespace-nowrap">
                      {assign.trainer ? `${assign.trainer.first_name} ${assign.trainer.last_name}` : 'Unknown Trainer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">
                      {new Date(assign.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">
                      {assign.end_date ? new Date(assign.end_date).toLocaleDateString() : 'Continuous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={assign.status}
                        onChange={(e) => handleToggleStatus(assign, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer focus:outline-none ${
                          assign.status === 'active'
                            ? 'bg-green-950/40 border border-green-800/50 text-green-400'
                            : assign.status === 'completed'
                            ? 'bg-zinc-850/50 border border-zinc-700 text-zinc-400'
                            : 'bg-red-950/40 border border-red-800/50 text-red-400'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(assign)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-50 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(assign)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-red-450 hover:text-red-300 transition-colors"
                          title="Delete Assignment"
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
              <span>Showing {assignments.length} of {totalCount} trainer assignments</span>
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

      {/* Add & Edit Modal Dialog Overlay */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">
                {isAddModalOpen ? 'Assign Trainer to Member' : 'Modify Allocation Settings'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-zinc-500 hover:text-white font-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleCreateAssignment : handleUpdateAssignment} className="space-y-6">
              {/* Member Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Select Gym Member *</label>
                <select
                  value={formFields.member_id}
                  disabled={isEditModalOpen} // Immutable on edit
                  onChange={(e) => setFormFields({ ...formFields, member_id: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.member_id ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300 disabled:opacity-40`}
                >
                  <option value="">-- Choose Member --</option>
                  {membersList.map(m => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.email})</option>
                  ))}
                </select>
                {formErrors.member_id && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.member_id}</p>}
              </div>

              {/* Trainer Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Select Coach Guide *</label>
                <select
                  value={formFields.trainer_id}
                  onChange={(e) => setFormFields({ ...formFields, trainer_id: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.trainer_id ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300`}
                >
                  <option value="">-- Choose Trainer --</option>
                  {trainersList.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.specialization || 'Fitness'})</option>
                  ))}
                </select>
                {formErrors.trainer_id && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.trainer_id}</p>}
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Start Date *</label>
                  <input
                    type="date"
                    value={formFields.start_date}
                    onChange={(e) => setFormFields({ ...formFields, start_date: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.start_date ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.start_date && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.start_date}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formFields.end_date}
                    onChange={(e) => setFormFields({ ...formFields, end_date: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.end_date ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.end_date && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.end_date}</p>}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Allocation Status</label>
                <select
                  value={formFields.status}
                  onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Modal footer submit */}
              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-xs shadow-md shadow-[#FFE600]/10 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : isAddModalOpen ? 'Assign Trainer' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">Delete Coaching Assignment?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete this assignment for <strong>{selectedAssignment.member ? `${selectedAssignment.member.first_name} ${selectedAssignment.member.last_name}` : 'this member'}</strong>?
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
                onClick={handleDeleteAssignment}
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
