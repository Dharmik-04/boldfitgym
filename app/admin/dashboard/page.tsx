'use client';

import React, { useState, useEffect } from 'react';
import MembersTab from '@/components/admin/MembersTab';
import MembershipPlansTab from '@/components/admin/MembershipPlansTab';
import MembershipAssignmentsTab from '@/components/admin/MembershipAssignmentsTab';
import PaymentsTab from '@/components/admin/PaymentsTab';
import TrainersTab from '@/components/admin/TrainersTab';
import TrainerAssignmentsTab from '@/components/admin/TrainerAssignmentsTab';
import AttendanceTab from '@/components/admin/AttendanceTab';
import NotificationsTab from '@/components/admin/NotificationsTab';
import ReportsTab from '@/components/admin/ReportsTab';
import SettingsTab from '@/components/admin/SettingsTab';
import { useApp, Program, PricingPlan } from '@/context/AppContext';
import { API_BASE_URL } from '@/lib/apiConfig';
import {
  LayoutDashboard,
  Settings,
  Dumbbell,
  DollarSign,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Save,
  UploadCloud,
  RefreshCw,
  Flame,
  UserCheck,
  Wind,
  Check,
  ChevronRight,
  ArrowLeft,
  Menu,
  X,
  ChevronLeft,
  TrendingUp,
  Search,
  Info,
  Lock,
  Clock,
  Bell,
  FileText,
  Users,
  CalendarDays,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState('Admin');

  // Backend dashboard stats states
  const [stats, setStats] = useState<any>(null);
  const [plansCount, setPlansCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const [statsRes, plansRes, notifRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/membership-plans`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/notifications?limit=1`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsRes.status === 401 || plansRes.status === 401 || notifRes.status === 401) {
        localStorage.removeItem('accessToken');
        router.push('/admin/login');
        return;
      }

      if (!statsRes.ok || !plansRes.ok || !notifRes.ok) {
        throw new Error('Failed to load metrics from the server.');
      }

      const statsData = await statsRes.json();
      const plansData = await plansRes.json();
      const notifData = await notifRes.json();

      if (statsData.success && plansData.success && notifData.success) {
        setStats(statsData.data);
        const plansList = plansData.data.plans || [];
        setPlansCount(plansList.length);
        setUnreadNotifCount(notifData.data.unread_count || 0);
        setErrorMsg(null);
      } else {
        throw new Error(statsData.message || plansData.message || notifData.message || 'Error occurred while loading data.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection lost. Retrying...');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setIsAuthenticated(true);

    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      setAdminUser(storedUser);
    }

    // Initial load
    fetchStats();

    // Auto-refresh: Poll dashboard stats every 30 seconds
    const pollInterval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [router]);


  const handleLogout = async () => {
    console.log('Logging out...');
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('Logout network request failed:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('admin');
      router.push('/admin/login');
    }
  };

  const {
    heroConfig,
    setHeroConfig,
    programs,
    setPrograms,
    pricingPlans,
    setPricingPlans,
    resetToDefaults
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'memberships' | 'payments' | 'trainers' | 'trainer_assignments' | 'attendance' | 'notifications' | 'reports' | 'settings' | 'content' | 'pricing' | 'media'>('overview');

  // Reset window scroll position on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [activeTab]);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [programSearch, setProgramSearch] = useState('');
  const [programFilterIcon, setProgramFilterIcon] = useState('All');
  const [activeChartPoint, setActiveChartPoint] = useState<number | null>(null);

  // Program Manager States
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramIcon, setNewProgramIcon] = useState('Dumbbell');
  const [newProgramDesc, setNewProgramDesc] = useState('');
  const [simulatedUpload, setSimulatedUpload] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#FFE600]" />
      </div>
    );
  }

  // Helper to show save success notification
  const triggerSaveNotification = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Program Add / Edit Handlers
  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgramTitle || !newProgramDesc) return;

    const newProgram: Program = {
      id: Date.now().toString(),
      title: newProgramTitle,
      icon: newProgramIcon,
      description: newProgramDesc,
    };

    setPrograms((prev) => [...prev, newProgram]);
    setNewProgramTitle('');
    setNewProgramDesc('');
    triggerSaveNotification('New program added successfully!');
  };

  const handleDeleteProgram = (id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    triggerSaveNotification('Program removed.');
  };

  const handleUpdateProgram = (id: string, updatedFields: Partial<Program>) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
  };

  // Pricing Editor Handlers
  const handlePlanPriceChange = (id: string, price: string) => {
    setPricingPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price } : p))
    );
  };

  const togglePopularPlan = (id: string) => {
    setPricingPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, popular: !p.popular } : p))
    );
  };

  const updatePlanFeatures = (id: string, index: number, value: string) => {
    setPricingPlans((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedFeatures = [...p.features];
          updatedFeatures[index] = value;
          return { ...p, features: updatedFeatures };
        }
        return p;
      })
    );
  };

  // Media Mock Handler
  const handleSimulatedUpload = (type: 'video' | '3d') => {
    setSimulatedUpload(`Uploading ${type === 'video' ? 'WebM video file' : 'GLB 3D asset file'}...`);
    setTimeout(() => {
      setSimulatedUpload(null);
      triggerSaveNotification(`${type === 'video' ? 'Hero video' : '3D Facility model'} updated!`);
    }, 2000);
  };

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(programSearch.toLowerCase()) || p.description.toLowerCase().includes(programSearch.toLowerCase());
    const matchesFilter = programFilterIcon === 'All' || p.icon === programFilterIcon;
    return matchesSearch && matchesFilter;
  });

  const sidebarContent = (isCollapsed: boolean, onMobile = false) => (
    <div className="flex flex-col justify-between h-full bg-[#0c0c0e] overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className={`p-6 flex items-center justify-between border-b border-zinc-800 shrink-0 ${isCollapsed ? 'px-4' : ''}`}>
          {!isCollapsed ? (
            <div className="flex flex-col">
              <span className="text-lg font-black uppercase tracking-wider text-[#FFE600]">
                Bold Admin
              </span>
              <span className="text-xs text-zinc-500">Live Client Dashboard</span>
            </div>
          ) : (
            <span className="text-lg font-black uppercase tracking-wider text-[#FFE600] mx-auto">
              B.
            </span>
          )}
          {!onMobile && (
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-50 transition-colors"
            >
              <ChevronLeft className={`w-4 h-4 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
          {onMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-zinc-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
 
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {[
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'members', label: 'Manage Members', icon: <Users className="w-4 h-4" /> },
            { id: 'memberships', label: 'Member Assignments', icon: <CalendarDays className="w-4 h-4" /> },
            { id: 'payments', label: 'Billing & Payments', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'trainers', label: 'Manage Trainers', icon: <Dumbbell className="w-4 h-4" /> },
            { id: 'trainer_assignments', label: 'Trainer Assignments', icon: <UserCheck className="w-4 h-4" /> },
            { id: 'attendance', label: 'Attendance Logs', icon: <Clock className="w-4 h-4" /> },
            { id: 'notifications', label: 'System Alerts', icon: <Bell className="w-4 h-4" /> },
            { id: 'reports', label: 'System Reports', icon: <FileText className="w-4 h-4" /> },
            { id: 'settings', label: 'Gym Settings', icon: <Settings className="w-4 h-4" /> },
            { id: 'content', label: 'Manage Content', icon: <Edit2 className="w-4 h-4" /> },
            { id: 'pricing', label: 'Membership Plans', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'media', label: 'Media Library', icon: <ImageIcon className="w-4 h-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (onMobile) setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                isCollapsed ? 'justify-center px-2 py-3' : ''
              } ${
                activeTab === item.id
                  ? 'bg-zinc-800 text-[#FFE600] shadow-md shadow-black/30'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCollapsed && <span>{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-20 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-black uppercase text-[#FFE600] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-55 shadow-xl whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>
 
      <div className="p-4 border-t border-zinc-800 space-y-3 shrink-0">
        <button
          onClick={() => {
            resetToDefaults();
            triggerSaveNotification('Reset to defaults.');
            if (onMobile) setIsMobileMenuOpen(false);
          }}
          className={`w-full py-2.5 rounded-lg bg-red-950/40 hover:bg-red-950/80 border border-red-900/60 text-red-200 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {!isCollapsed && <span>Reset to Default Copy</span>}
        </button>
        <Link
          href="/"
          className={`w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-55 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {!isCollapsed && <span>Back to Site</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-450 hover:text-zinc-55 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            isCollapsed ? 'px-2' : 'px-4'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-[#FFE600]" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-100 font-sans overflow-x-hidden">
      {/* Sidebar navigation for desktop */}
      <aside 
        className={`sticky top-0 h-screen hidden md:flex flex-col justify-between border-r border-zinc-800 bg-[#0c0c0e] transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent(isSidebarCollapsed)}
      </aside>

      {/* Mobile Drawer Slide-in Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-64 h-full border-r border-zinc-800 bg-[#0c0c0e] flex flex-col justify-between z-10 shrink-0"
            >
              {sidebarContent(false, true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Topbar notifications */}
        <header className="sticky top-0 z-40 h-16 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#0c0c0e]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-55 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold uppercase tracking-wide text-zinc-300">
              {activeTab === 'overview' && 'Overview Dashboard'}
              {activeTab === 'members' && 'Members Management'}
              {activeTab === 'memberships' && 'Membership Assignments'}
              {activeTab === 'payments' && 'Billing & Financial Records'}
              {activeTab === 'trainers' && 'Trainer Directory & Specialized Coaching'}
              {activeTab === 'trainer_assignments' && 'Coaching Trainer Assignments'}
              {activeTab === 'attendance' && 'Daily Attendance & Check-in Sessions'}
              {activeTab === 'notifications' && 'System Notification Board'}
              {activeTab === 'reports' && 'Business Intelligence & System Reports'}
              {activeTab === 'settings' && 'Gym Settings & Business Config'}
              {activeTab === 'content' && 'Manage Landing Copy & Programs'}
              {activeTab === 'pricing' && 'Manage Membership Packages'}
              {activeTab === 'media' && 'Media Asset Center'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {saveStatus && (
              <div className="flex items-center gap-2 bg-[#FFE600]/10 border border-[#FFE600]/40 text-[#FFE600] px-4 py-1.5 rounded-full text-xs font-semibold animate-pulse shadow-md shadow-[#FFE600]/5">
                <Check className="w-3.5 h-3.5" />
                {saveStatus}
              </div>
            )}
            
            {/* Notifications Alert Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors shrink-0"
              title="System Alerts"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-650 text-white text-[8.5px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#09090b]">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-300">
                {adminUser}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-7xl mx-auto">
          
          <AnimatePresence mode="wait">
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Error Banner */}
                {errorMsg && (
                  <div className="flex items-center justify-between bg-red-950/20 border border-red-900/50 p-4 rounded-xl text-xs text-red-400">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                      <span className="font-semibold">{errorMsg}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        fetchStats();
                      }}
                      className="px-3 py-1 rounded bg-red-900/30 hover:bg-red-900/50 text-white font-bold text-[10px] uppercase transition-colors"
                    >
                      Retry Sync
                    </button>
                  </div>
                )}

                {/* Skeletons or KPIs Grid */}
                {isLoading && !stats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col gap-3 animate-pulse">
                        <div className="h-4 bg-zinc-800 rounded w-1/3" />
                        <div className="h-8 bg-zinc-800 rounded w-1/2" />
                        <div className="h-3 bg-zinc-800 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* KPI 1: Total Members */}
                    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 shadow-lg hover:border-[#FFE600]/25 transition-all">
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Total Members</span>
                        <span className="text-3xl font-black text-white">{stats?.kpis?.total_members ?? 0}</span>
                        <span className="text-[10px] text-zinc-500 block">Signed up in portal</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#FFE600]">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>

                    {/* KPI 2: Active Members */}
                    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 shadow-lg hover:border-[#FFE600]/25 transition-all">
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Active Members</span>
                        <span className="text-3xl font-black text-white">{stats?.kpis?.active_members ?? 0}</span>
                        <span className="text-[10px] text-[#FFE600] font-semibold block">
                          {stats?.kpis?.total_members ? Math.round((stats.kpis.active_members / stats.kpis.total_members) * 100) : 0}% Active Ratio
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-green-400">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>

                    {/* KPI 3: Membership Plans */}
                    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 shadow-lg hover:border-[#FFE600]/25 transition-all">
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Membership Plans</span>
                        <span className="text-3xl font-black text-white">{plansCount}</span>
                        <span className="text-[10px] text-zinc-500 block">Available packages</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#FFE600]">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </div>

                    {/* KPI 4: Trainers */}
                    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 shadow-lg hover:border-[#FFE600]/25 transition-all">
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Total Trainers</span>
                        <span className="text-3xl font-black text-white">{stats?.kpis?.total_trainers ?? 0}</span>
                        <span className="text-[10px] text-zinc-500 block">Active coaching staff</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#FFE600]">
                        <Dumbbell className="w-6 h-6" />
                      </div>
                    </div>

                    {/* KPI 5: Today's Attendance */}
                    <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 flex items-center justify-between gap-4 shadow-lg hover:border-[#FFE600]/25 transition-all">
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Today's Attendance</span>
                        <span className="text-3xl font-black text-[#FFE600]">{stats?.kpis?.today_attendance ?? 0}</span>
                        <span className="text-[10px] text-zinc-500 block">Checked-in members</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#FFE600]">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                    </div>

                    {/* KPI 6: Monthly Revenue */}
                    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 shadow-lg hover:border-[#FFE600]/25 transition-all">
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block">Monthly Revenue</span>
                        <span className="text-3xl font-black text-white">
                          ${(stats?.kpis?.monthly_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Current month payments</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-yellow-500">
                        <CreditCard className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                )}

                {/* SVG Live Chart */}
                <div className="p-6 rounded-2xl bg-[#0c0c0e]/85 backdrop-blur-md border border-white/10 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-md font-black uppercase text-white tracking-widest">Revenue Growth</h3>
                      <p className="text-xs text-zinc-500">Monthly gross billing metrics over the last 6 months</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black uppercase text-[#FFE600] bg-[#FFE600]/10 border border-[#FFE600]/15 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md shadow-[#FFE600]/5">
                        <TrendingUp className="w-3 h-3 text-[#FFE600]" /> Dynamic Data Sync
                      </span>
                    </div>
                  </div>

                  {/* SVG Graph Layout */}
                  <div className="relative h-48 w-full">
                    {isLoading && !stats ? (
                      <div className="w-full h-full bg-zinc-900/40 rounded-xl animate-pulse" />
                    ) : (
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                        {/* Grid paths */}
                        <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
                        <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
                        <line x1="0" y1="160" x2="600" y2="160" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />

                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FFE600" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#FFE600" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Generate points dynamically based on revenue_by_month */}
                        {(() => {
                          const chartPoints = stats?.charts?.revenue_by_month || [];
                          if (chartPoints.length === 0) return null;
                          const maxVal = Math.max(...chartPoints.map((p: any) => p.revenue || 0), 100);
                          const stepX = 600 / (chartPoints.length - 1 || 1);

                          // Generate path string
                          let pathD = `M 0,${200 - ((chartPoints[0].revenue || 0) / maxVal) * 160}`;
                          for (let i = 1; i < chartPoints.length; i++) {
                            const x = i * stepX;
                            const y = 200 - ((chartPoints[i].revenue || 0) / maxVal) * 160;
                            pathD += ` L ${x},${y}`;
                          }

                          // Fill path string
                          const fillD = `${pathD} L 600,180 L 0,180 Z`;

                          return (
                            <>
                              <path d={fillD} fill="url(#chartGrad)" />
                              <path d={pathD} fill="none" stroke="#FFE600" strokeWidth="3.5" strokeLinecap="round" className="drop-shadow-[0_4px_12px_rgba(255,230,0,0.45)]" />

                              {/* Circle points */}
                              {chartPoints.map((pt: any, i: number) => {
                                const x = i * stepX;
                                const y = 200 - ((pt.revenue || 0) / maxVal) * 160;
                                return (
                                  <g key={i} className="group cursor-pointer">
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r={activeChartPoint === i ? 6 : 4}
                                      fill={activeChartPoint === i ? '#FFE600' : '#0c0c0e'}
                                      stroke="#FFE600"
                                      strokeWidth="2.5"
                                      onMouseEnter={() => setActiveChartPoint(i)}
                                      onMouseLeave={() => setActiveChartPoint(null)}
                                      className="transition-all duration-150"
                                    />
                                    {activeChartPoint === i && (
                                      <foreignObject x={x - 50} y={y - 45} width="100" height="35">
                                        <div className="bg-zinc-950/90 border border-[#FFE600]/40 rounded px-1.5 py-0.5 text-center shadow-lg shadow-black/80">
                                          <p className="text-[8px] text-[#FFE600] font-black uppercase tracking-wider">{pt.label}</p>
                                          <p className="text-[9px] text-white font-bold">${pt.revenue.toLocaleString()}</p>
                                        </div>
                                      </foreignObject>
                                    )}
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    )}
                  </div>
                  <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">
                    {stats?.charts?.revenue_by_month?.map((pt: any, idx: number) => (
                      <span key={idx}>{pt.label}</span>
                    )) || (
                      <>
                        <span>6 Mos Ago</span>
                        <span>Today</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Lists Columns (Recent Members & Recent Payments) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Column 1: Recent Members */}
                  <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-4 shadow-xl">
                    <h3 className="text-sm font-black uppercase text-white tracking-widest text-[#FFE600]">Newest Member Registrations</h3>
                    {isLoading && !stats ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-12 bg-zinc-900/40 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : !stats?.recent_members || stats.recent_members.length === 0 ? (
                      <p className="text-xs text-zinc-500">No recent member sign-ups.</p>
                    ) : (
                      <div className="divide-y divide-zinc-850">
                        {stats.recent_members.map((member: any) => (
                          <div key={member.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                            <div>
                              <p className="text-xs font-bold text-white">{member.first_name} {member.last_name}</p>
                              <p className="text-[10px] text-zinc-500">{member.email}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                member.status === 'active' ? 'bg-green-950/40 border border-green-800/50 text-green-400' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {member.status}
                              </span>
                              <p className="text-[9px] text-zinc-500 mt-1">Joined: {new Date(member.join_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Recent Payments */}
                  <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-4 shadow-xl">
                    <h3 className="text-sm font-black uppercase text-white tracking-widest text-[#FFE600]">Recent Billing Transactions</h3>
                    {isLoading && !stats ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-12 bg-zinc-900/40 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : !stats?.recent_payments || stats.recent_payments.length === 0 ? (
                      <p className="text-xs text-zinc-500">No recent billing activity.</p>
                    ) : (
                      <div className="divide-y divide-zinc-850">
                        {stats.recent_payments.map((pay: any) => (
                          <div key={pay.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                            <div>
                              <p className="text-xs font-bold text-white">{pay.member_name}</p>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{pay.payment_method} · {new Date(pay.payment_date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-white">${pay.amount.toFixed(2)}</p>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-1 ${
                                pay.payment_status === 'completed'
                                  ? 'bg-green-950/40 border border-green-800/50 text-green-400'
                                  : pay.payment_status === 'pending'
                                  ? 'bg-yellow-950/40 border border-yellow-800/50 text-yellow-400'
                                  : 'bg-red-950/40 border border-red-800/50 text-red-400'
                              }`}>
                                {pay.payment_status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Config */}
                <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6 shadow-xl backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">Fast Hero Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 uppercase font-bold">Hero Title</label>
                      <input
                        type="text"
                        value={heroConfig.title}
                        onChange={(e) => setHeroConfig({ ...heroConfig, title: e.target.value })}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FFE600] transition-colors focus:ring-1 focus:ring-[#FFE600]/20"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-450 uppercase font-bold">Hero Subtitle</label>
                      <input
                        type="text"
                        value={heroConfig.subtitle}
                        onChange={(e) => setHeroConfig({ ...heroConfig, subtitle: e.target.value })}
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FFE600] transition-colors focus:ring-1 focus:ring-[#FFE600]/20"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: Members Management */}
            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <MembersTab />
              </motion.div>
            )}

            {/* Tab: Membership Assignments */}
            {activeTab === 'memberships' && (
              <motion.div
                key="memberships"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <MembershipAssignmentsTab />
              </motion.div>
            )}

            {/* Tab: Payments & Financials */}
            {activeTab === 'payments' && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <PaymentsTab />
              </motion.div>
            )}

            {/* Tab: Trainer Management */}
            {activeTab === 'trainers' && (
              <motion.div
                key="trainers"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <TrainersTab />
              </motion.div>
            )}

            {/* Tab: Trainer Assignments */}
            {activeTab === 'trainer_assignments' && (
              <motion.div
                key="trainer_assignments"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <TrainerAssignmentsTab />
              </motion.div>
            )}

            {/* Tab: Attendance Management */}
            {activeTab === 'attendance' && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <AttendanceTab />
              </motion.div>
            )}

            {/* Tab: System Notifications */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <NotificationsTab onUnreadCountChange={setUnreadNotifCount} />
              </motion.div>
            )}

            {/* Tab: System Reports */}
            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <ReportsTab />
              </motion.div>
            )}

            {/* Tab: Gym Settings */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <SettingsTab />
              </motion.div>
            )}

            {/* Tab 2: Manage Content */}
            {activeTab === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Hero Banner Text */}
                <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-4 shadow-xl">
                  <h3 className="text-md font-black uppercase text-white tracking-widest text-[#FFE600]">Hero Segment Copy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-zinc-500">Banner Large Header</label>
                      <input
                        type="text"
                        value={heroConfig.title}
                        onChange={(e) => setHeroConfig({ ...heroConfig, title: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600]/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-zinc-500">Sub-Headline Label</label>
                      <input
                        type="text"
                        value={heroConfig.subtitle}
                        onChange={(e) => setHeroConfig({ ...heroConfig, subtitle: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Programs Manager */}
                <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-6 shadow-xl">
                  <h3 className="text-md font-black uppercase text-white tracking-widest text-[#FFE600]">Programs Manager</h3>
                  
                  {/* Add New Program */}
                  <form onSubmit={handleAddProgram} className="p-5 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4 shadow-md">
                    <h4 className="text-sm font-bold uppercase text-zinc-200">Add Training Program</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-500 uppercase">Program Title</label>
                        <input
                          type="text"
                          value={newProgramTitle}
                          onChange={(e) => setNewProgramTitle(e.target.value)}
                          placeholder="e.g. Strength Training"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600]/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-500 uppercase">Icon Type</label>
                        <select
                          value={newProgramIcon}
                          onChange={(e) => setNewProgramIcon(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
                        >
                          <option value="Dumbbell">Dumbbell (Strength)</option>
                          <option value="Flame">Flame (CrossFit)</option>
                          <option value="UserCheck">UserCheck (Coaching)</option>
                          <option value="Wind">Wind (Recovery)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-500 uppercase">Description</label>
                        <input
                          type="text"
                          value={newProgramDesc}
                          onChange={(e) => setNewProgramDesc(e.target.value)}
                          placeholder="Brief overview details..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FFE600] focus:ring-1 focus:ring-[#FFE600]/20"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#FFE600] hover:bg-[#e0ca00] text-black font-bold text-xs uppercase flex items-center gap-1.5 transition-all shadow-md shadow-[#FFE600]/15"
                    >
                      <Plus className="w-4 h-4" /> Add Program Card
                    </button>
                  </form>

                  {/* List & Filter Existing Programs */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-zinc-800 pb-4">
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={programSearch}
                          onChange={(e) => setProgramSearch(e.target.value)}
                          placeholder="Search programs..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#FFE600] transition-colors"
                        />
                      </div>
                      <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        {['All', 'Dumbbell', 'Flame', 'UserCheck', 'Wind'].map((iconName) => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setProgramFilterIcon(iconName)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                              programFilterIcon === iconName
                                ? 'bg-[#FFE600]/10 border-[#FFE600]/30 text-[#FFE600] shadow-sm'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            {iconName}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredPrograms.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-850 space-y-3 shadow-inner">
                          <Info className="w-8 h-8 text-zinc-500 mx-auto animate-pulse" />
                          <h5 className="text-sm font-bold text-white uppercase tracking-wider">No matching programs found</h5>
                          <p className="text-xs text-zinc-500 max-w-xs mx-auto">Try refining your search parameters or selecting another category filter.</p>
                        </div>
                      ) : (
                        filteredPrograms.map((program) => (
                          <div key={program.id} className="p-4 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-4 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#FFE600]">
                                {program.icon === 'Dumbbell' && <Dumbbell className="w-5 h-5" />}
                                {program.icon === 'Flame' && <Flame className="w-5 h-5" />}
                                {program.icon === 'UserCheck' && <UserCheck className="w-5 h-5" />}
                                {program.icon === 'Wind' && <Wind className="w-5 h-5" />}
                              </div>
                              {editingProgramId === program.id ? (
                                <div className="flex gap-2 flex-wrap">
                                  <input
                                    type="text"
                                    value={program.title}
                                    onChange={(e) => handleUpdateProgram(program.id, { title: e.target.value })}
                                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#FFE600]"
                                  />
                                  <input
                                    type="text"
                                    value={program.description}
                                    onChange={(e) => handleUpdateProgram(program.id, { description: e.target.value })}
                                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-300 w-80 focus:outline-none focus:border-[#FFE600]"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <h5 className="text-sm font-bold text-white">{program.title}</h5>
                                  <p className="text-xs text-zinc-400">{program.description}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {editingProgramId === program.id ? (
                                <button
                                  onClick={() => setEditingProgramId(null)}
                                  className="p-1.5 hover:bg-zinc-800 text-green-400 rounded-lg"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditingProgramId(program.id)}
                                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-50 rounded-lg"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteProgram(program.id)}
                                className="p-1.5 hover:bg-zinc-800 text-red-400 hover:text-red-300 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: Pricing Plans Management */}
            {activeTab === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <MembershipPlansTab />
              </motion.div>
            )}

            {/* Tab 4: Media Library */}
            {activeTab === 'media' && (
              <motion.div
                key="media"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* WebM Video Asset */}
                <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-4 shadow-xl">
                  <h3 className="text-md font-black uppercase text-white tracking-widest text-[#FFE600]">Background WebM Video</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Upload or replace the scroll-expanding media video loop. Supported format: <strong>WebM</strong> (codec vp9 recommended).
                  </p>

                  <div 
                    onClick={() => handleSimulatedUpload('video')}
                    className="p-8 border border-dashed border-zinc-800 hover:border-[#FFE600]/50 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
                  >
                    <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-[#FFE600] transition-colors" />
                    <span className="text-sm font-semibold text-zinc-300">Drag files here or click to browse</span>
                    <span className="text-xs text-zinc-500">Current file: gym-3d.webm (1.1 MB)</span>
                  </div>
                  
                  {simulatedUpload && simulatedUpload.includes('video') && (
                    <p className="text-xs text-[#FFE600] animate-pulse">{simulatedUpload}</p>
                  )}
                </div>

                {/* 3D GLB Model Asset */}
                <div className="p-6 rounded-2xl bg-[#0c0c0e] border border-zinc-800 space-y-4 shadow-xl">
                  <h3 className="text-md font-black uppercase text-white tracking-widest text-[#FFE600]">Facility 3D Asset (.glb)</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Upload the GLTF binary format file to render interactive 3D elements inside the Facility & 3D Showcase section.
                  </p>

                  <div 
                    onClick={() => handleSimulatedUpload('3d')}
                    className="p-8 border border-dashed border-zinc-800 hover:border-[#FFE600]/50 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
                  >
                    <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-[#FFE600] transition-colors" />
                    <span className="text-sm font-semibold text-zinc-300">Drag GLB files here or click to browse</span>
                    <span className="text-xs text-zinc-500">No custom asset configured (Using stock 3D renders)</span>
                  </div>

                  {simulatedUpload && simulatedUpload.includes('3d') && (
                    <p className="text-xs text-[#FFE600] animate-pulse">{simulatedUpload}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
