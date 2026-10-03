import React, { useState, useEffect } from 'react';
import { PublicIntakeWizard } from './components/public/PublicIntakeWizard';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminReportDetail } from './components/admin/AdminReportDetail';
import { QRCodeModal } from './components/common/QRCodeModal';
import { BrandLogo } from './components/common/BrandLogo';
import { BackgroundWatermark } from './components/common/BackgroundWatermark';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { useToast } from './context/ToastContext';
import { ReportSubmission, ReportStatus } from './types/reports';
import { 
  auth, 
  signOutAdmin, 
  createReportInFirestore, 
  subscribeToReports, 
  updateReportStatusInFirestore, 
  updateReportDataInFirestore, 
  addAdminNoteInFirestore,
  deleteReportFromFirestore,
  eraseAllReportsFromFirestore,
  deleteAttachmentInFirestore,
  isUserAuthorizedAdmin,
  ensureAdminProfileInFirestore,
  AUTHORIZED_ADMIN_EMAIL
} from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Shield, QrCode, Lock, ArrowRight } from 'lucide-react';

export default function App() {
  // Current route pathname
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  // Real Firebase User & Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Selected report for detail view
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Live Cloud Firestore reports populated directly from Firestore
  const [reports, setReports] = useState<ReportSubmission[]>([]);

  // QR Code Modal State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Toast notification manager
  const toast = useToast();

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        ensureAdminProfileInFirestore(user);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore listener for authenticated administrators
  useEffect(() => {
    if (currentUser) {
      const unsubscribeReports = subscribeToReports(
        (liveReports) => {
          setReports(liveReports);
        },
        (error) => {
          console.warn('Firestore live listener notice (using cached fallback):', error);
        }
      );
      return () => unsubscribeReports();
    }
  }, [currentUser]);

  // Browser navigation sync (popstate)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const adminEmail = currentUser?.email || AUTHORIZED_ADMIN_EMAIL;

  // Status updates in Cloud Firestore
  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    try {
      await updateReportStatusInFirestore(reportId, newStatus, adminEmail);
      toast.success(`Record status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status in Firestore', err);
      toast.error('Failed to update status in database');
    }
  };

  // Police officer updating investigation details in Cloud Firestore
  const handleUpdateReportData = async (reportId: string, updatedData: Record<string, any>) => {
    try {
      await updateReportDataInFirestore(reportId, updatedData, adminEmail);
      toast.success('Investigation details recorded in database');
    } catch (err) {
      console.error('Failed to update report data in Firestore', err);
      toast.error('Failed to record investigation updates');
    }
  };

  // Police officer posting internal note in Cloud Firestore
  const handleAddNote = async (reportId: string, noteText: string) => {
    try {
      await addAdminNoteInFirestore(reportId, noteText, adminEmail);
      toast.success('Private internal note saved to audit log');
    } catch (err) {
      console.error('Failed to add note in Firestore', err);
      toast.error('Failed to save internal note');
    }
  };

  // Public Citizen submission to Cloud Firestore
  const handlePublicSubmission = async (newReport: ReportSubmission) => {
    try {
      await createReportInFirestore(newReport);
      toast.success(`Personal Information submitted! Ref #${newReport.referenceNumber}`, 'Submission Confirmed');
    } catch (err) {
      console.error('Failed to persist report to Cloud Firestore', err);
      toast.error('Error recording submission. Cached locally.');
    } finally {
      setReports((prev) => {
        if (prev.some((r) => r.id === newReport.id)) return prev;
        return [newReport, ...prev];
      });
    }
  };

  // Delete single report from Cloud Firestore
  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReportFromFirestore(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (selectedReportId === reportId) {
        setSelectedReportId(null);
      }
      toast.info('Report deleted from database');
    } catch (err) {
      console.error('Failed to delete report from Cloud Firestore', err);
      toast.error('Failed to delete report');
    }
  };

  // Delete a single attachment from a report
  const handleDeleteAttachment = async (reportId: string, attachmentId: string) => {
    try {
      await deleteAttachmentInFirestore(reportId, attachmentId);
      toast.info('Evidence attachment removed');
    } catch (err) {
      console.error('Failed to delete attachment from Cloud Firestore', err);
      toast.error('Failed to delete attachment');
    }
  };

  // Erase all reports from Cloud Firestore
  const handleEraseDatabase = async () => {
    try {
      await eraseAllReportsFromFirestore();
      setReports([]);
      setSelectedReportId(null);
      toast.warning('All reports permanently erased from database');
    } catch (err) {
      console.error('Failed to erase database in Cloud Firestore', err);
      toast.error('Failed to erase records');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await signOutAdmin();
    toast.info('Logged out from officer session');
    navigateTo('/admin/login');
  };

  // Route: /request -> Public intake form
  if (currentPath === '/request') {
    return (
      <>
        <PublicIntakeWizard
          onSubmitSuccess={handlePublicSubmission}
          onNavigateToAdmin={() => navigateTo('/admin')}
        />
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
        />
      </>
    );
  }

  // Route: /admin or /admin/dashboard or /admin/login
  if (currentPath.startsWith('/admin')) {
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <div className="text-center space-y-3">
            <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="text-xs font-semibold text-slate-400">Verifying Police Authentication...</p>
          </div>
        </div>
      );
    }

    // If not authenticated, display login
    if (!currentUser) {
      return (
        <>
          <AdminLogin
            onLoginSuccess={() => {
              navigateTo('/admin/dashboard');
            }}
            onNavigateToPublic={() => navigateTo('/request')}
          />
          <QRCodeModal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
          />
        </>
      );
    }

    // Authenticated admin view
    const selectedReport = selectedReportId
      ? reports.find((r) => r.id === selectedReportId)
      : null;

    if (selectedReport) {
      return (
        <div className="relative min-h-screen bg-slate-100 flex flex-col font-sans overflow-x-hidden">
          <BackgroundWatermark theme="light" />
          <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdminReportDetail
              report={selectedReport}
              onBack={() => setSelectedReportId(null)}
              onUpdateStatus={handleUpdateStatus}
              onUpdateReportData={handleUpdateReportData}
              onAddNote={handleAddNote}
              onDeleteReport={handleDeleteReport}
              onDeleteAttachment={handleDeleteAttachment}
              currentAdminEmail={adminEmail}
            />
          </main>
          <QRCodeModal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
          />
        </div>
      );
    }

    return (
      <>
        <AdminDashboard
          reports={reports}
          onViewReport={(id) => setSelectedReportId(id)}
          onLogout={handleLogout}
          onOpenQRCode={() => setIsQRModalOpen(true)}
          currentAdminEmail={adminEmail}
          onDeleteReport={handleDeleteReport}
          onEraseDatabase={handleEraseDatabase}
        />
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
        />
      </>
    );
  }

  // Route: / (Default landing page directing to Public /request or Private /admin)
  return (
    <div className="relative min-h-screen bg-slate-900 text-white flex flex-col justify-between font-sans overflow-x-hidden">
      {/* Resilient Official Insignia Ambient Background Watermark */}
      <BackgroundWatermark theme="dark" />

      {/* Top Header */}
      <header className="relative z-10 bg-slate-950/80 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-black tracking-tight text-white leading-tight uppercase truncate">
                BAUAN MPS - INVESTIGATION SECTION
              </h1>
              <p className="text-[10px] sm:text-xs text-blue-300 font-semibold truncate">
                Official Public Intake & Investigation Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Hero & Dual Pathway */}
      <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center w-full">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-[11px] sm:text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Connected to Cloud Firestore & Cloudinary Storage</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Official Public Intake & Investigation Platform
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 sm:mt-3 leading-relaxed">
            Live database connected. Citizens submit structured Personal Information via QR; police officers complete investigation records and attach Cloudinary evidence.
          </p>
        </div>

        {/* Two Pathway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto w-full">
          {/* Card 1: Public Intake (/request) */}
          <div className="bg-slate-800/80 backdrop-blur-xs border-2 border-blue-600/60 hover:border-blue-500 rounded-2xl p-5 sm:p-7 flex flex-col justify-between shadow-xl transition-all">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3 sm:mb-4">
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-400">
                Public Area (Accessible via QR)
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                Citizen Personal Info Intake
              </h3>
              <p className="text-xs font-semibold text-blue-200 mt-0.5">
                (Pagtatala ng Personal na Impormasyon ng Mamamayan)
              </p>
              <p className="text-xs text-slate-300 mt-2 sm:mt-3 leading-relaxed">
                Direct citizen intake for Personal Information only. No account creation required. Fast submission with official tracking Reference Number.
              </p>
            </div>

            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => navigateTo('/request')}
                className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 sm:px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Open Public Request (/request)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Admin Portal (/admin) */}
          <div className="bg-slate-800/80 backdrop-blur-xs border-2 border-slate-700 hover:border-slate-600 rounded-2xl p-5 sm:p-7 flex flex-col justify-between shadow-xl transition-all">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 sm:mb-4">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400">
                Authorized Personnel Only
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                Administrator Dashboard
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                (Portal ng mga Imbestigador at Kawani)
              </p>
              <p className="text-xs text-slate-300 mt-2 sm:mt-3 leading-relaxed">
                Review live submissions from Cloud Firestore. Fill out investigation details, use copy buttons, copy sections, and generate complete reports.
              </p>
            </div>

            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => navigateTo('/admin/login')}
                className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 sm:px-5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Officer Login (/admin)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-800/80 py-3 sm:py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <span>Official Police Intake System • Firebase & Cloudinary Live</span>
          <span className="text-slate-400 font-mono text-[11px]">Bauan PNP Investigation & Records</span>
        </div>
      </footer>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
