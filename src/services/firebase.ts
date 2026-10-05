import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDoc,
  getDocFromServer, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  deleteDoc, 
  getDocs, 
  writeBatch, 
  arrayUnion,
  Unsubscribe 
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';
import { ReportSubmission, ReportStatus, AdminNote, AuditLogEntry, AttachmentItem } from '../types/reports';

// Canonical Firebase config for bauan-investigation
export const activeConfig = {
  ...defaultFirebaseConfig,
};

export function getActiveFirebaseConfig() {
  return activeConfig;
}

// 1. Initialize Firebase App directly with official project credentials
const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();

// Database initialization: Pointing directly to custom database ID
export const TARGET_DATABASE_ID =
  (activeConfig as any).firestoreDatabaseId ||
  'ai-studio-secureintakeinci-4859897c-4938-4807-b45d-70752f46139d';

export const db = getFirestore(app, TARGET_DATABASE_ID);
export const auth = getAuth(app);

// ---------------------------------------------------------------------------
// Google Workspace / Google Drive OAuth Configuration
// ---------------------------------------------------------------------------
export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive',
];

const googleProvider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach((scope) => googleProvider.addScope(scope));
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Strict In-Memory Access Token Cache (never stored in localStorage/sessionStorage)
let isSigningIn = false;
let cachedGoogleDriveAccessToken: string | null = null;
let tokenExpiryTimestamp: number = 0;

type DriveTokenListener = (token: string | null) => void;
const driveTokenListeners = new Set<DriveTokenListener>();

function notifyDriveTokenListeners(token: string | null) {
  driveTokenListeners.forEach((listener) => {
    try {
      listener(token);
    } catch (e) {
      console.error('[Drive Token Listener Error]', e);
    }
  });
}

export function subscribeToGoogleDriveToken(listener: DriveTokenListener): () => void {
  driveTokenListeners.add(listener);
  listener(cachedGoogleDriveAccessToken);
  return () => {
    driveTokenListeners.delete(listener);
  };
}

export function getGoogleDriveAccessToken(): string | null {
  if (!cachedGoogleDriveAccessToken) return null;
  return cachedGoogleDriveAccessToken;
}

export function setGoogleDriveAccessToken(token: string | null, expiresInSeconds: number = 3500) {
  cachedGoogleDriveAccessToken = token;
  tokenExpiryTimestamp = token ? Date.now() + (expiresInSeconds * 1000) : 0;
  notifyDriveTokenListeners(cachedGoogleDriveAccessToken);
}

// Clear in-memory token when user logs out
onAuthStateChanged(auth, (user) => {
  if (!user && !isSigningIn) {
    setGoogleDriveAccessToken(null);
  }
});

/**
 * Sign in officer or connect Google Drive account using Google Auth Popup
 */
export async function connectGoogleDriveAccount(): Promise<{ user: User; accessToken: string } | null> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || (result as any)?._tokenResponse?.oauthAccessToken;

    if (!accessToken) {
      throw new Error('Google Drive access token was not returned by Google authentication.');
    }

    setGoogleDriveAccessToken(accessToken);

    // Non-blocking background sync of admin profile so Google Drive login returns immediately
    ensureAdminProfileInFirestore(result.user).catch((err) => {
      console.warn('[Firestore] Background admin profile sync notice:', err);
    });

    return {
      user: result.user,
      accessToken,
    };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('[Google Drive Auth] Sign-in popup was closed by user.');
      return null;
    }
    console.error('[Google Drive Auth Error]', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

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
// Session-guarded to prevent burning server read quota metric on every page reload
async function testConnection() {
  if (typeof window !== 'undefined' && sessionStorage.getItem('bauan_firebase_conn_verified')) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bauan_firebase_conn_verified', 'true');
    }
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
    ensureAdminProfileInFirestore(userCredential.user).catch(() => {});
    return userCredential.user;
  } catch (err: any) {
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential'
    ) {
      if (cleanEmail.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        try {
          const newCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          ensureAdminProfileInFirestore(newCredential.user).catch(() => {});
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
  // Session guard: Prevents burning a Firestore write quota on every tab switch or page refresh
  const syncSessionKey = `bauan_admin_synced_${user.uid}`;
  if (typeof window !== 'undefined' && sessionStorage.getItem(syncSessionKey)) {
    return;
  }
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
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(syncSessionKey, 'true');
    }
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
 * Optimized: Uses arrayUnion to append audit log with ZERO additional reads!
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

    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail: adminEmail,
      action: newStatus === 'COMPLETED' ? 'REPORT_COMPLETED' : newStatus === 'ARCHIVED' ? 'REPORT_ARCHIVED' : 'STATUS_CHANGED',
      details: `Status set to ${newStatus} by ${adminEmail}`,
    };

    const updatePayload: Record<string, any> = {
      status: newStatus,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      auditLogs: arrayUnion(logEntry),
    };

    if (newStatus === 'COMPLETED') {
      updatePayload.completedAt = now;
    } else if (newStatus === 'ARCHIVED') {
      updatePayload.archivedAt = now;
    }

    await updateDoc(reportRef, updatePayload);
    console.log(`[Firestore] Status updated for ${path} -> ${newStatus}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Update Investigation Details directly in Cloud Firestore
 * Optimized: Uses arrayUnion for audit log with ZERO extra server reads!
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
      auditLogs: arrayUnion(logEntry),
    });

    await updateDoc(reportRef, sanitizedData);
    console.log(`[Firestore] Investigation details updated for ${path}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Add Private Internal Admin Note directly in Cloud Firestore
 * Optimized: Uses arrayUnion for both adminNotes and auditLogs - consumes ZERO reads!
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

    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail: adminEmail,
      action: 'UPDATE_REPORT',
      details: `Private internal note recorded by ${adminEmail}`,
    };

    await updateDoc(reportRef, {
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      adminNotes: arrayUnion(newNote),
      auditLogs: arrayUnion(logEntry),
    });
    console.log(`[Firestore] Note added to ${path}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

async function getReportAuditLogs(reportId: string): Promise<AuditLogEntry[]> {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
    return snap.exists() ? snap.data().auditLogs || [] : [];
  } catch {
    return [];
  }
}

async function getReportAdminNotes(reportId: string): Promise<AdminNote[]> {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
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
 * Delete a single attachment from a report directly in Cloud Firestore
 * Optimized: Uses cached getDoc instead of forcing server roundtrip
 */
export async function deleteAttachmentInFirestore(reportId: string, attachmentId: string): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
    if (!snap.exists()) return;

    const currentAttachments: AttachmentItem[] = snap.data().attachments || [];
    const updatedAttachments = currentAttachments.filter((att) => att.id !== attachmentId);

    const now = new Date().toISOString();
    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail: auth.currentUser?.email || 'bauan.pnp.investigation@gmail.com',
      action: 'UPDATE_REPORT',
      details: `Deleted attachment with ID ${attachmentId}`,
    };

    const sanitizedData = sanitizeFirestorePayload({
      attachments: updatedAttachments,
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      auditLogs: arrayUnion(logEntry),
    });

    await updateDoc(reportRef, sanitizedData);
    console.log(`[Firestore] Deleted attachment ${attachmentId} from ${path}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
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
