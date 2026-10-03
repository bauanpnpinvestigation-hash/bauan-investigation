import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  deleteDoc, 
  getDocs, 
  writeBatch, 
  Unsubscribe 
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';
import { ReportSubmission } from '../types/reports';

// Canonical Firebase config for bauan-investigation
export const activeConfig = {
  ...defaultFirebaseConfig,
};

export function getActiveFirebaseConfig() {
  return activeConfig;
}

// 1. Initialize Firebase App directly with official project credentials
const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();

// Database initialization: Explicitly connected to Cloud Firestore (default) database
export const db = getFirestore(app, '(default)');
export const auth = getAuth(app);

/**
 * Utility to verify Firestore connectivity
 */
export async function testFirestoreConnection(): Promise<void> {
  try {
    const testDoc = doc(db, 'connection_test', 'ping');
    await setDoc(testDoc, {
      timestamp: new Date().toISOString(),
      message: 'Connectivity Test Successful'
    });
    console.log('[Firestore] Connectivity test: SUCCESS. Check your Firebase Console for the "connection_test" collection.');
  } catch (error) {
    console.error('[Firestore] Connectivity test: FAILED.', error);
  }
}


// 2. Validate Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client connection check notice:', error.message);
    }
  }
}
testConnection();

// Helper: Sanitize payload to prevent Firestore "unsupported undefined value" errors
export function sanitizeFirestorePayload<T>(obj: T): T {
  if (obj === undefined) {
    return null as unknown as T;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeFirestorePayload) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeFirestorePayload(value);
    }
  }
  return clean as T;
}

// 3. Mandatory Firestore Error Handler conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function formatFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  return errInfo;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = formatFirestoreError(error, operationType, path);
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Password Authentication for Police Administrator
export const AUTHORIZED_ADMIN_EMAIL = 'bauan.pnp.investigation@gmail.com';
export const PRIMARY_SUPER_ADMIN_UID = 'RbisRuyOLEbena1ncWe2xk8HTzy2';

export async function signInAdminWithPassword(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    // Write admin record to Firestore /admins/{uid}
    await ensureAdminProfileInFirestore(userCredential.user);
    return userCredential.user;
  } catch (err: any) {
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential'
    ) {
      if (cleanEmail.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        try {
          const newCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          await ensureAdminProfileInFirestore(newCredential.user);
          return newCredential.user;
        } catch (createErr) {
          console.warn('Auto-registration attempt notice:', createErr);
        }
      }
    }
    throw err;
  }
}

export async function signOutAdmin(): Promise<void> {
  await firebaseSignOut(auth);
}

export function isUserAuthorizedAdmin(user: User | null): boolean {
  if (!user) return false;
  return true;
}

/**
 * Automatically creates/updates admin profile document in Cloud Firestore /admins/{uid}
 * with full super admin permissions for UID RbisRuyOLEbena1ncWe2xk8HTzy2
 */
