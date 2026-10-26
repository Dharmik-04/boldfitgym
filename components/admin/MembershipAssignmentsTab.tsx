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
  Calendar,
  Layers,
  Sparkles,
  ToggleLeft
} from 'lucide-react';

interface MemberOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  duration_months: number;
}

interface MembershipAssignment {
  id: string;
  member_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  auto_renew: boolean;
  freeze_days: number;
  created_at: string;
  member?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  plan?: {
    name: string;
    price: number;
  };
}

export default function MembershipAssignmentsTab() {
  // Lists & pagination
  const [assignments, setAssignments] = useState<MembershipAssignment[]>([]);
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [plansList, setPlansList] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & form fields
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<MembershipAssignment | null>(null);

  // Form State
  const [formFields, setFormFields] = useState({
    member_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'active',
    auto_renew: false,
    freeze_days: '0'
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

  // Pre-load members and plans options for selectors
  const loadOptions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [membersRes, plansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/members?limit=100`, { headers }),
        fetch(`${API_BASE_URL}/api/membership-plans?limit=100`, { headers })
      ]);

      if (membersRes.ok && plansRes.ok) {
        const mData = await membersRes.json();
        const pData = await plansRes.json();
        setMembersList(mData.data.members || []);
        setPlansList(pData.data.plans || []);
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
        limit: '8',
        sortBy: 'newest'
      });
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (planFilter !== 'all') queryParams.append('plan', planFilter);

      const response = await fetch(`${API_BASE_URL}/api/memberships?${queryParams.toString()}`, {
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load assignments.');
      }

      setAssignments(data.data.memberships || []);
      setTotalPages(data.data.pagination.pages || 1);
      setTotalCount(data.data.pagination.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error while loading memberships.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [page, statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAssignments();
  };

  const resetForm = () => {
    setFormFields({
      member_id: '',
      plan_id: '',
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      auto_renew: false,
      freeze_days: '0'
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (assignment: MembershipAssignment) => {
    setSelectedAssignment(assignment);
    setFormFields({
      member_id: assignment.member_id || '',
      plan_id: assignment.plan_id || '',
      start_date: assignment.start_date || '',
      status: assignment.status || 'active',
      auto_renew: !!assignment.auto_renew,
      freeze_days: assignment.freeze_days?.toString() || '0'
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (assignment: MembershipAssignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formFields.member_id) errors.member_id = 'Please select a member.';
    if (!formFields.plan_id) errors.plan_id = 'Please select a plan package.';
    if (!formFields.start_date) errors.start_date = 'Start date is required.';
    
    if (formFields.freeze_days) {
      const val = parseInt(formFields.freeze_days);
      if (isNaN(val) || val < 0) {
        errors.freeze_days = 'Freeze days must be a non-negative integer.';
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
      const payload = {
        member_id: formFields.member_id,
        plan_id: formFields.plan_id,
        start_date: formFields.start_date,
        status: formFields.status,
        auto_renew: formFields.auto_renew,
        freeze_days: parseInt(formFields.freeze_days)
      };

      const response = await fetch(`${API_BASE_URL}/api/memberships`, {
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
        throw new Error(data.message || 'Failed to assign membership.');
      }

      setIsAddModalOpen(false);
      triggerSuccess('Plan assigned to member successfully!');
      fetchAssignments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create membership assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        member_id: formFields.member_id,
        plan_id: formFields.plan_id,
        start_date: formFields.start_date,
        status: formFields.status,
        auto_renew: formFields.auto_renew,
        freeze_days: parseInt(formFields.freeze_days)
      };

      const response = await fetch(`${API_BASE_URL}/api/memberships/${selectedAssignment.id}`, {
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
        throw new Error(data.message || 'Failed to update membership.');
      }

      setIsEditModalOpen(false);
      triggerSuccess('Membership assignment updated.');
      fetchAssignments();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update membership assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (assignment: MembershipAssignment, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memberships/${assignment.id}/status`, {
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
      setErrorMsg(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/memberships/${selectedAssignment.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete membership.');
      }

      setIsDeleteModalOpen(false);
      triggerSuccess('Membership assignment deleted.');
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
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by member name..."
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
          {/* Plan filter select */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={planFilter}
              onChange={(e) => {
                setPage(1);
                setPlanFilter(e.target.value);
              }}
              className="bg-transparent border-none text-zinc-300 focus:outline-none cursor-pointer uppercase font-black tracking-wider text-[10px]"
            >
              <option value="all">All Packages</option>
              {plansList.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>

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
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-md shadow-[#FFE600]/10"
          >
            <Plus className="w-4 h-4 text-black" /> Assign Membership
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
            Try adjusting your search criteria, clearing the filters, or assigning a plan to a member.
          </p>
        </div>
      ) : (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-850 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Plan Package</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4">Auto Renew</th>
                  <th className="px-6 py-4">Freeze Days</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-250 font-semibold">
                      {assign.plan ? assign.plan.name : 'Unknown Plan'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">
                      {new Date(assign.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">
                      {assign.end_date ? new Date(assign.end_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                        assign.auto_renew ? 'text-[#FFE600]' : 'text-zinc-600'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" /> {assign.auto_renew ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">
                      {assign.freeze_days} Days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={assign.status}
                        onChange={(e) => handleToggleStatus(assign, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer focus:outline-none ${
                          assign.status === 'active'
                            ? 'bg-green-950/40 border border-green-800/50 text-green-400'
                            : assign.status === 'expired'
                            ? 'bg-zinc-850/50 border border-zinc-700 text-zinc-400'
                            : assign.status === 'cancelled'
                            ? 'bg-red-950/40 border border-red-800/50 text-red-400'
                            : 'bg-yellow-950/40 border border-yellow-800/50 text-yellow-400'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="paused">Paused</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(assign)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-55 transition-colors"
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
              <span>Showing {assignments.length} of {totalCount} assignments</span>
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
                {isAddModalOpen ? 'Assign Member Package' : 'Modify Membership Settings'}
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
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Select Member *</label>
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

              {/* Plan Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Select Plan Package *</label>
                <select
                  value={formFields.plan_id}
                  onChange={(e) => setFormFields({ ...formFields, plan_id: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.plan_id ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300`}
                >
                  <option value="">-- Choose Package --</option>
                  {plansList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price} / {p.duration_months} mo)</option>
                  ))}
                </select>
                {formErrors.plan_id && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.plan_id}</p>}
              </div>

              {/* Start Date & Status */}
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
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Status</label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              {/* Auto Renew & Freeze Days */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Freeze Days</label>
                  <input
                    type="number"
                    value={formFields.freeze_days}
                    onChange={(e) => setFormFields({ ...formFields, freeze_days: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.freeze_days ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.freeze_days && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.freeze_days}</p>}
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="auto_renew"
                    checked={formFields.auto_renew}
                    onChange={(e) => setFormFields({ ...formFields, auto_renew: e.target.checked })}
                    className="accent-[#FFE600] w-4.5 h-4.5 rounded border-zinc-800 bg-zinc-950 text-black cursor-pointer focus:ring-0"
                  />
                  <label htmlFor="auto_renew" className="text-xs text-zinc-400 select-none cursor-pointer font-bold uppercase tracking-wider">
                    Enable Auto Renew
                  </label>
                </div>
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
                  {submitting ? 'Submitting...' : isAddModalOpen ? 'Create Assignment' : 'Save Changes'}
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
              <h3 className="text-lg font-black uppercase tracking-wider text-white">Delete Membership Assignment?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete this assignment for <strong>{selectedAssignment.member ? `${selectedAssignment.member.first_name} ${selectedAssignment.member.last_name}` : 'this member'}</strong>?
                This action is irreversible and will remove all checkout logs.
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
