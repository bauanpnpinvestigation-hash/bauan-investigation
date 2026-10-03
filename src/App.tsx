import React, { useState, useEffect } from 'react';
import { PublicIntakeWizard } from './components/public/PublicIntakeWizard';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminReportDetail } from './components/admin/AdminReportDetail';
import { QRCodeModal } from './components/common/QRCodeModal';
import { BackgroundWatermark } from './components/common/BackgroundWatermark';
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
  ensureAdminProfileInFirestore,
  AUTHORIZED_ADMIN_EMAIL
} from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  // Current route management (Direct Public Intake as primary front)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
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
    navigateTo('/');
  };

  // Route: /admin or /admin/dashboard or /admin/login
  if (currentPath.startsWith('/admin')) {
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans">
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
            onNavigateToPublic={() => navigateTo('/')}
          />
          <QRCodeModal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
          />
          <OfflineIndicator />
        </>
      );
    }

    // Authenticated admin view: Detail
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
          <OfflineIndicator />
        </div>
      );
    }

    // Authenticated admin view: Dashboard
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
        <OfflineIndicator />
      </>
    );
  }

  // PRIMARY MAIN FRONT: Directly opens Citizen Public Intake Wizard!
  // No pathway confusion when clients scan QR or open the app.
  // Officer login is discreetly located at top right header.
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
      <OfflineIndicator />
    </>
  );
}
