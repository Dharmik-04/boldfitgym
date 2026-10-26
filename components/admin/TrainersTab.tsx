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
  Award,
  Phone,
  Mail,
  User
} from 'lucide-react';

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  status: string;
  created_at: string;
}

export default function TrainersTab() {
  // Lists & pagination
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & form fields
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  // Form State
  const [formFields, setFormFields] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
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

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        sortBy: 'newest'
      });
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (specFilter.trim()) queryParams.append('specialization', specFilter.trim());

      const response = await fetch(`${API_BASE_URL}/api/trainers?${queryParams.toString()}`, {
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load trainers.');
      }

      setTrainers(data.data.trainers || []);
      setTotalPages(data.data.pagination.pages || 1);
      setTotalCount(data.data.pagination.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error while searching trainers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTrainers();
  };

  const resetForm = () => {
    setFormFields({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      specialization: '',
      status: 'active'
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setFormFields({
      first_name: trainer.first_name || '',
      last_name: trainer.last_name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      specialization: trainer.specialization || '',
      status: trainer.status || 'active'
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formFields.first_name.trim()) errors.first_name = 'First name is required.';
    if (!formFields.last_name.trim()) errors.last_name = 'Last name is required.';
    if (!formFields.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formFields.email)) {
      errors.email = 'Invalid email address format.';
    }
    if (formFields.phone && (formFields.phone.length < 5 || formFields.phone.length > 20)) {
      errors.phone = 'Phone number must be between 5 and 20 digits.';
    }
    if (formFields.specialization && formFields.specialization.length > 150) {
      errors.specialization = 'Specialization cannot exceed 150 characters.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        first_name: formFields.first_name.trim(),
        last_name: formFields.last_name.trim(),
        email: formFields.email.trim(),
        status: formFields.status
      };
      if (formFields.phone.trim()) payload.phone = formFields.phone.trim();
      if (formFields.specialization.trim()) payload.specialization = formFields.specialization.trim();

      const response = await fetch(`${API_BASE_URL}/api/trainers`, {
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
        throw new Error(data.message || 'Failed to create trainer profile.');
      }

      setIsAddModalOpen(false);
      triggerSuccess('New trainer profile created!');
      fetchTrainers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add trainer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainer || !validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        first_name: formFields.first_name.trim(),
        last_name: formFields.last_name.trim(),
        email: formFields.email.trim(),
        status: formFields.status
      };
      payload.phone = formFields.phone.trim() || null;
      payload.specialization = formFields.specialization.trim() || null;

      const response = await fetch(`${API_BASE_URL}/api/trainers/${selectedTrainer.id}`, {
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
        throw new Error(data.message || 'Failed to update trainer.');
      }

      setIsEditModalOpen(false);
      triggerSuccess('Trainer profile updated successfully.');
      fetchTrainers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update trainer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (trainer: Trainer, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trainers/${trainer.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to change status.');
      }

      triggerSuccess(`Trainer status updated to ${newStatus}.`);
      fetchTrainers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteTrainer = async () => {
    if (!selectedTrainer) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trainers/${selectedTrainer.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete trainer.');
      }

      setIsDeleteModalOpen(false);
      triggerSuccess('Trainer deleted from system.');
      fetchTrainers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete trainer.');
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
            placeholder="Search by name or email address..."
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
            <Plus className="w-4 h-4 text-black" /> Add Trainer Profile
          </button>
        </div>
      </div>

      {/* Skeletons or Trainers Table */}
      {loading ? (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-zinc-900/40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : trainers.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0c0c0e]/80 border border-zinc-850 space-y-4 shadow-xl">
          <Info className="w-10 h-10 text-zinc-650 mx-auto animate-pulse" />
          <h4 className="text-md font-bold text-white uppercase tracking-wider">No Trainers Registered</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing the status filters, or registering a new trainer profile.
          </p>
        </div>
      ) : (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-850 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Trainer Name</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 bg-zinc-900/10">
                {trainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {trainer.first_name} {trainer.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400">{trainer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">{trainer.phone || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[#FFE600] font-semibold flex items-center gap-1.5 mt-2 border-none">
                      <Award className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                      {trainer.specialization || 'General Fitness'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={trainer.status}
                        onChange={(e) => handleToggleStatus(trainer, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer focus:outline-none ${
                          trainer.status === 'active'
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
                          onClick={() => handleOpenEditModal(trainer)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-50 transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(trainer)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-red-450 hover:text-red-300 transition-colors"
                          title="Delete Profile"
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
              <span>Showing {trainers.length} of {totalCount} trainers</span>
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
                {isAddModalOpen ? 'Register Gym Trainer' : 'Modify Trainer Profile'}
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

            <form onSubmit={isAddModalOpen ? handleCreateTrainer : handleUpdateTrainer} className="space-y-6">
              {/* Trainer Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">First Name *</label>
                  <input
                    type="text"
                    value={formFields.first_name}
                    onChange={(e) => setFormFields({ ...formFields, first_name: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.first_name ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.first_name && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.first_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Last Name *</label>
                  <input
                    type="text"
                    value={formFields.last_name}
                    onChange={(e) => setFormFields({ ...formFields, last_name: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.last_name ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.last_name && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.last_name}</p>}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    value={formFields.email}
                    disabled={isEditModalOpen} // Immutable email for security mapping
                    onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.email ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white disabled:opacity-40`}
                  />
                  {formErrors.email && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 87654321"
                    value={formFields.phone}
                    onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.phone ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.phone && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.phone}</p>}
                </div>
              </div>

              {/* Specialization & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. CrossFit, Powerlifting, Yoga"
                    value={formFields.specialization}
                    onChange={(e) => setFormFields({ ...formFields, specialization: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.specialization ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.specialization && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.specialization}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Account Status</label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                  {submitting ? 'Submitting...' : isAddModalOpen ? 'Create Trainer' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && selectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">Remove Trainer Profile?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete trainer <strong>{selectedTrainer.first_name} {selectedTrainer.last_name}</strong>?
                This action is irreversible and will remove all their active course assignments.
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
                onClick={handleDeleteTrainer}
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
