'use client';

import { API_BASE_URL } from '@/lib/apiConfig';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Check,
  AlertTriangle,
  Info,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Globe
} from 'lucide-react';

export default function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formFields, setFormFields] = useState({
    gym_name: '',
    address: '',
    phone: '',
    email: '',
    business_hours: '',
    currency: 'USD',
    timezone: 'America/New_York'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: getHeaders()
      });
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to load settings.');
      }

      setFormFields({
        gym_name: data.data.gym_name || '',
        address: data.data.address || '',
        phone: data.data.phone || '',
        email: data.data.email || '',
        business_hours: data.data.business_hours || '',
        currency: data.data.currency || 'USD',
        timezone: data.data.timezone || 'America/New_York'
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Database error while loading gym settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formFields.gym_name.trim()) errors.gym_name = 'Gym name is required.';
    if (!formFields.address.trim()) errors.address = 'Business address is required.';
    if (!formFields.phone.trim()) errors.phone = 'Phone number is required.';
    if (!formFields.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formFields.email)) {
      errors.email = 'Please specify a valid email address.';
    }
    if (!formFields.business_hours.trim()) errors.business_hours = 'Operating hours are required.';
    if (!formFields.currency.trim()) errors.currency = 'Currency code is required.';
    if (!formFields.timezone.trim()) errors.timezone = 'Timezone code is required.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(formFields)
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
        throw new Error(data.message || 'Failed to update settings.');
      }

      triggerSuccess('Gym settings saved successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save configuration settings.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-3xl p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-1/4" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-10 bg-zinc-900/60 rounded-xl" />
            <div className="h-10 bg-zinc-900/60 rounded-xl" />
          </div>
          <div className="h-20 bg-zinc-900/40 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      
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

      <form onSubmit={handleSubmit} className="bg-[#0c0c0e]/80 border border-zinc-800 p-8 rounded-3xl shadow-xl backdrop-blur-md space-y-8">
        <div className="flex items-center gap-3 border-b border-zinc-850 pb-4 justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#FFE600]" />
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-white">General Gym Configuration</h3>
              <p className="text-xs text-zinc-550">Configure public details, operating schedules, timezone offsets, and currencies.</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-md shadow-[#FFE600]/10 disabled:opacity-50 transition-colors shrink-0"
          >
            <Save className="w-4 h-4 text-black" />
            {submitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Gym Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Gym Name *</label>
              <input
                type="text"
                value={formFields.gym_name}
                onChange={(e) => setFormFields({ ...formFields, gym_name: e.target.value })}
                className={`w-full bg-zinc-950 border ${formErrors.gym_name ? 'border-red-900' : 'border-zinc-800'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
              />
              {formErrors.gym_name && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.gym_name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Contact Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-650" />
                <input
                  type="email"
                  value={formFields.email}
                  onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.email ? 'border-red-900' : 'border-zinc-800'} rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                />
              </div>
              {formErrors.email && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.email}</p>}
            </div>
          </div>

          {/* Address & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Physical Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-650" />
                <input
                  type="text"
                  value={formFields.address}
                  onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.address ? 'border-red-900' : 'border-zinc-800'} rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                />
              </div>
              {formErrors.address && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.address}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Contact Phone *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-650" />
                <input
                  type="text"
                  value={formFields.phone}
                  onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.phone ? 'border-red-900' : 'border-zinc-800'} rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
                />
              </div>
              {formErrors.phone && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.phone}</p>}
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Operating Business Hours *</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-650" />
              <input
                type="text"
                placeholder="e.g. Mon-Fri: 6AM-10PM, Sat-Sun: 8AM-8PM"
                value={formFields.business_hours}
                onChange={(e) => setFormFields({ ...formFields, business_hours: e.target.value })}
                className={`w-full bg-zinc-950 border ${formErrors.business_hours ? 'border-red-900' : 'border-zinc-800'} rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-white`}
              />
            </div>
            {formErrors.business_hours && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.business_hours}</p>}
          </div>

          {/* Currency & Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Base Currency Code *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-650" />
                <select
                  value={formFields.currency}
                  onChange={(e) => setFormFields({ ...formFields, currency: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.currency ? 'border-red-900' : 'border-zinc-800'} rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-350`}
                >
                  <option value="USD">USD ($) United States Dollar</option>
                  <option value="EUR">EUR (€) Euro</option>
                  <option value="GBP">GBP (£) British Pound</option>
                  <option value="INR">INR (₹) Indian Rupee</option>
                  <option value="CAD">CAD ($) Canadian Dollar</option>
                  <option value="AUD">AUD ($) Australian Dollar</option>
                </select>
              </div>
              {formErrors.currency && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.currency}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">System Timezone *</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-650" />
                <select
                  value={formFields.timezone}
                  onChange={(e) => setFormFields({ ...formFields, timezone: e.target.value })}
                  className={`w-full bg-zinc-950 border ${formErrors.timezone ? 'border-red-900' : 'border-zinc-800'} rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-350`}
                >
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="UTC">UTC Greenwich Mean Time</option>
                </select>
              </div>
              {formErrors.timezone && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{formErrors.timezone}</p>}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
