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
  DollarSign,
  CreditCard,
  TrendingUp,
  Receipt,
  FileText,
  Download,
  Eye,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';

interface MemberOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface MembershipOption {
  id: string;
  plan?: {
    name: string;
  };
  start_date: string;
  status: string;
}

interface Payment {
  id: string;
  invoice_number: string;
  member_id: string;
  membership_id?: string;
  amount: number;
  currency: string;
  discount: number;
  tax: number;
  final_amount: number; // calculated in backend service
  payment_method: string;
  payment_status: string;
  payment_date: string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
  member?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function PaymentsTab() {
  // Lists & pagination
  const [payments, setPayments] = useState<Payment[]>([]);
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [membershipsList, setMembershipsList] = useState<MembershipOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & form fields
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Form State
  const [formFields, setFormFields] = useState({
    member_id: '',
    membership_id: '',
    amount: '',
    currency: 'USD',
    discount: '0',
    tax: '0',
    payment_method: 'credit_card',
    payment_status: 'completed',
    notes: '',
    receipt_url: ''
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

  // Pre-load members list options
  const loadOptions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [membersRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/members?limit=100`, { headers }),
        fetch(`${API_BASE_URL}/api/dashboard`, { headers })
      ]);

      if (membersRes.ok) {
        const mData = await membersRes.json();
        setMembersList(mData.data.members || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setDashboardStats(sData.data || null);
      }
    } catch (err) {
      console.error('Failed to load select options:', err);
    }
  };

  // Load memberships of selected member
  const loadMemberMemberships = async (memberId: string) => {
    if (!memberId) {
      setMembershipsList([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/memberships?limit=50`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Filter memberships for this member
        const list = (data.data.memberships || []).filter((m: any) => m.member_id === memberId);
        setMembershipsList(list);
      }
    } catch (err) {
      console.error('Failed to load member assignments:', err);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        sortBy: 'newest'
      });
      if (search) queryParams.append('search', search);
      if (statusFilter !== 'all') queryParams.append('payment_status', statusFilter);
      if (methodFilter !== 'all') queryParams.append('payment_method', methodFilter);
      if (memberFilter !== 'all') queryParams.append('member', memberFilter);

      const response = await fetch(`${API_BASE_URL}/api/payments?${queryParams.toString()}`, {
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load payments.');
      }

      setPayments(data.data.payments || []);
      setTotalPages(data.data.pagination.pages || 1);
      setTotalCount(data.data.pagination.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error while searching payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, methodFilter, memberFilter]);

  // Load memberships when selected member changes in the modal form
  useEffect(() => {
    loadMemberMemberships(formFields.member_id);
  }, [formFields.member_id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const resetForm = () => {
    setFormFields({
      member_id: '',
      membership_id: '',
      amount: '',
      currency: 'USD',
      discount: '0',
      tax: '0',
      payment_method: 'credit_card',
      payment_status: 'completed',
      notes: '',
      receipt_url: ''
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (pay: Payment) => {
    setSelectedPayment(pay);
    setFormFields({
      member_id: pay.member_id || '',
      membership_id: pay.membership_id || '',
      amount: pay.amount?.toString() || '',
      currency: pay.currency || 'USD',
      discount: pay.discount?.toString() || '0',
      tax: pay.tax?.toString() || '0',
      payment_method: pay.payment_method || 'credit_card',
      payment_status: pay.payment_status || 'completed',
      notes: pay.notes || '',
      receipt_url: pay.receipt_url || ''
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (pay: Payment) => {
    setSelectedPayment(pay);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formFields.member_id) errors.member_id = 'Please select a member.';
    
    if (!formFields.amount) {
      errors.amount = 'Amount is required.';
    } else if (isNaN(parseFloat(formFields.amount)) || parseFloat(formFields.amount) <= 0) {
      errors.amount = 'Amount must be a positive float greater than 0.';
    }

    if (formFields.currency && (formFields.currency.length !== 3 || !/^[A-Za-z]+$/.test(formFields.currency))) {
      errors.currency = 'Currency must be a valid 3-letter code (e.g. USD).';
    }

    if (formFields.discount && (isNaN(parseFloat(formFields.discount)) || parseFloat(formFields.discount) < 0)) {
      errors.discount = 'Discount must be a non-negative number.';
    }

    if (formFields.tax && (isNaN(parseFloat(formFields.tax)) || parseFloat(formFields.tax) < 0)) {
      errors.tax = 'Tax must be a non-negative number.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        member_id: formFields.member_id,
        amount: parseFloat(formFields.amount),
        currency: formFields.currency.toUpperCase(),
        discount: parseFloat(formFields.discount || '0'),
        tax: parseFloat(formFields.tax || '0'),
        payment_method: formFields.payment_method,
        payment_status: formFields.payment_status
      };
      if (formFields.membership_id) payload.membership_id = formFields.membership_id;
      if (formFields.notes.trim()) payload.notes = formFields.notes.trim();

      const response = await fetch(`${API_BASE_URL}/api/payments`, {
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
        throw new Error(data.message || 'Failed to create payment.');
      }

      setIsAddModalOpen(false);
      triggerSuccess('Invoice and transaction recorded successfully!');
      fetchPayments();
      loadOptions(); // refresh dashboardStats monthly gross
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add payment transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        member_id: formFields.member_id,
        amount: parseFloat(formFields.amount),
        currency: formFields.currency.toUpperCase(),
        discount: parseFloat(formFields.discount || '0'),
        tax: parseFloat(formFields.tax || '0'),
        payment_method: formFields.payment_method,
        payment_status: formFields.payment_status
      };
      payload.membership_id = formFields.membership_id || null;
      payload.notes = formFields.notes.trim() || null;

      const response = await fetch(`${API_BASE_URL}/api/payments/${selectedPayment.id}`, {
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
        throw new Error(data.message || 'Failed to update payment.');
      }

      setIsEditModalOpen(false);
      triggerSuccess('Transaction updated successfully!');
      fetchPayments();
      loadOptions();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (pay: Payment, newStatus: string) => {
    try {
      // Backend status PATCH validator validates status in body
      const response = await fetch(`${API_BASE_URL}/api/payments/${pay.id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to change status.');
      }

      triggerSuccess(`Transaction status updated to ${newStatus}.`);
      fetchPayments();
      loadOptions();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update payment status.');
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/${selectedPayment.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete payment.');
      }

      setIsDeleteModalOpen(false);
      triggerSuccess('Transaction deleted from system.');
      fetchPayments();
      loadOptions();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoice = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/${id}/invoice`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to download invoice.');
      }
      window.open(data.data.url, '_blank');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download invoice.');
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/${id}/send-email`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send email.');
      triggerSuccess('Invoice emailed successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send email.');
    }
  };

  const handleSendPhone = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/${id}/send-phone`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send SMS.');
      triggerSuccess('Invoice sent via SMS successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send SMS.');
    }
  };

  const handleSendWhatsapp = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/${id}/send-whatsapp`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send WhatsApp message.');
      triggerSuccess('Invoice sent via WhatsApp successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send WhatsApp message.');
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

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Monthly Gross</span>
            <span className="text-3xl font-black text-[#FFE600]">
              ${(dashboardStats?.kpis?.monthly_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-zinc-450 block">Completed invoices</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#FFE600]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Invoices Recorded</span>
            <span className="text-3xl font-black text-white">{totalCount}</span>
            <span className="text-[10px] text-zinc-450 block">Transactions processed</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#FFE600]">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0c0c0e]/80 border border-zinc-800 flex items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Completed Average</span>
            <span className="text-3xl font-black text-white">
              {payments.length > 0 
                ? `$${(payments.filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + p.final_amount, 0) / (payments.filter(p => p.payment_status === 'completed').length || 1)).toFixed(2)}`
                : '—'}
            </span>
            <span className="text-[10px] text-zinc-450 block">Completed ticket ticket mean</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#FFE600]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-[#0c0c0e]/80 border border-zinc-800 p-6 rounded-2xl shadow-xl backdrop-blur-md w-full">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice number (e.g. INV-)..."
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
          {/* Member filter select */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={memberFilter}
              onChange={(e) => {
                setPage(1);
                setMemberFilter(e.target.value);
              }}
              className="bg-transparent border-none text-zinc-300 focus:outline-none cursor-pointer uppercase font-black tracking-wider text-[10px]"
            >
              <option value="all">All Members</option>
              {membersList.map(member => (
                <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
              ))}
            </select>
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
              <option value="completed">Completed Only</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-md shadow-[#FFE600]/10"
          >
            <Plus className="w-4 h-4 text-black" /> Record Payment
          </button>
        </div>
      </div>

      {/* Skeletons or Payments Table */}
      {loading ? (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-zinc-900/40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : payments.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0c0c0e]/80 border border-zinc-850 space-y-4 shadow-xl">
          <Info className="w-10 h-10 text-zinc-650 mx-auto animate-pulse" />
          <h4 className="text-md font-bold text-white uppercase tracking-wider">No Billing Records Found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing the status/member filters, or recording a new payment.
          </p>
        </div>
      ) : (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-850 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Gross Amt</th>
                  <th className="px-6 py-4">Tax / Disc</th>
                  <th className="px-6 py-4">Final Bill</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Billing Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 bg-zinc-900/10">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-zinc-500" /> {pay.invoice_number}
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-200 whitespace-nowrap">
                      {pay.member ? `${pay.member.first_name} ${pay.member.last_name}` : 'Unknown Member'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                      ${pay.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-450">
                      <span className="text-red-400">-${pay.discount.toFixed(2)}</span> / <span className="text-green-400">+${pay.tax.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-black text-white">
                      ${pay.final_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap uppercase tracking-wider text-[10px] text-zinc-500">
                      {pay.payment_method.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-450">
                      {new Date(pay.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={pay.payment_status}
                        onChange={(e) => handleToggleStatus(pay, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer focus:outline-none ${
                          pay.payment_status === 'completed'
                            ? 'bg-green-950/40 border border-green-800/50 text-green-400'
                            : pay.payment_status === 'pending'
                            ? 'bg-yellow-950/40 border border-yellow-800/50 text-yellow-400'
                            : pay.payment_status === 'failed'
                            ? 'bg-red-950/40 border border-red-800/50 text-red-400'
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(pay);
                            setIsDetailsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {pay.payment_status === 'completed' && pay.receipt_url && (
                          <>
                            <button
                              onClick={() => handleSendEmail(pay.id)}
                              className="p-1.5 hover:bg-zinc-850 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors"
                              title="Email Invoice"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSendPhone(pay.id)}
                              className="p-1.5 hover:bg-zinc-850 rounded-lg text-pink-400 hover:text-pink-300 transition-colors"
                              title="Send via SMS"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSendWhatsapp(pay.id)}
                              className="p-1.5 hover:bg-zinc-850 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors"
                              title="Send via WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(pay.id)}
                              className="p-1.5 hover:bg-zinc-850 rounded-lg text-green-400 hover:text-green-300 transition-colors"
                              title="Download Invoice"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(pay)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-55 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(pay)}
                          className="p-1.5 hover:bg-zinc-850 rounded-lg text-red-450 hover:text-red-300 transition-colors"
                          title="Delete Payment"
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
              <span>Showing {payments.length} of {totalCount} billing transactions</span>
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
                {isAddModalOpen ? 'Record Payment Transaction' : 'Modify Invoice Details'}
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

            <form onSubmit={isAddModalOpen ? handleCreatePayment : handleUpdatePayment} className="space-y-6">
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

              {/* Membership Selector */}
              {formFields.member_id && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Link to Membership (Optional)</label>
                  <select
                    value={formFields.membership_id}
                    onChange={(e) => setFormFields({ ...formFields, membership_id: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-350"
                  >
                    <option value="">-- No Active Membership Link --</option>
                    {membershipsList.map(m => (
                      <option key={m.id} value={m.id}>{m.plan?.name || 'Package'} (Starts: {new Date(m.start_date).toLocaleDateString()}) [{m.status}]</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Base Billing Amount ($) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 49.99"
                    value={formFields.amount}
                    onChange={(e) => setFormFields({ ...formFields, amount: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.amount ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.amount && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.amount}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Currency</label>
                  <input
                    type="text"
                    placeholder="USD"
                    value={formFields.currency}
                    onChange={(e) => setFormFields({ ...formFields, currency: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.currency ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.currency && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.currency}</p>}
                </div>
              </div>

              {/* Discount & Tax */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Discount ($)</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={formFields.discount}
                    onChange={(e) => setFormFields({ ...formFields, discount: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.discount ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.discount && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.discount}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Tax ($)</label>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={formFields.tax}
                    onChange={(e) => setFormFields({ ...formFields, tax: e.target.value })}
                    className={`w-full bg-zinc-950 border ${formErrors.tax ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                  />
                  {formErrors.tax && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.tax}</p>}
                </div>
              </div>

              {/* Payment Method & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Payment Method *</label>
                  <select
                    value={formFields.payment_method}
                    onChange={(e) => setFormFields({ ...formFields, payment_method: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="cash">Cash Payment</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_wallet">Mobile Wallet</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Payment Status *</label>
                  <select
                    value={formFields.payment_status}
                    onChange={(e) => setFormFields({ ...formFields, payment_status: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Internal Notes</label>
                <textarea
                  placeholder="Transaction details, special checkout overrides..."
                  rows={3}
                  value={formFields.notes}
                  onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white resize-none"
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
                  {submitting ? 'Submitting...' : isAddModalOpen ? 'Record Payment' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">Delete Transaction Record?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete invoice <strong>{selectedPayment.invoice_number}</strong>?
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
                onClick={handleDeletePayment}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-red-650 hover:bg-red-500 text-white font-extrabold uppercase tracking-wider text-xs disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal Overlay */}
      {isDetailsModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-zinc-400" />
                Payment Details: {selectedPayment.invoice_number}
              </h3>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-zinc-500 hover:text-white font-black text-sm"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-zinc-300">
              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Member</span>
                  <span className="font-bold text-white">{selectedPayment.member?.first_name} {selectedPayment.member?.last_name} ({selectedPayment.member?.email})</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Payment Method</span>
                  <span className="uppercase text-white text-xs">{selectedPayment.payment_method.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Payment Status</span>
                  <span className={`uppercase font-black text-xs ${
                    selectedPayment.payment_status === 'completed' ? 'text-green-400' :
                    selectedPayment.payment_status === 'pending' ? 'text-yellow-400' :
                    selectedPayment.payment_status === 'failed' ? 'text-red-400' : 'text-zinc-400'
                  }`}>
                    {selectedPayment.payment_status}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Payment Date</span>
                  <span>{new Date(selectedPayment.payment_date).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Base Amount</span>
                  <span>${selectedPayment.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Discount</span>
                  <span className="text-red-400">-${selectedPayment.discount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Tax</span>
                  <span className="text-green-400">+${selectedPayment.tax.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Final Total</span>
                  <span className="text-xl font-black text-white">${selectedPayment.final_amount.toFixed(2)} {selectedPayment.currency}</span>
                </div>
              </div>
            </div>
            {selectedPayment.notes && (
              <div className="pt-4 border-t border-zinc-800">
                <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Notes</span>
                <p className="text-sm text-zinc-400 bg-zinc-950 p-3 rounded-xl border border-zinc-900">{selectedPayment.notes}</p>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-3 border-t border-zinc-800 pt-6">
              {selectedPayment.payment_status === 'completed' && selectedPayment.receipt_url && (
                <>
                  <button
                    onClick={() => handleSendEmail(selectedPayment.id)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-extrabold uppercase tracking-wider text-xs flex items-center gap-2 border border-indigo-500/20"
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button
                    onClick={() => handleSendPhone(selectedPayment.id)}
                    className="px-4 py-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-extrabold uppercase tracking-wider text-xs flex items-center gap-2 border border-pink-500/20"
                  >
                    <Phone className="w-4 h-4" /> SMS
                  </button>
                  <button
                    onClick={() => handleSendWhatsapp(selectedPayment.id)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-extrabold uppercase tracking-wider text-xs flex items-center gap-2 border border-emerald-500/20"
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(selectedPayment.id)}
                    className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-xs flex items-center gap-2 shadow-md shadow-[#FFE600]/10"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </>
              )}
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-bold uppercase tracking-wider text-zinc-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