export async function ensureAdminProfileInFirestore(user: User): Promise<void> {
  if (!user || !user.uid) return;
  const path = `admins/${user.uid}`;
  const isTargetSuperAdmin = user.uid === PRIMARY_SUPER_ADMIN_UID || (user.email && user.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase());
  try {
    const adminRef = doc(db, 'admins', user.uid);
    const adminData = sanitizeFirestorePayload({
      uid: user.uid,
      email: user.email || AUTHORIZED_ADMIN_EMAIL,
      role: 'SUPER_ADMIN',
      designation: 'PNP Bauan Municipal Police Station Head Administrator',
      station: 'Bauan Municipal Police Station - Investigation & Records Section',
      permissions: ['ALL', 'SUPER_ADMIN', 'VIEW', 'UPDATE', 'DELETE', 'ERASE_DATABASE', 'EXPORT', 'MANAGE_SETTINGS'],
      isSuperAdmin: true,
      hasFullPermission: true,
      lastActive: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(adminRef, adminData, { merge: true });
    console.log(`[Firestore] Super Admin document successfully created/updated at ${path}`);
  } catch (err) {
    console.warn(`[Firestore] Admin profile sync notice for ${path}:`, err);
  }
}

// 5. Direct Cloud Firestore Operations

/**
 * Public Citizens submit new reports directly to Cloud Firestore /reports/{reportId}
 */
export async function createReportInFirestore(report: ReportSubmission): Promise<void> {
  const path = `reports/${report.id}`;
  try {
    const reportRef = doc(db, 'reports', report.id);
    const payload = sanitizeFirestorePayload({
      ...report,
      createdAt: report.createdAt || new Date().toISOString(),
      updatedAt: report.updatedAt || new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });
    await setDoc(reportRef, payload);
    console.log(`[Firestore] Report created directly in Firestore: ${path}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Real-time direct listener for Cloud Firestore /reports collection
 */
export function subscribeToReports(
  onUpdate: (reports: ReportSubmission[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const collectionPath = 'reports';
  const reportsRef = collection(db, collectionPath);

  return onSnapshot(
    reportsRef,
    (snapshot) => {
      const loaded: ReportSubmission[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        loaded.push({
          id: d.id,
          referenceNumber: data.referenceNumber || '',
          reportType: data.reportType || 'personal-intake',
          status: data.status || 'NEW',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          completedAt: data.completedAt || null,
          archivedAt: data.archivedAt || null,
          personalInformation: data.personalInformation || {},
          reportData: data.reportData || {},
          attachments: data.attachments || [],
          adminNotes: data.adminNotes || [],
          auditLogs: data.auditLogs || [],
          stationOffice: data.stationOffice || 'Investigation & Records Section',
        });
      });

      // Sort descending by creation date
      loaded.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(loaded);
    },
    (error) => {
      console.warn('[Firestore] Reports snapshot listener notice:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Update Status workflow (NEW -> PROCESSING -> COMPLETED -> ARCHIVED) directly in Cloud Firestore
 */
export async function updateReportStatusInFirestore(
  reportId: string,
  newStatus: ReportStatus,
  adminEmail: string
): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    const now = new Date().toISOString();
    const reportRef = doc(db, 'reports', reportId);

    const updatePayload: Record<string, any> = {
      status: newStatus,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
    };

    if (newStatus === 'COMPLETED') {
      updatePayload.completedAt = now;
    } else if (newStatus === 'ARCHIVED') {
      updatePayload.archivedAt = now;
    }

    const currentAuditLogs = (await getReportAuditLogs(reportId)) || [];
    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail: adminEmail,
      action: newStatus === 'COMPLETED' ? 'REPORT_COMPLETED' : newStatus === 'ARCHIVED' ? 'REPORT_ARCHIVED' : 'STATUS_CHANGED',
      details: `Status set to ${newStatus} by ${adminEmail}`,
    };

    const sanitizedData = sanitizeFirestorePayload({
      ...updatePayload,
      auditLogs: [...currentAuditLogs, logEntry],
    });

    await updateDoc(reportRef, sanitizedData);
    console.log(`[Firestore] Status updated for ${path} -> ${newStatus}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Update Investigation Details directly in Cloud Firestore
 */
export async function updateReportDataInFirestore(
  reportId: string,
  updatedData: Record<string, any>,
  adminEmail: string
): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    const now = new Date().toISOString();
    const reportRef = doc(db, 'reports', reportId);

    const currentAuditLogs = (await getReportAuditLogs(reportId)) || [];
    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail: adminEmail,
      action: 'UPDATE_REPORT',
      details: `Investigation fields updated by ${adminEmail}`,
    };

    const sanitizedData = sanitizeFirestorePayload({
      reportData: updatedData,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      auditLogs: [...currentAuditLogs, logEntry],
    });

    await updateDoc(reportRef, sanitizedData);
    console.log(`[Firestore] Investigation details updated for ${path}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Add Private Internal Admin Note directly in Cloud Firestore
 */
export async function addAdminNoteInFirestore(
  reportId: string,
  noteText: string,
  adminEmail: string
): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    const now = new Date().toISOString();
    const reportRef = doc(db, 'reports', reportId);

    const newNote: AdminNote = {
      id: `note_${Date.now()}`,
      authorEmail: adminEmail,
      text: noteText,
      createdAt: now,
    };

    const currentNotes = (await getReportAdminNotes(reportId)) || [];
    const currentAuditLogs = (await getReportAuditLogs(reportId)) || [];
    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail: adminEmail,
      action: 'UPDATE_REPORT',
      details: `Private internal note recorded by ${adminEmail}`,
    };

    const sanitizedData = sanitizeFirestorePayload({
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      adminNotes: [...currentNotes, newNote],
      auditLogs: [...currentAuditLogs, logEntry],
    });

    await updateDoc(reportRef, sanitizedData);
    console.log(`[Firestore] Note added to ${path}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

async function getReportAuditLogs(reportId: string): Promise<AuditLogEntry[]> {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDocFromServer(reportRef);
    return snap.exists() ? snap.data().auditLogs || [] : [];
  } catch {
    return [];
  }
}

async function getReportAdminNotes(reportId: string): Promise<AdminNote[]> {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDocFromServer(reportRef);
    return snap.exists() ? snap.data().adminNotes || [] : [];
  } catch {
    return [];
  }
}

/**
 * Delete a single report directly from Cloud Firestore
 */
export async function deleteReportFromFirestore(reportId: string): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    const reportRef = doc(db, 'reports', reportId);
    await deleteDoc(reportRef);
    console.log(`[Firestore] Deleted report ${path}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Erase all reports directly from Cloud Firestore database
 */
export async function eraseAllReportsFromFirestore(): Promise<number> {
  const collectionPath = 'reports';
  try {
    const reportsRef = collection(db, collectionPath);
    const snapshot = await getDocs(reportsRef);
    if (snapshot.empty) return 0;

    let count = 0;
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const chunk = docs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((d) => {
        batch.delete(d.ref);
        count++;
      });
      await batch.commit();
    }
    console.log(`[Firestore] Erased ${count} reports from Cloud Firestore`);
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionPath);
    return 0;
  }
}
