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
  ChevronDown,
  UserCheck,
  UserX,
  AlertTriangle,
  Check,
  Info,
  Calendar,
  Phone,
  Mail,
  User
} from 'lucide-react';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  gender?: string;
  status: string;
  join_date: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  blood_group?: string;
  emergency_contact_email?: string;
}

interface MemberStatusDropdownProps {
  member: Member;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (status: string) => void;
  openUpward: boolean;
}

function MemberStatusDropdown({
  member,
  isOpen,
  onToggle,
  onClose,
  onChange,
  openUpward
}: MemberStatusDropdownProps) {
  const statusColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    active: {
      bg: 'bg-green-950/40',
      border: 'border-green-800/50',
      text: 'text-green-400',
      dot: 'bg-green-400'
    },
    suspended: {
      bg: 'bg-red-950/40',
      border: 'border-red-800/50',
      text: 'text-red-400',
      dot: 'bg-red-400'
    },
    pending: {
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-800/50',
      text: 'text-yellow-400',
      dot: 'bg-yellow-400'
    },
    inactive: {
      bg: 'bg-zinc-800',
      border: 'border-zinc-700',
      text: 'text-zinc-400',
      dot: 'bg-zinc-500'
    }
  };

  const statusInfo = statusColors[member.status] || statusColors.inactive;
  const options = ['active', 'inactive', 'pending', 'suspended'];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer border ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text} flex items-center gap-1.5 hover:brightness-110 focus:ring-2 focus:ring-[#FFE600]/30 focus:border-[#FFE600] outline-none transition-all`}
      >
        <span className={`w-1 h-1 rounded-full ${statusInfo.dot}`} />
        <span>{member.status}</span>
        <ChevronDown className="w-3 h-3 opacity-80 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div
            className={`absolute ${
              openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } right-0 z-50 w-32 rounded-xl border border-zinc-800 bg-[#0c0c0e] shadow-2xl p-1 focus:outline-none`}
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => {
              const optionInfo = statusColors[option] || statusColors.inactive;
              const isSelected = member.status === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-zinc-800/80 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${optionInfo.dot}`} />
                    <span>{option}</span>
                  </div>
                  {isSelected && <span className="text-[#FFE600] text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

interface StatusFilterDropdownProps {
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (status: string) => void;
}

function StatusFilterDropdown({
  value,
  isOpen,
  onToggle,
  onClose,
  onChange
}: StatusFilterDropdownProps) {
  const options = [
    { label: 'ALL STATUSES', value: 'all' },
    { label: 'ACTIVE', value: 'active' },
    { label: 'INACTIVE', value: 'inactive' },
    { label: 'SUSPENDED', value: 'suspended' },
    { label: 'PENDING', value: 'pending' }
  ];

  const currentOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 cursor-pointer uppercase font-black tracking-wider text-[10px] focus:ring-2 focus:ring-[#FFE600]/30 focus:border-[#FFE600] outline-none transition-all"
      >
        <Filter className="w-3.5 h-3.5 text-zinc-500" />
        <span>{currentOption.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 opacity-80 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div
            className="absolute top-full mt-1.5 right-0 z-55 w-40 rounded-xl border border-zinc-800 bg-[#0c0c0e] shadow-2xl p-1 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-zinc-800/80 text-white'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <span className="text-[#FFE600] text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function MembersTab() {
  // Lists & pagination
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & form fields
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Form State
  const [formFields, setFormFields] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    height: '',
    weight: '',
    blood_group: '',
    emergency_contact_email: '',
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

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        sortBy: 'newest'
      });
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);

      const response = await fetch(`${API_BASE_URL}/api/members?${queryParams.toString()}`, {
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load members.');
      }

      setMembers(data.data.members || []);
      setTotalPages(data.data.pagination.pages || 1);
      setTotalCount(data.data.pagination.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error while searching members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const resetForm = () => {
    setFormFields({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender: '',
      date_of_birth: '',
      height: '',
      weight: '',
      blood_group: '',
      emergency_contact_email: '',
      status: 'active'
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setSelectedMember(member);
    setFormFields({
      first_name: member.first_name || '',
      last_name: member.last_name || '',
      email: member.email || '',
      phone: member.phone || '',
      gender: member.gender || '',
      date_of_birth: member.date_of_birth || '',
      height: member.height?.toString() || '',
      weight: member.weight?.toString() || '',
      blood_group: member.blood_group || '',
      emergency_contact_email: member.emergency_contact_email || '',
      status: member.status || 'active'
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (member: Member) => {
    setSelectedMember(member);
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
    if (formFields.height && isNaN(parseFloat(formFields.height))) {
      errors.height = 'Height must be a valid number.';
    }
    if (formFields.weight && isNaN(parseFloat(formFields.weight))) {
      errors.weight = 'Weight must be a valid number.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateMember = async (e: React.FormEvent) => {
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
      if (formFields.gender) payload.gender = formFields.gender;
      if (formFields.date_of_birth) payload.date_of_birth = formFields.date_of_birth;
      if (formFields.height) payload.height = parseFloat(formFields.height);
      if (formFields.weight) payload.weight = parseFloat(formFields.weight);
      if (formFields.blood_group) payload.blood_group = formFields.blood_group;
      if (formFields.emergency_contact_email.trim()) payload.emergency_contact_email = formFields.emergency_contact_email.trim();

      const response = await fetch(`${API_BASE_URL}/api/members`, {
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
        throw new Error(data.message || 'Failed to create member.');
      }

      setIsAddModalOpen(false);
      triggerSuccess('New member added successfully!');
      fetchMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        first_name: formFields.first_name.trim(),
        last_name: formFields.last_name.trim(),
        email: formFields.email.trim(),
        status: formFields.status
      };
      payload.phone = formFields.phone.trim() || null;
      payload.gender = formFields.gender || null;
      payload.date_of_birth = formFields.date_of_birth || null;
      payload.height = formFields.height ? parseFloat(formFields.height) : null;
      payload.weight = formFields.weight ? parseFloat(formFields.weight) : null;
      payload.blood_group = formFields.blood_group || null;
      payload.emergency_contact_email = formFields.emergency_contact_email.trim() || null;

      const response = await fetch(`${API_BASE_URL}/api/members/${selectedMember.id}`, {
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
        throw new Error(data.message || 'Failed to update member.');
      }

      setIsEditModalOpen(false);
      triggerSuccess('Member updated successfully!');
      fetchMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: Member, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${member.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to change status.');
      }

      triggerSuccess(`Member status updated to ${newStatus}.`);
      fetchMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status.');
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${selectedMember.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete member.');
      }

      setIsDeleteModalOpen(false);
      triggerSuccess('Member deleted from system.');
      fetchMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete member.');
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
      <div className="relative z-20 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-[#0c0c0e]/80 border border-zinc-800 p-6 rounded-2xl shadow-xl backdrop-blur-md w-full">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by first name, last name, email or phone..."
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
          <StatusFilterDropdown
            value={statusFilter}
            isOpen={isFilterDropdownOpen}
            onToggle={() => {
              setIsFilterDropdownOpen(!isFilterDropdownOpen);
              setOpenDropdownId(null);
            }}
            onClose={() => setIsFilterDropdownOpen(false)}
            onChange={(newStatus) => {
              setPage(1);
              setStatusFilter(newStatus);
            }}
          />

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-md shadow-[#FFE600]/10"
          >
            <Plus className="w-4 h-4 text-black" /> Add New Member
          </button>
        </div>
      </div>

      {/* Skeletons or Members Table */}
      {loading ? (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-zinc-900/40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0c0c0e]/80 border border-zinc-850 space-y-4 shadow-xl">
          <Info className="w-10 h-10 text-zinc-650 mx-auto animate-pulse" />
          <h4 className="text-md font-bold text-white uppercase tracking-wider">No Members Found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing the status filters, or bootstrap new member profiles.
          </p>
        </div>
      ) : (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto min-h-[280px]">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-850 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Join Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 bg-zinc-900/10">
                {members.map((member, idx) => (
                  <tr key={member.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">{member.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">{member.phone || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap uppercase tracking-wider text-[10px] text-zinc-500">
                      {member.gender ? member.gender.replace(/_/g, ' ') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">
                      {new Date(member.join_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MemberStatusDropdown
                        member={member}
                        isOpen={openDropdownId === member.id}
                        onToggle={() => {
                          setOpenDropdownId(openDropdownId === member.id ? null : member.id);
                          setIsFilterDropdownOpen(false);
                        }}
                        onClose={() => setOpenDropdownId(null)}
                        onChange={(newStatus) => handleToggleStatus(member, newStatus)}
                        openUpward={idx > 0 && idx >= members.length - 2}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-50 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(member)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-red-450 hover:text-red-300 transition-colors"
                          title="Delete Member"
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
              <span>Showing {members.length} of {totalCount} members</span>
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
          <div className="w-full max-w-2xl bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">
                {isAddModalOpen ? 'Add New Member Profile' : 'Edit Member Details'}
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

            <form onSubmit={isAddModalOpen ? handleCreateMember : handleUpdateMember} className="space-y-6">
              {/* Row 1: Name */}
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

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    value={formFields.email}
                    disabled={isEditModalOpen} // Email immutable on edit for security / safety
                    onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.email ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white disabled:opacity-40`}
                  />
                  {formErrors.email && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 98765432"
                    value={formFields.phone}
                    onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.phone ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.phone && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.phone}</p>}
                </div>
              </div>

              {/* Row 3: DOB, Gender, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={formFields.date_of_birth}
                    onChange={(e) => setFormFields({ ...formFields, date_of_birth: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Gender</label>
                  <select
                    value={formFields.gender}
                    onChange={(e) => setFormFields({ ...formFields, gender: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer Not To Say</option>
                  </select>
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
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Height, Weight, Blood Group */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Height (cm)</label>
                  <input
                    type="text"
                    placeholder="e.g. 175"
                    value={formFields.height}
                    onChange={(e) => setFormFields({ ...formFields, height: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.height ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.height && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.height}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Weight (kg)</label>
                  <input
                    type="text"
                    placeholder="e.g. 70"
                    value={formFields.weight}
                    onChange={(e) => setFormFields({ ...formFields, weight: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.weight ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.weight && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.weight}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Blood Group</label>
                  <select
                    value={formFields.blood_group}
                    onChange={(e) => setFormFields({ ...formFields, blood_group: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                  >
                    <option value="">Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Emergency Contact */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Emergency Contact Email</label>
                <input
                  type="email"
                  placeholder="emergency@contact.com"
                  value={formFields.emergency_contact_email}
                  onChange={(e) => setFormFields({ ...formFields, emergency_contact_email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white"
                />
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
                  {submitting ? 'Submitting...' : isAddModalOpen ? 'Create Profile' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">Delete Member Profile?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete <strong>{selectedMember.first_name} {selectedMember.last_name}</strong>?
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
                onClick={handleDeleteMember}
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
