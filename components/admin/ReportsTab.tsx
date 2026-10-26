'use client';

import { API_BASE_URL } from '@/lib/apiConfig';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Info,
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  Check,
  Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsTab() {
  const [reportType, setReportType] = useState<'members' | 'payments' | 'attendance' | 'revenue'>('members');
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Preview states
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewStats, setPreviewStats] = useState<Record<string, any>>({});
  const [hasGenerated, setHasGenerated] = useState(false);

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

  const generateReportData = async () => {
    setGenerating(true);
    setErrorMsg(null);
    setHasGenerated(false);
    try {
      const headers = getHeaders();
      
      if (reportType === 'members') {
        const res = await fetch(`${API_BASE_URL}/api/members?limit=1000`, { headers });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch members data.');
        
        const list = data.data.members || [];
        setPreviewData(list);
        
        // Compute aggregates
        const total = list.length;
        const active = list.filter((m: any) => m.status === 'active').length;
        const inactive = list.filter((m: any) => m.status === 'inactive').length;
        
        setPreviewStats({
          'Total Members': total,
          'Active Status': active,
          'Inactive Status': inactive,
          'Active Ratio': total > 0 ? `${Math.round((active / total) * 100)}%` : '0%'
        });

      } else if (reportType === 'payments') {
        const res = await fetch(`${API_BASE_URL}/api/payments?limit=1000`, { headers });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch payments data.');
        
        const list = data.data.payments || [];
        setPreviewData(list);
        
        // Compute aggregates
        const totalCount = list.length;
        const totalCollected = list
          .filter((p: any) => p.payment_status === 'completed')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
        const successful = list.filter((p: any) => p.payment_status === 'completed').length;
        
        setPreviewStats({
          'Total Transactions': totalCount,
          'Revenue Collected': `$${totalCollected.toFixed(2)}`,
          'Successful Orders': successful,
          'Pending / Failed': totalCount - successful
        });

      } else if (reportType === 'attendance') {
        const res = await fetch(`${API_BASE_URL}/api/attendance?limit=1000`, { headers });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch attendance data.');
        
        const list = data.data.attendance || [];
        setPreviewData(list);
        
        // Compute aggregates
        const totalCheckins = list.length;
        const lateCount = list.filter((a: any) => a.status === 'late').length;
        
        let totalMins = 0;
        let checkoutCount = 0;
        list.forEach((a: any) => {
          if (a.check_in && a.check_out) {
            const diff = new Date(a.check_out).getTime() - new Date(a.check_in).getTime();
            if (diff > 0) {
              totalMins += diff / 60000;
              checkoutCount++;
            }
          }
        });
        
        const avgDuration = checkoutCount > 0 ? Math.round(totalMins / checkoutCount) : 0;
        
        setPreviewStats({
          'Total Check-ins': totalCheckins,
          'Present Count': totalCheckins - lateCount,
          'Late Entrants': lateCount,
          'Avg Session Duration': `${avgDuration} mins`
        });

      } else if (reportType === 'revenue') {
        const res = await fetch(`${API_BASE_URL}/api/payments?limit=1000`, { headers });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch payments for revenue report.');
        
        // Only consider completed payments for revenue
        const list = (data.data.payments || []).filter((p: any) => p.payment_status === 'completed');
        setPreviewData(list);
        
        const totalRev = list.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
        const cardRev = list
          .filter((p: any) => p.payment_method === 'card')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
        const cashRev = list
          .filter((p: any) => p.payment_method === 'cash')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
        
        setPreviewStats({
          'Gross Revenue': `$${totalRev.toFixed(2)}`,
          'Card Transactions': `$${cardRev.toFixed(2)}`,
          'Cash Collections': `$${cashRev.toFixed(2)}`,
          'Average Order Ticket': list.length > 0 ? `$${(totalRev / list.length).toFixed(2)}` : '$0.00'
        });
      }

      setHasGenerated(true);
      triggerSuccess('Report data compiled successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportExcel = () => {
    if (previewData.length === 0) return;
    try {
      let formatted: any[] = [];
      const fileName = `Gym_${reportType}_Report_${new Date().toISOString().split('T')[0]}`;

      if (reportType === 'members') {
        formatted = previewData.map(m => ({
          'First Name': m.first_name,
          'Last Name': m.last_name,
          'Email': m.email,
          'Phone': m.phone || '—',
          'Gender': m.gender || '—',
          'Status': m.status.toUpperCase(),
          'Join Date': m.join_date
        }));
      } else if (reportType === 'payments') {
        formatted = previewData.map(p => ({
          'Invoice ID': p.id.substring(0, 8).toUpperCase(),
          'Member': p.members ? `${p.members.first_name} ${p.members.last_name}` : 'Unknown',
          'Amount': `$${p.amount}`,
          'Method': p.payment_method.toUpperCase(),
          'Status': p.payment_status.toUpperCase(),
          'Payment Date': new Date(p.payment_date).toLocaleDateString()
        }));
      } else if (reportType === 'attendance') {
        formatted = previewData.map(a => {
          const diffMs = a.check_out ? new Date(a.check_out).getTime() - new Date(a.check_in).getTime() : 0;
          const mins = diffMs > 0 ? Math.round(diffMs / 60000) : 0;
          return {
            'Member': a.member ? `${a.member.first_name} ${a.member.last_name}` : 'Unknown',
            'Check In': new Date(a.check_in).toLocaleTimeString(),
            'Check Out': a.check_out ? new Date(a.check_out).toLocaleTimeString() : 'Active',
            'Duration (min)': mins || '—',
            'Date': a.attendance_date,
            'Status': a.status.toUpperCase(),
            'Device Client': a.device || 'Desktop'
          };
        });
      } else if (reportType === 'revenue') {
        formatted = previewData.map(p => ({
          'Invoice ID': p.id.substring(0, 8).toUpperCase(),
          'Member': p.members ? `${p.members.first_name} ${p.members.last_name}` : 'Unknown',
          'Amount': `$${p.amount}`,
          'Payment Method': p.payment_method.toUpperCase(),
          'Transaction Date': new Date(p.payment_date).toLocaleDateString()
        }));
      }

      const worksheet = XLSX.utils.json_to_sheet(formatted);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Sheet');
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      triggerSuccess('Excel spreadsheet exported successfully.');
    } catch (err: any) {
      setErrorMsg(`Excel export failed: ${err.message}`);
    }
  };

  const handleExportPDF = () => {
    if (previewData.length === 0) return;
    try {
      const doc = new jsPDF();
      const reportTitle = `${reportType.toUpperCase()} REPORT`;
      const fileName = `Gym_${reportType}_Report_${new Date().toISOString().split('T')[0]}`;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(reportTitle, 14, 20);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 28);

      // Add preview stats summary as small table or text block
      let statsText = '';
      Object.entries(previewStats).forEach(([key, val]) => {
        statsText += `${key}: ${val}  |  `;
      });
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(statsText.slice(0, -5), 14, 34);

      let headers: string[][] = [];
      let rows: any[][] = [];

      if (reportType === 'members') {
        headers = [['Name', 'Email', 'Phone', 'Status', 'Join Date']];
        rows = previewData.map(m => [
          `${m.first_name} ${m.last_name}`,
          m.email,
          m.phone || '—',
          m.status.toUpperCase(),
          m.join_date
        ]);
      } else if (reportType === 'payments') {
        headers = [['Invoice', 'Member', 'Amount', 'Method', 'Status', 'Date']];
        rows = previewData.map(p => [
          p.id.substring(0, 8).toUpperCase(),
          p.members ? `${p.members.first_name} ${p.members.last_name}` : 'Unknown',
          `$${p.amount}`,
          p.payment_method.toUpperCase(),
          p.payment_status.toUpperCase(),
          new Date(p.payment_date).toLocaleDateString()
        ]);
      } else if (reportType === 'attendance') {
        headers = [['Member', 'Check In', 'Check Out', 'Duration', 'Date', 'Status']];
        rows = previewData.map(a => {
          const diffMs = a.check_out ? new Date(a.check_out).getTime() - new Date(a.check_in).getTime() : 0;
          const mins = diffMs > 0 ? `${Math.round(diffMs / 60000)}m` : 'Active';
          return [
            a.member ? `${a.member.first_name} ${a.member.last_name}` : 'Unknown',
            new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
            mins,
            a.attendance_date,
            a.status.toUpperCase()
          ];
        });
      } else if (reportType === 'revenue') {
        headers = [['Invoice', 'Member', 'Amount', 'Method', 'Payment Date']];
        rows = previewData.map(p => [
          p.id.substring(0, 8).toUpperCase(),
          p.members ? `${p.members.first_name} ${p.members.last_name}` : 'Unknown',
          `$${p.amount}`,
          p.payment_method.toUpperCase(),
          new Date(p.payment_date).toLocaleDateString()
        ]);
      }

      autoTable(doc, {
        startY: 38,
        head: headers,
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [24, 24, 27], textColor: [255, 230, 0], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        styles: { fontSize: 8 }
      });

      doc.save(`${fileName}.pdf`);
      triggerSuccess('PDF document downloaded.');
    } catch (err: any) {
      setErrorMsg(`PDF export failed: ${err.message}`);
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

      {/* Main Controls Card */}
      <div className="bg-[#0c0c0e]/80 border border-zinc-800 p-8 rounded-3xl shadow-xl backdrop-blur-md space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-850 pb-4">
          <FileText className="w-6 h-6 text-[#FFE600]" />
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">System Reports Generator</h3>
            <p className="text-xs text-zinc-500">Select report settings to fetch and compile records from backend directories.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-550 tracking-wider">Select Report Scope</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as any);
                setHasGenerated(false);
                setPreviewData([]);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFE600] text-zinc-300"
            >
              <option value="members">Members Census (Demographics & Registration)</option>
              <option value="payments">Financial Billings ledger (Invoices Audit)</option>
              <option value="attendance">Daily Attendance Log (Sessions Tracker)</option>
              <option value="revenue">Gross Revenue Analysis (Cash & Card Breakdown)</option>
            </select>
          </div>

          <button
            onClick={generateReportData}
            disabled={generating}
            className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-wider text-xs shadow-md shadow-[#FFE600]/10 disabled:opacity-40 transition-colors"
          >
            {generating ? 'Compiling Database...' : 'Compile Report Preview'}
          </button>
        </div>
      </div>

      {/* Loading Skeletons state */}
      {generating && (
        <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-3xl p-8 space-y-6 animate-pulse text-center">
          <Clock className="w-8 h-8 text-[#FFE600] mx-auto animate-spin" />
          <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Loading database directories...</h4>
          <div className="h-10 bg-zinc-900/60 rounded-xl w-3/4 mx-auto" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-900/40 rounded w-full" />
            <div className="h-4 bg-zinc-900/40 rounded w-5/6" />
          </div>
        </div>
      )}

      {/* Report Preview Panel */}
      {hasGenerated && !generating && (
        <div className="space-y-6">
          
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(previewStats).map(([key, val]) => (
              <div key={key} className="bg-[#0c0c0e]/80 border border-zinc-850 p-6 rounded-2xl shadow-lg">
                <span className="text-[10px] font-black uppercase text-zinc-550 tracking-wider block">{key}</span>
                <span className="text-xl font-black text-white mt-1 block">{val}</span>
              </div>
            ))}
          </div>

          {/* Table Preview and Export buttons */}
          <div className="bg-[#0c0c0e]/80 border border-zinc-800 rounded-3xl shadow-xl overflow-hidden backdrop-blur-md p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-zinc-850 pb-4">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white">Previewing Compiled Records</h4>
                <p className="text-xs text-zinc-500">Displaying preview sample of {previewData.length} records.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] uppercase font-black text-[#FFE600] tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] uppercase font-black text-[#FFE600] tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
              </div>
            </div>

            {/* Preview Sample Table */}
            <div className="overflow-x-auto rounded-xl border border-zinc-850">
              <table className="w-full text-left text-xs text-zinc-400">
                <thead className="bg-zinc-950 text-[9px] font-black uppercase text-zinc-500 border-b border-zinc-850 tracking-wider">
                  <tr>
                    {reportType === 'members' && (
                      <>
                        <th className="px-4 py-3">Member Name</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Join Date</th>
                      </>
                    )}
                    {reportType === 'payments' && (
                      <>
                        <th className="px-4 py-3">Invoice</th>
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </>
                    )}
                    {reportType === 'attendance' && (
                      <>
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">Check In</th>
                        <th className="px-4 py-3">Check Out</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {reportType === 'revenue' && (
                      <>
                        <th className="px-4 py-3">Invoice ID</th>
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Payment Method</th>
                        <th className="px-4 py-3">Date</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 bg-zinc-900/5">
                  {previewData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/20">
                      {reportType === 'members' && (
                        <>
                          <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{row.first_name} {row.last_name}</td>
                          <td className="px-4 py-3 text-zinc-400">{row.email}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{row.phone || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              row.status === 'active' ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-zinc-850 text-zinc-450 border border-zinc-800'
                            }`}>{row.status}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{row.join_date}</td>
                        </>
                      )}
                      {reportType === 'payments' && (
                        <>
                          <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{row.id.substring(0, 8).toUpperCase()}</td>
                          <td className="px-4 py-3 text-zinc-400">{row.members ? `${row.members.first_name} ${row.members.last_name}` : 'Unknown'}</td>
                          <td className="px-4 py-3 font-semibold text-[#FFE600]">${row.amount}</td>
                          <td className="px-4 py-3 whitespace-nowrap uppercase">{row.payment_method}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              row.payment_status === 'completed' ? 'bg-green-950 text-green-400' : 'bg-red-950/40 text-red-400'
                            }`}>{row.payment_status}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(row.payment_date).toLocaleDateString()}</td>
                        </>
                      )}
                      {reportType === 'attendance' && (
                        <>
                          <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{row.member ? `${row.member.first_name} ${row.member.last_name}` : 'Unknown'}</td>
                          <td className="px-4 py-3">{new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-4 py-3">{row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-semibold">
                            {row.check_out ? (
                              `${Math.round((new Date(row.check_out).getTime() - new Date(row.check_in).getTime()) / 60000)}m`
                            ) : (
                              <span className="text-[#FFE600] animate-pulse">Active</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{row.attendance_date}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              row.status === 'present' ? 'bg-green-950 text-green-400' : 'bg-yellow-950 text-yellow-400'
                            }`}>{row.status}</span>
                          </td>
                        </>
                      )}
                      {reportType === 'revenue' && (
                        <>
                          <td className="px-4 py-3 font-bold text-white whitespace-nowrap">{row.id.substring(0, 8).toUpperCase()}</td>
                          <td className="px-4 py-3 text-zinc-400">{row.members ? `${row.members.first_name} ${row.members.last_name}` : 'Unknown'}</td>
                          <td className="px-4 py-3 font-semibold text-[#FFE600]">${row.amount}</td>
                          <td className="px-4 py-3 whitespace-nowrap uppercase">{row.payment_method}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(row.payment_date).toLocaleDateString()}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewData.length > 10 && (
              <p className="text-[10px] text-zinc-550 italic text-center">
                Showing top 10 preview records. Exporting generates a complete data document of all {previewData.length} records.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
