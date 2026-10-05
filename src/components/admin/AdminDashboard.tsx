import React, { useState, useMemo, useEffect } from 'react';
import { ReportSubmission, ReportStatus, ReportTypeId } from '../../types/reports';
import { REPORT_TYPES } from '../../config/reportTypes';
import { StatusBadge } from '../common/StatusBadge';
import { formatHumanDate, formatHumanDateTime } from '../../utils/dateUtils';
import { BrandLogo } from '../common/BrandLogo';
import { BackgroundWatermark } from '../common/BackgroundWatermark';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Eye, 
  QrCode, 
  Archive, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  LogOut,
  Calendar,
  Phone,
  User,
  Shield,
  Database,
  Trash2,
  AlertTriangle,
  X,
  HardDrive,
  FolderLock
} from 'lucide-react';
import { GoogleDriveVault } from './GoogleDriveVault';

interface AdminDashboardProps {
  reports: ReportSubmission[];
  onViewReport: (reportId: string) => void;
  onLogout: () => void;
  onOpenQRCode: () => void;
  currentAdminEmail?: string;
  onRestoreReport?: (reportId: string) => void;
  onDeleteReport?: (reportId: string) => Promise<void> | void;
  onEraseDatabase?: () => Promise<void> | void;
}

type TabType = 'ALL' | 'ACTIVE' | 'NEW' | 'PROCESSING' | 'COMPLETED' | 'ARCHIVED';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  reports,
  onViewReport,
  onLogout,
  onOpenQRCode,
  currentAdminEmail = 'bauan.pnp.investigation@gmail.com',
  onRestoreReport,
  onDeleteReport,
  onEraseDatabase,
}) => {
  const [mainView, setMainView] = useState<'REPORTS' | 'GOOGLE_DRIVE'>('REPORTS');
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterType, filterStatus, filterDate]);

  // Single report deletion state
  const [reportToDelete, setReportToDelete] = useState<ReportSubmission | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Erase whole database state
  const [showEraseModal, setShowEraseModal] = useState(false);
  const [eraseConfirmInput, setEraseConfirmInput] = useState('');
  const [isErasingAll, setIsErasingAll] = useState(false);

  // Counts for summary metrics
  const counts = useMemo(() => {
    return {
      new: reports.filter((r) => r.status === 'NEW').length,
      processing: reports.filter((r) => r.status === 'PROCESSING').length,
      completed: reports.filter((r) => r.status === 'COMPLETED').length,
      archived: reports.filter((r) => r.status === 'ARCHIVED').length,
      total: reports.length,
    };
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Tab filter
      if (activeTab === 'ACTIVE' && (report.status === 'COMPLETED' || report.status === 'ARCHIVED')) {
        return false;
      }
      if (activeTab === 'NEW' && report.status !== 'NEW') return false;
      if (activeTab === 'PROCESSING' && report.status !== 'PROCESSING') return false;
      if (activeTab === 'COMPLETED' && report.status !== 'COMPLETED') return false;
      if (activeTab === 'ARCHIVED' && report.status !== 'ARCHIVED') return false;
      if (activeTab === 'ALL' && report.status === 'ARCHIVED' && filterStatus === 'ALL') {
        return false;
      }

      // Dropdown status filter
      if (filterStatus !== 'ALL' && report.status !== filterStatus) return false;

      // Filter by report type
      if (filterType !== 'ALL' && report.reportType !== filterType) return false;

      // Filter by date (YYYY-MM-DD)
      if (filterDate) {
        const reportDate = (report.createdAt || '').split('T')[0];
        if (reportDate !== filterDate) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const refMatch = (report.referenceNumber || '').toLowerCase().includes(q);
        const pi = report.personalInformation || ({} as any);
        const nameMatch = `${pi.firstName || ''} ${pi.middleName || ''} ${pi.lastName || ''}`.toLowerCase().includes(q);
        const phoneMatch = (pi.contactNumber || '').toLowerCase().includes(q);
        const addressMatch = (pi.address || '').toLowerCase().includes(q);
        return refMatch || nameMatch || phoneMatch || addressMatch;
      }

      return true;
    });
  }, [reports, activeTab, filterStatus, filterType, filterDate, searchQuery]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('ALL');
    setFilterStatus('ALL');
    setFilterDate('');
  };

  const hasActiveFilters = searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL' || filterDate;

  // Single delete handler
  const handleConfirmSingleDelete = async () => {
    if (!reportToDelete || !onDeleteReport) return;
    setIsDeletingSingle(true);
    try {
      await onDeleteReport(reportToDelete.id);
      setReportToDelete(null);
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Erase all handler
  const handleConfirmEraseAll = async () => {
    if (!onEraseDatabase || eraseConfirmInput.trim().toUpperCase() !== 'CONFIRM') return;
    setIsErasingAll(true);
    try {
      await onEraseDatabase();
      setShowEraseModal(false);
      setEraseConfirmInput('');
    } finally {
      setIsErasingAll(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* Resilient Official Seal Watermark */}
      <BackgroundWatermark theme="light" />

      {/* Top Officer Header */}
      <header className="relative z-30 bg-slate-900 text-white shadow-md sticky top-0 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-xs sm:text-sm font-black tracking-tight leading-tight truncate">
                  BAUAN MPS - INVESTIGATION
                </h1>
                <span className="hidden sm:inline-block bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs shrink-0">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-slate-300 flex items-center gap-1 truncate max-w-[150px] sm:max-w-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-white font-mono font-bold truncate">{currentAdminEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Google Drive Vault Direct Access Button */}
            <button
              type="button"
              onClick={() => setMainView('GOOGLE_DRIVE')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors border cursor-pointer ${
                mainView === 'GOOGLE_DRIVE'
                  ? 'bg-blue-600 border-blue-500 text-white ring-2 ring-blue-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700'
              }`}
              title="Open Google Drive Evidence Vault"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Drive Vault</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Erase DB Button */}
            {onEraseDatabase && reports.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setEraseConfirmInput('');
                  setShowEraseModal(true);
                }}
                className="inline-flex items-center gap-1 px-2 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold shadow-xs transition-colors border border-rose-800 cursor-pointer"
                title="Erase all records in database"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden lg:inline">Erase DB</span>
              </button>
            )}

            {/* Station QR Placard Trigger */}
            <button
              type="button"
              onClick={onOpenQRCode}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors border border-blue-700 cursor-pointer"
              title="Display desk QR code"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Desk QR</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 rounded-lg text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
              title="Logout from admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Primary Admin Navigation Switcher: Intake Reports vs Google Drive Vault */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex gap-1.5 p-1 bg-slate-100/90 rounded-xl">
            <button
              type="button"
              onClick={() => setMainView('REPORTS')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                mainView === 'REPORTS'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Incident Intake Records ({reports.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMainView('GOOGLE_DRIVE')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                mainView === 'GOOGLE_DRIVE'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Google Drive Document Vault</span>
              <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black uppercase">
                Word & PDF
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 text-xs text-slate-500 font-medium">
            <Shield className="w-3.5 h-3.5 text-blue-700" />
            <span>Classified Police Administrator Storage</span>
          </div>
        </div>

        {mainView === 'GOOGLE_DRIVE' ? (
          <GoogleDriveVault
            reports={reports}
            currentAdminEmail={currentAdminEmail}
            onSelectIncidentReport={onViewReport}
          />
        ) : (
          <>
            {/* SUMMARY STAT CARDS (Compact layout) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Card: NEW */}
          <div 
            onClick={() => setActiveTab('NEW')}
            className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'NEW'
                ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                New
              </span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {counts.new}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Pending Review</p>
          </div>

          {/* Card: PROCESSING */}
          <div 
            onClick={() => setActiveTab('PROCESSING')}
            className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'PROCESSING'
                ? 'bg-blue-500/10 border-blue-500 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Processing
              </span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {counts.processing}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Under Action</p>
          </div>

          {/* Card: COMPLETED */}
          <div 
            onClick={() => setActiveTab('COMPLETED')}
            className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'COMPLETED'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Completed
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {counts.completed}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Resolved</p>
          </div>

          {/* Card: ARCHIVED */}
          <div 
            onClick={() => setActiveTab('ARCHIVED')}
            className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'ARCHIVED'
                ? 'bg-slate-700/10 border-slate-700 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Archived
              </span>
              <Archive className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {counts.archived}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Records Kept</p>
          </div>
        </div>

        {/* CONTROLS BAR: TABS, SEARCH, AND FILTERS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 sm:p-4 space-y-3">
          {/* TABS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-blue-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({counts.total - counts.archived})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('NEW')}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'NEW'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              New ({counts.new})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PROCESSING')}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'PROCESSING'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Processing ({counts.processing})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'COMPLETED'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Completed ({counts.completed})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ARCHIVED')}
              className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ARCHIVED'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Archived ({counts.archived})
            </button>
          </div>

          {/* Search bar & Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Ref#, Name, Phone..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Filter by Report Type */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Report Types</option>
                {Object.values(REPORT_TYPES).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            {/* Filter by Date & Reset */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  title="Clear all active filters"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs flex items-center gap-1 font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* INTAKE RECORDS LIST / TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-400 space-y-2">
              <Layers className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No records found matching criteria.</p>
              <p className="text-xs text-slate-400">
                New submissions from citizens scanning the QR code will appear here in real time.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE (Hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Ref Number</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Date Submitted</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedReports.map((item) => {
                      const pi = item.personalInformation;
                      const fullName = `${pi.firstName} ${pi.middleName ? pi.middleName + ' ' : ''}${pi.lastName}${pi.suffix ? ' ' + pi.suffix : ''}`;
                      const reportTypeName = REPORT_TYPES[item.reportType]?.nameEn || item.reportType;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                          onClick={() => onViewReport(item.id)}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-blue-950">
                            {item.referenceNumber}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {reportTypeName}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {fullName || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {pi.contactNumber || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatHumanDateTime(item.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={item.status} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewReport(item.id);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-2xs transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>VIEW</span>
                              </button>
                              {onDeleteReport && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReportToDelete(item);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS (Ultra-compact for mobile screens) */}
              <div className="md:hidden divide-y divide-slate-100">
                {paginatedReports.map((item) => {
                  const pi = item.personalInformation;
                  const fullName = `${pi.firstName} ${pi.middleName ? pi.middleName + ' ' : ''}${pi.lastName}${pi.suffix ? ' ' + pi.suffix : ''}`;
                  const reportTypeName = REPORT_TYPES[item.reportType]?.nameEn || item.reportType;

                  return (
                    <div
                      key={item.id}
                      onClick={() => onViewReport(item.id)}
                      className="p-3 hover:bg-slate-50 transition-colors space-y-2 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-blue-950 truncate">
                          {item.referenceNumber}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="space-y-0.5 text-xs">
                        <div className="font-bold text-slate-900 text-sm">
                          {fullName || 'Anonymous Client'}
                        </div>
                        <div className="text-slate-600 flex items-center gap-1 text-[11px]">
                          <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{reportTypeName}</span>
                        </div>
                        {pi.contactNumber && (
                          <div className="text-slate-500 font-mono flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{pi.contactNumber}</span>
                          </div>
                        )}
                        <div className="text-slate-400 text-[10px] flex items-center gap-1 pt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatHumanDateTime(item.createdAt)}</span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between gap-2">
                        {onDeleteReport && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportToDelete(item);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewReport(item.id);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Request</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-bold rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-slate-600">
                        Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span className="font-bold">
                          {Math.min(currentPage * itemsPerPage, filteredReports.length)}
                        </span>{' '}
                        of <span className="font-bold">{filteredReports.length}</span> records
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-2xs -space-x-px" aria-label="Pagination">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-slate-300 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        >
                          &lt; Prev
                        </button>
                        {[...Array(totalPages)].map((_, idx) => {
                          const pageNum = idx + 1;
                          if (totalPages > 6 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                            if (pageNum === 2 || pageNum === totalPages - 1) {
                              return <span key={pageNum} className="relative inline-flex items-center px-3 py-2 border border-slate-300 bg-white text-xs text-slate-400">...</span>;
                            }
                            return null;
                          }
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-3 py-2 border text-xs font-bold transition-all cursor-pointer ${
                                currentPage === pageNum
                                  ? 'z-10 bg-blue-900 border-blue-900 text-white'
                                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-slate-300 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                        >
                          Next &gt;
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
          </>
        )}
      </main>

      {/* CONFIRMED SINGLE RECORD DELETE MODAL */}
      {reportToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => !isDeletingSingle && setReportToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with prominent X */}
            <div className="bg-rose-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm sm:text-base">Confirm Delete Record</h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingSingle && setReportToDelete(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-200 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="Cancel and close (X)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p className="text-sm font-semibold text-slate-900">
                Permanently erase this record from the database?
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="font-mono font-bold text-rose-900 block text-xs">
                  Reference: #{reportToDelete.referenceNumber}
                </span>
                <span className="text-slate-600 block text-[11px]">
                  Client: {reportToDelete.personalInformation.firstName} {reportToDelete.personalInformation.lastName}
                </span>
              </div>
              <p className="text-rose-700 font-medium">
                ⚠️ Warning: This will permanently delete this document from Cloud Firestore. This action cannot be reversed.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isDeletingSingle}
                  onClick={() => setReportToDelete(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingSingle}
                  onClick={handleConfirmSingleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingSingle ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMED ERASE ALL DATABASE RECORDS MODAL */}
      {showEraseModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => !isErasingAll && setShowEraseModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with prominent X */}
            <div className="bg-red-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-red-200">
                  Erase Entire Database
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isErasingAll && setShowEraseModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-red-300 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="Cancel and close (X)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                <span className="font-bold text-red-900 block text-xs">
                  CRITICAL ADMINISTRATIVE ACTION:
                </span>
                <p className="text-red-800 text-[11px] leading-relaxed">
                  You are about to permanently erase all <strong>{reports.length}</strong> intake report records from the Cloud Firestore database.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Type <span className="font-mono text-red-700 bg-red-50 px-1 py-0.5 rounded border border-red-200">CONFIRM</span> to proceed:
                </label>
                <input
                  type="text"
                  value={eraseConfirmInput}
                  onChange={(e) => setEraseConfirmInput(e.target.value)}
                  placeholder="CONFIRM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isErasingAll}
                  onClick={() => setShowEraseModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isErasingAll || eraseConfirmInput.trim().toUpperCase() !== 'CONFIRM'}
                  onClick={handleConfirmEraseAll}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {isErasingAll ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Erasing Database...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Erase All Records</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
