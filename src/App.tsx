import React, { useState, useEffect } from 'react';
import { PublicIntakeWizard } from './components/public/PublicIntakeWizard';
import { PublicFAQPage } from './components/public/PublicFAQSection';
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
  subscribeToReports,
  createReportInFirestore,
  deleteReportFromFirestore,
  deleteAttachmentInFirestore,
  updateReportStatusInFirestore,
  updateReportDataInFirestore,
  addAdminNoteInFirestore,
  eraseAllReportsFromFirestore,
  normalizeFirestoreArray,
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

  // Helper utility to make authenticated requests to our secure backend endpoints
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const user = auth.currentUser;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (user) {
      const idToken = await user.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  // Securely load reports list from backend API rather than a direct client-side stream
  const loadReports = async () => {
    try {
      const resp = await fetchWithAuth('/api/admin/reports');
      if (resp.ok) {
        const data = await resp.json();
        const rawReports = Array.isArray(data.reports) ? data.reports : [];
        setReports(
          rawReports.map((r: any) => ({
            ...r,
            attachments: normalizeFirestoreArray(r.attachments),
            adminNotes: normalizeFirestoreArray(r.adminNotes),
            auditLogs: normalizeFirestoreArray(r.auditLogs),
          }))
        );
      } else {
        console.warn('[Admin API] Failed to fetch reports list from intermediate security worker.');
      }
    } catch (err) {
      console.error('[Admin API] Network error pulling reports:', err);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Securely pull records on admin login using client SDK (which utilizes active browser session) with API fallback
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToReports(
        (liveReports) => {
          setReports(liveReports);
        },
        (err) => {
          console.warn('[Direct Firestore Sync failed, falling back to secure API]:', err);
          loadReports();
        }
      );
      return () => unsubscribe();
    } else {
      setReports([]);
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

  // Status updates securely routed to Firestore with API fallback
  const handleUpdateStatus = async (reportId: string, newStatus: ReportStatus) => {
    try {
      await updateReportStatusInFirestore(reportId, newStatus, adminEmail);
      toast.success(`Record status updated to ${newStatus}`);
    } catch (err: any) {
      console.warn('[Direct Firestore Update failed, trying API fallback]:', err);
      try {
        const resp = await fetchWithAuth(`/api/admin/reports/${reportId}/status`, {
          method: 'POST',
          body: JSON.stringify({ status: newStatus }),
        });
        if (!resp.ok) {
          throw new Error('Server-side status update failed validation.');
        }
        toast.success(`Record status updated to ${newStatus}`);
        loadReports();
      } catch (fallbackErr: any) {
        console.error('[Admin API] Failed to update status:', fallbackErr);
        toast.error(fallbackErr.message || 'Failed to update status');
      }
    }
  };

  // Police officer updating investigation details securely routed to Firestore with API fallback
  const handleUpdateReportData = async (reportId: string, updatedData: Record<string, any>) => {
    try {
      await updateReportDataInFirestore(reportId, updatedData, adminEmail);
      toast.success('Investigation details recorded in database');
    } catch (err: any) {
      console.warn('[Direct Firestore Update failed, trying API fallback]:', err);
      try {
        const resp = await fetchWithAuth(`/api/admin/reports/${reportId}`, {
          method: 'PATCH',
          body: JSON.stringify({ reportData: updatedData }),
        });
        if (!resp.ok) {
          throw new Error('Server-side report update failed validation.');
        }
        toast.success('Investigation details recorded in database');
        loadReports();
      } catch (fallbackErr: any) {
        console.error('[Admin API] Failed to record investigation updates:', fallbackErr);
        toast.error(fallbackErr.message || 'Failed to record investigation updates');
      }
    }
  };

  // Police officer posting internal note securely routed to Firestore with API fallback
  const handleAddNote = async (reportId: string, noteText: string) => {
    try {
      await addAdminNoteInFirestore(reportId, noteText, adminEmail);
      toast.success('Private internal note saved to audit log');
    } catch (err: any) {
      console.warn('[Direct Firestore Update failed, trying API fallback]:', err);
      try {
        const resp = await fetchWithAuth(`/api/admin/reports/${reportId}/notes`, {
          method: 'POST',
          body: JSON.stringify({ note: noteText }),
        });
        if (!resp.ok) {
          throw new Error('Server-side note append failed validation.');
        }
        toast.success('Private internal note saved to audit log');
        loadReports();
      } catch (fallbackErr: any) {
        console.error('[Admin API] Failed to save internal note:', fallbackErr);
        toast.error(fallbackErr.message || 'Failed to save internal note');
      }
    }
  };

  // Public Citizen submission securely written to Cloud Firestore with API proxy fallback
  const handlePublicSubmission = async (newReport: ReportSubmission) => {
    try {
      // 1. Write directly to Cloud Firestore (Guaranteed to work on all phones & devices)
      await createReportInFirestore(newReport);

      // 2. Optional backend API sync
      try {
        await fetch('/api/intake', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportType: newReport.reportType,
            personalInformation: newReport.personalInformation,
            attachments: newReport.attachments,
          }),
        });
      } catch (apiErr) {
        console.warn('[Public API] Optional server sync notice:', apiErr);
      }

      toast.success(`Personal Information submitted! Ref #${newReport.referenceNumber}`, 'Submission Confirmed');
      setReports((prev) => [newReport, ...prev]);
    } catch (err: any) {
      console.error('[Public Submission] Record creation error:', err);
      toast.error(err.message || 'Error recording submission. Please check your connection.');
      throw err; // throw back to wizard to prevent premature step switching
    }
  };

  // Delete single report securely routed to Firestore with API fallback
  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReportFromFirestore(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (selectedReportId === reportId) {
        setSelectedReportId(null);
      }
      toast.info('Report deleted from database');
    } catch (err: any) {
      console.warn('[Direct Firestore Delete failed, trying API fallback]:', err);
      try {
        const resp = await fetchWithAuth(`/api/admin/reports/${reportId}`, {
          method: 'DELETE',
        });
        if (!resp.ok) {
          throw new Error('Server-side deletion failed validation.');
        }
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        if (selectedReportId === reportId) {
          setSelectedReportId(null);
        }
        toast.info('Report deleted from database');
      } catch (fallbackErr: any) {
        console.error('[Admin API] Deletion failed:', fallbackErr);
        toast.error(fallbackErr.message || 'Failed to delete report');
      }
    }
  };

  // Delete a single attachment from a report securely routed to Firestore with API fallback
  const handleDeleteAttachment = async (reportId: string, attachmentId: string) => {
    try {
      await deleteAttachmentInFirestore(reportId, attachmentId);
      toast.info('Evidence attachment removed');
    } catch (err: any) {
      console.warn('[Direct Firestore Attachment removal failed, trying API fallback]:', err);
      try {
        const resp = await fetchWithAuth(`/api/admin/reports/${reportId}/attachments/${attachmentId}`, {
          method: 'DELETE',
        });
        if (!resp.ok) {
          throw new Error('Server-side evidence removal failed validation.');
        }
        toast.info('Evidence attachment removed');
        loadReports();
      } catch (fallbackErr: any) {
        console.error('[Admin API] Evidence removal failed:', fallbackErr);
        toast.error(fallbackErr.message || 'Failed to delete attachment');
      }
    }
  };

  // Erase all reports from database securely routed to Firestore with API fallback
  const handleEraseDatabase = async () => {
    try {
      await eraseAllReportsFromFirestore();
      setReports([]);
      setSelectedReportId(null);
      toast.warning('All reports permanently erased from database');
    } catch (err: any) {
      console.warn('[Direct Firestore Database purge failed, trying API fallback]:', err);
      try {
        const resp = await fetchWithAuth('/api/admin/reports', {
          method: 'DELETE',
        });
        if (!resp.ok) {
          throw new Error('Server-side database purge failed validation.');
        }
        setReports([]);
        setSelectedReportId(null);
        toast.warning('All reports permanently erased from database');
      } catch (fallbackErr: any) {
        console.error('[Admin API] Database purge failed:', fallbackErr);
        toast.error(fallbackErr.message || 'Failed to erase records');
      }
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

  // Route: /faq or /faq/:caseId (Dedicated FAQ & Philippine Law 15 Cases Route)
  if (currentPath.startsWith('/faq')) {
    return (
      <>
        <PublicFAQPage
          currentPath={currentPath}
          onNavigateToPublic={() => navigateTo('/')}
          onNavigateToAdmin={() => navigateTo('/admin')}
          onNavigatePath={(path) => navigateTo(path)}
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
        onNavigateToFAQ={() => navigateTo('/faq')}
      />
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
      <OfflineIndicator />
    </>
  );
}
