'use client';

import { API_BASE_URL } from '@/lib/apiConfig';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Info,
  Bell,
  Eye,
  MailOpen,
  Calendar,
  Layers,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MemberOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  member_id?: string;
  admin_id?: string;
  created_at: string;
}

interface NotificationsTabProps {
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationsTab({ onUnreadCountChange }: NotificationsTabProps) {
  // Lists & pagination
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals & form fields
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // Form State
  const [formFields, setFormFields] = useState({
    title: '',
    message: '',
    type: 'system',
    member_id: '',
    admin_id: ''
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

  // Pre-load members dropdown option lists
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
      console.error('Failed to load select options:', err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8'
      });

      const response = await fetch(`${API_BASE_URL}/api/notifications?${queryParams.toString()}`, {
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load notifications.');
      }

      const allItems = data.data.notifications || [];
      // Filter list client-side if search/statusFilter is specified
      let filtered = [...allItems];
      if (search.trim()) {
        const term = search.toLowerCase();
        filtered = filtered.filter(n => 
          n.title.toLowerCase().includes(term) || 
          n.message.toLowerCase().includes(term)
        );
      }
      if (statusFilter === 'unread') {
        filtered = filtered.filter(n => !n.is_read);
      } else if (statusFilter === 'read') {
        filtered = filtered.filter(n => n.is_read);
      }

      setNotifications(filtered);
      setUnreadCount(data.data.unread_count || 0);
      setTotalPages(data.data.pagination.pages || 1);
      setTotalCount(data.data.pagination.total || 0);

      if (onUnreadCountChange) {
        onUnreadCountChange(data.data.unread_count || 0);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error while fetching notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [page, statusFilter, search]);

  const resetForm = () => {
    setFormFields({
      title: '',
      message: '',
      type: 'system',
      member_id: '',
      admin_id: ''
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenDeleteModal = (notif: NotificationItem) => {
    setSelectedNotification(notif);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formFields.title.trim()) errors.title = 'Notification title is required.';
    if (!formFields.message.trim()) errors.message = 'Notification message content is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = {
        title: formFields.title.trim(),
        message: formFields.message.trim(),
        type: formFields.type
      };
      if (formFields.member_id) payload.member_id = formFields.member_id;
      if (formFields.admin_id) payload.admin_id = formFields.admin_id;

      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch notification.');
      }

      setIsAddModalOpen(false);
      triggerSuccess('Notification generated and sent.');
      fetchNotifications();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch notification.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsRead = async (notif: NotificationItem) => {
    if (notif.is_read) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notif.id}/read`, {
        method: 'PATCH',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update read status.');
      }

      fetchNotifications();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to mark as read.');
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${selectedNotification.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete notification.');
      }

      setIsDeleteModalOpen(false);
      triggerSuccess('Notification deleted.');
      fetchNotifications();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete notification.');
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
        <div className="relative flex-1 w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notification contents..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto justify-start sm:justify-end">
          {/* Read status filter */}
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
              <option value="all">All Alerts</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Archive</option>
            </select>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-md shadow-[#FFE600]/10"
          >
            <Plus className="w-4 h-4 text-black" /> Dispatch Alert
          </button>
        </div>
      </div>

      {/* Skeletons or Notifications Table */}
      {loading ? (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-zinc-800 rounded w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-zinc-900/40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-[#0c0c0e]/80 border border-zinc-850 space-y-4 shadow-xl">
          <Bell className="w-10 h-10 text-zinc-650 mx-auto animate-pulse" />
          <h4 className="text-md font-bold text-white uppercase tracking-wider">Inbox Empty</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You don't have any notifications. Nice work keeping the system in order!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif)}
              className={`p-6 rounded-2xl border transition-all duration-200 ${
                !notif.is_read
                  ? 'bg-zinc-900/80 border-[#FFE600]/30 hover:border-[#FFE600]/60 shadow-lg cursor-pointer'
                  : 'bg-[#0c0c0e]/60 border-zinc-850 hover:bg-[#0c0c0e]/80'
              } flex items-start gap-4 justify-between`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  !notif.is_read
                    ? 'bg-[#FFE600]/10 text-[#FFE600]'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-500'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-bold ${!notif.is_read ? 'text-white' : 'text-zinc-400'}`}>
                      {notif.title}
                    </h4>
                    {!notif.is_read && (
                      <span className="bg-[#FFE600] text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-450 leading-relaxed max-w-2xl">{notif.message}</p>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-550 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                    <span className="uppercase font-semibold tracking-wider text-[8px] border border-zinc-800 px-1.5 py-0.5 rounded">
                      {notif.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!notif.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notif);
                    }}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-450 hover:text-white"
                    title="Mark as Read"
                  >
                    <MailOpen className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDeleteModal(notif);
                  }}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-red-500 hover:text-red-300"
                  title="Delete Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="p-4 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs text-zinc-450 bg-[#0c0c0e]/80">
              <span>Showing {notifications.length} of {totalCount} notifications</span>
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

      {/* Add Modal Dialog Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">
                Dispatch Alert Notification
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-white font-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-6">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Alert Headline *</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Update or Maintenance alert"
                  value={formFields.title}
                  onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.title ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                />
                {formErrors.title && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.title}</p>}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Alert Body Content *</label>
                <textarea
                  placeholder="Detailed notification copy..."
                  rows={4}
                  value={formFields.message}
                  onChange={(e) => setFormFields({ ...formFields, message: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.message ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white resize-none`}
                />
                {formErrors.message && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.message}</p>}
              </div>

              {/* Member Selector (Optional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Target Specific Member (Optional)</label>
                <select
                  value={formFields.member_id}
                  onChange={(e) => setFormFields({ ...formFields, member_id: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-350"
                >
                  <option value="">-- Send to All (Global System Notice) --</option>
                  {membersList.map(m => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.email})</option>
                  ))}
                </select>
              </div>

              {/* Type Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Alert Category Type</label>
                <select
                  value={formFields.type}
                  onChange={(e) => setFormFields({ ...formFields, type: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                >
                  <option value="system">System Announcement</option>
                </select>
              </div>

              {/* Modal footer submit */}
              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-bold uppercase tracking-wider text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-xs shadow-md shadow-[#FFE600]/10 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Dispatch Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-wider text-white">Delete Notification?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete this notification alert?
                This action is irreversible and will remove all audit records.
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
