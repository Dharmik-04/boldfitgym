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
  Clock,
  DollarSign
} from 'lucide-react';

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  description?: string;
  status: string;
  created_at: string;
}

export default function MembershipPlansTab() {
  // Lists & pagination
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & form fields
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  // Form State
  const [formFields, setFormFields] = useState({
    name: '',
    price: '',
    duration: '', // Front-end takes duration (in months) and posts it
    description: '',
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

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '6'
      });
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);

      const response = await fetch(`${API_BASE_URL}/api/membership-plans?${queryParams.toString()}`, {
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load plans.');
      }

      setPlans(data.data.plans || []);
      setTotalPages(data.data.pagination.pages || 1);
      setTotalCount(data.data.pagination.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error while loading membership plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPlans();
  };

  const resetForm = () => {
    setFormFields({
      name: '',
      price: '',
      duration: '',
      description: '',
      status: 'active'
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setFormFields({
      name: plan.name || '',
      price: plan.price?.toString() || '',
      duration: plan.duration_months?.toString() || '',
      description: plan.description || '',
      status: plan.status || 'active'
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formFields.name.trim()) errors.name = 'Plan name is required.';
    
    if (!formFields.price) {
      errors.price = 'Price is required.';
    } else if (isNaN(parseFloat(formFields.price)) || parseFloat(formFields.price) <= 0) {
      errors.price = 'Price must be a positive number greater than 0.';
    }

    if (!formFields.duration) {
      errors.duration = 'Duration is required.';
    } else if (isNaN(parseInt(formFields.duration)) || parseInt(formFields.duration) <= 0) {
      errors.duration = 'Duration must be an integer greater than 0.';
    }

    if (formFields.description && formFields.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        name: formFields.name.trim(),
        price: parseFloat(formFields.price),
        duration: parseInt(formFields.duration), // Matches backend validator 'duration' key
        status: formFields.status
      };
      if (formFields.description.trim()) payload.description = formFields.description.trim();

      const response = await fetch(`${API_BASE_URL}/api/membership-plans`, {
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
        throw new Error(data.message || 'Failed to create plan.');
      }

      setIsAddModalOpen(false);
      triggerSuccess('New plan tier created successfully!');
      fetchPlans();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        name: formFields.name.trim(),
        price: parseFloat(formFields.price),
        duration: parseInt(formFields.duration),
        status: formFields.status
      };
      payload.description = formFields.description.trim() || null;

      const response = await fetch(`${API_BASE_URL}/api/membership-plans/${selectedPlan.id}`, {
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
        throw new Error(data.message || 'Failed to update plan.');
      }

      setIsEditModalOpen(false);
      triggerSuccess('Membership plan updated.');
      fetchPlans();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan: MembershipPlan, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/membership-plans/${plan.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to change status.');
      }

      triggerSuccess(`Plan status updated to ${newStatus}.`);
      fetchPlans();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status.');
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/membership-plans/${selectedPlan.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete plan.');
      }

      setIsDeleteModalOpen(false);
      triggerSuccess('Plan deleted successfully.');
      fetchPlans();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete membership plan.');
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
            placeholder="Search by package name..."
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
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-md shadow-[#FFE600]/10"
          >
            <Plus className="w-4 h-4 text-black" /> Create Plan Tier
          </button>
        </div>
      </div>

      {/* Skeletons or Plans Table */}
      {loading ? (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-zinc-900/40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : plans.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0c0c0e]/80 border border-zinc-850 space-y-4 shadow-xl">
          <Info className="w-10 h-10 text-zinc-655 mx-auto animate-pulse" />
          <h4 className="text-md font-bold text-white uppercase tracking-wider">No Plans Configured</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing the status filters, or creating a new pricing tier.
          </p>
        </div>
      ) : (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-850 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Package Name</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 bg-zinc-900/10">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {plan.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-zinc-200">
                      ${plan.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                      {plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}
                    </td>
                    <td className="px-6 py-4 text-zinc-450 max-w-xs truncate">
                      {plan.description || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={plan.status}
                        onChange={(e) => handleToggleStatus(plan, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer focus:outline-none ${
                          plan.status === 'active'
                            ? 'bg-green-950/40 border border-green-800/50 text-green-400'
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(plan)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-50 transition-colors"
                          title="Edit Plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(plan)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-red-450 hover:text-red-300 transition-colors"
                          title="Delete Plan"
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
              <span>Showing {plans.length} of {totalCount} plans</span>
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
          <div className="w-full max-w-lg bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">
                {isAddModalOpen ? 'Create Pricing Package' : 'Edit Membership Plan'}
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

            <form onSubmit={isAddModalOpen ? handleCreatePlan : handleUpdatePlan} className="space-y-6">
              {/* Plan Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Package Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Premium Athlete Access"
                  value={formFields.name}
                  onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.name ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                />
                {formErrors.name && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.name}</p>}
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Price ($ USD) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="e.g. 49.99"
                      value={formFields.price}
                      onChange={(e) => setFormFields({ ...formFields, price: e.target.value })}
                      className={`w-full bg-zinc-950 border ${formErrors.price ? 'border-red-900' : 'border-zinc-800'} rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                    />
                  </div>
                  {formErrors.price && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.price}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Duration (Months) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 1, 3, 12"
                    value={formFields.duration}
                    onChange={(e) => setFormFields({ ...formFields, duration: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.duration ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.duration && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.duration}</p>}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Plan Status</label>
                <select
                  value={formFields.status}
                  onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Package Description</label>
                <textarea
                  placeholder="Describe plan features, towels, keycards, saunas..."
                  rows={4}
                  value={formFields.description}
                  onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.description ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white resize-none`}
                />
                {formErrors.description && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.description}</p>}
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
                  {submitting ? 'Submitting...' : isAddModalOpen ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">Delete Pricing Tier?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete <strong>{selectedPlan.name}</strong>?
                This might fail or cause integrity conflicts if members are actively assigned to this package.
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
                onClick={handleDeletePlan}
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
