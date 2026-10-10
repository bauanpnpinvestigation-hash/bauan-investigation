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
import {
  ReportSubmission,
  ReportStatus,
  AdminNote,
  AuditLogEntry,
  AttachmentItem,
  MergedPartyRecord,
  PersonalInformation,
} from '../types/reports';

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

// Helper: Normalize array fields in case Firestore document contains serialized FieldValue or object map
export function normalizeFirestoreArray<T = any>(val: T[] | any): T[] {
  if (Array.isArray(val)) {
    return val;
  }
  if (val && typeof val === 'object') {
    if (Array.isArray(val._elements)) {
      return val._elements as T[];
    }
    const values = Object.values(val).filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        ('id' in item || 'timestamp' in item || 'name' in item || 'text' in item)
    );
    if (values.length > 0) {
      return values as T[];
    }
  }
  return [];
}

// Helper: Sanitize payload to prevent Firestore "unsupported undefined value" or "nested array" errors
// Preserves Firestore FieldValue instances (serverTimestamp, arrayUnion, etc.)
export function sanitizeFirestorePayload<T>(obj: T, insideArray: boolean = false): T {
  if (obj === undefined) {
    return null as unknown as T;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    // Firestore forbids arrays directly inside arrays — flatten if ever encountered
    const flattened = insideArray ? obj.flat(Infinity) : obj;
    return flattened
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestorePayload(item, true)) as unknown as T;
  }
  // Preserve Firestore FieldValue / Timestamp / Date / custom class instances
  if (
    obj instanceof Date ||
    typeof (obj as any)?._methodName === 'string' ||
    ((obj as any).constructor && (obj as any).constructor !== Object)
  ) {
    return obj;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      // Never allow nested arrays inside objects that are themselves inside an array (e.g., mergedParties)
      if (insideArray && Array.isArray(value)) {
        continue;
      }
      clean[key] = sanitizeFirestorePayload(value, insideArray);
    }
  }
  return clean as T;
}

/**
 * Guarantees a MergedPartyRecord is 100% flat (no nested arrays, no undefined values)
 * so Firestore never throws a nested-entity or invalid-data error.
 */
export function sanitizeMergedPartyForFirestore(party: MergedPartyRecord): MergedPartyRecord {
  const pi = party.personalInformation || ({} as PersonalInformation);
  const flatPersonalInfo: PersonalInformation = {
    firstName: String(pi.firstName || '').trim(),
    middleName: String(pi.middleName || '').trim(),
    lastName: String(pi.lastName || '').trim(),
    suffix: String(pi.suffix || '').trim(),
    birthday: String(pi.birthday || '').trim(),
    age: pi.age !== null && pi.age !== undefined && !isNaN(Number(pi.age)) ? Number(pi.age) : null,
    sex: (pi.sex || '') as any,
    civilStatus: (pi.civilStatus || '') as any,
    occupation: String(pi.occupation || '').trim(),
    nationality: String(pi.nationality || 'Filipino').trim(),
    address: String(pi.address || '').trim(),
    contactNumber: String(pi.contactNumber || '').trim(),
  };

  const rawReportData = party.reportData || {};
  const flatReportData: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawReportData)) {
    if (v !== undefined && v !== null && !Array.isArray(v) && typeof v !== 'object') {
      flatReportData[k] = String(v);
    }
  }

  return {
    id: String(party.id || `party_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
    referenceNumber: String(party.referenceNumber || ''),
    reportType: party.reportType || 'personal-intake',
    partyLabel: String(party.partyLabel || 'Merged Client Record'),
    createdAt: String(party.createdAt || new Date().toISOString()),
    mergedAt: String(party.mergedAt || new Date().toISOString()),
    personalInformation: flatPersonalInfo,
    reportData: flatReportData,
  };
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
          mergedParties: normalizeFirestoreArray<MergedPartyRecord>(data.mergedParties).map(
            sanitizeMergedPartyForFirestore
          ),
          isMergedFile: Boolean(
            data.isMergedFile ||
              d.id.startsWith('mrg_') ||
              String(data.referenceNumber || '').startsWith('MRG-')
          ),
          sourceReportIds: normalizeFirestoreArray<string>(data.sourceReportIds),
          sourceReferenceNumbers: normalizeFirestoreArray<string>(data.sourceReferenceNumbers),
          attachments: normalizeFirestoreArray<AttachmentItem>(data.attachments),
          adminNotes: normalizeFirestoreArray<AdminNote>(data.adminNotes),
          auditLogs: normalizeFirestoreArray<AuditLogEntry>(data.auditLogs),
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

    await updateDoc(reportRef, {
      reportData: sanitizeFirestorePayload(updatedData),
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      auditLogs: arrayUnion(logEntry),
    });
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
    return snap.exists() ? normalizeFirestoreArray<AuditLogEntry>(snap.data().auditLogs) : [];
  } catch {
    return [];
  }
}

async function getReportAdminNotes(reportId: string): Promise<AdminNote[]> {
  try {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
    return snap.exists() ? normalizeFirestoreArray<AdminNote>(snap.data().adminNotes) : [];
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

    const currentAttachments: AttachmentItem[] = normalizeFirestoreArray<AttachmentItem>(snap.data().attachments);
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

    await updateDoc(reportRef, {
      attachments: sanitizeFirestorePayload(updatedAttachments),
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      auditLogs: arrayUnion(logEntry),
    });
    console.log(`[Firestore] Deleted attachment ${attachmentId} from ${path}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Automatically heals any legacy in-place merged report (where `isMergedFile` was not set
 * and `mergedParties` were stored directly on the original file) by:
 * 1) Creating a dedicated Merged File (`mrg_...`, `MRG-...`, `isMergedFile: true`)
 * 2) Restoring all absorbed `mergedParties` back into standalone Original Files
 * 3) Restoring the primary document back into a pure standalone Original File
 */
const healedLegacyIds = new Set<string>();

export async function preserveOriginalFilesForLegacyMergesInFirestore(
  reports: ReportSubmission[]
): Promise<void> {
  try {
    const legacyMerged = reports.filter(
      (r) =>
        !r.isMergedFile &&
        !r.id.startsWith('mrg_') &&
        !String(r.referenceNumber || '').startsWith('MRG-') &&
        Array.isArray(r.mergedParties) &&
        r.mergedParties.length > 0 &&
        !healedLegacyIds.has(r.id)
    );

    if (legacyMerged.length === 0) return;

    const existingIds = new Set(reports.map((r) => r.id));
    const existingRefs = new Set(reports.map((r) => r.referenceNumber));
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    let hasWrites = false;

    for (const leg of legacyMerged) {
      healedLegacyIds.add(leg.id);
      const parties = normalizeFirestoreArray<MergedPartyRecord>(leg.mergedParties).map(
        sanitizeMergedPartyForFirestore
      );
      if (parties.length === 0) continue;

      const mergedDocId = `mrg_${leg.id}`;
      const suffixRefs = parties
        .map((p) => String(p.referenceNumber || '').replace(/^BAU-|^MRG-/i, '').slice(-4))
        .filter(Boolean)
        .join('-');
      const mergedRefNo = `MRG-${leg.referenceNumber.replace(/^BAU-|^MRG-/i, '')}${
        suffixRefs ? `-${suffixRefs}` : ''
      }`;

      if (!existingIds.has(mergedDocId)) {
        const mergedDocRef = doc(db, 'reports', mergedDocId);
        batch.set(
          mergedDocRef,
          sanitizeFirestorePayload({
            ...leg,
            id: mergedDocId,
            referenceNumber: mergedRefNo,
            isMergedFile: true,
            sourceReportIds: [leg.id, ...parties.map((p) => p.id)],
            sourceReferenceNumbers: [
              leg.referenceNumber,
              ...parties.map((p) => p.referenceNumber).filter(Boolean),
            ],
            mergedParties: parties,
            updatedAt: now,
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          })
        );
        hasWrites = true;
      }

      // Restore each absorbed party as its own standalone Original File if not already present
      for (const mp of parties) {
        const targetId = mp.id && mp.id.startsWith('rep_') ? mp.id : `rep_restored_${mp.id}`;
        if (!existingIds.has(targetId) && !existingRefs.has(mp.referenceNumber)) {
          const mpAttachments = normalizeFirestoreArray<AttachmentItem>(leg.attachments).filter(
            (a) => a.partyId === mp.id || a.partyReferenceNumber === mp.referenceNumber
          );
          const restoredOrig: ReportSubmission = {
            id: targetId,
            referenceNumber: mp.referenceNumber || `BAU-${Date.now().toString(36).toUpperCase()}`,
            reportType: mp.reportType || leg.reportType || 'personal-intake',
            status: leg.status || 'NEW',
            createdAt: mp.createdAt || leg.createdAt || now,
            updatedAt: now,
            personalInformation: mp.personalInformation,
            reportData: mp.reportData || {},
            mergedParties: [],
            isMergedFile: false,
            attachments: mpAttachments,
            adminNotes: [],
            auditLogs: [
              {
                id: `log_${Date.now()}_orig`,
                timestamp: now,
                adminUserId: auth.currentUser?.uid || 'OFFICER_01',
                adminEmail: auth.currentUser?.email || AUTHORIZED_ADMIN_EMAIL,
                action: 'UPDATE_REPORT',
                details: `Original standalone file preserved alongside Merged File #${mergedRefNo}`,
              },
            ],
            stationOffice: leg.stationOffice || 'Investigation & Records Section',
          };
          batch.set(
            doc(db, 'reports', targetId),
            sanitizeFirestorePayload({
              ...restoredOrig,
              serverCreatedAt: serverTimestamp(),
              serverUpdatedAt: serverTimestamp(),
            })
          );
          existingIds.add(targetId);
          if (mp.referenceNumber) existingRefs.add(mp.referenceNumber);
          hasWrites = true;
        }
      }

      // Restore primary document back to pure standalone Original File
      const primaryOnlyAttachments = normalizeFirestoreArray<AttachmentItem>(
        leg.attachments
      ).filter(
        (a) =>
          !a.partyId ||
          a.partyId === 'PRIMARY' ||
          a.partyId === leg.id ||
          a.partyReferenceNumber === leg.referenceNumber
      );

      batch.update(doc(db, 'reports', leg.id), {
        mergedParties: [],
        isMergedFile: false,
        attachments: sanitizeFirestorePayload(primaryOnlyAttachments),
        updatedAt: now,
        serverUpdatedAt: serverTimestamp(),
      });
      hasWrites = true;
    }

    if (hasWrites) {
      await batch.commit();
      console.log('[Firestore] Preserved all original files and separated Merged File records.');
    }
  } catch (err) {
    console.warn('[Firestore] Legacy merge preservation check notice:', err);
  }
}

/**
 * Full Conflict-Free Document Merge (Preserving All Original Files):
 * - All original submitted client files ALWAYS remain intact as standalone Original Files.
 * - If `primaryReportId` is an Original File, creates a brand-new Merged File (`isMergedFile: true`, `MRG-...`)
 *   containing Party 1 (from `primaryReportId`) + Party 2, Party 3... (from `secondaryReportIds`).
 * - If `primaryReportId` is ALREADY a Merged File (`isMergedFile: true`), appends the selected
 *   records as additional parties to that Merged File while keeping all original files untouched.
 */
export async function mergeReportsIntoSingleFileInFirestore(
  primaryReportId: string,
  secondaryReportIds: string[],
  _deleteMergedOriginals: boolean,
  adminEmail: string
): Promise<ReportSubmission | null> {
  const path = `reports/${primaryReportId}`;
  try {
    const cleanSecondaryIds = Array.from(new Set(secondaryReportIds)).filter(
      (id) => id && id !== primaryReportId
    );
    if (cleanSecondaryIds.length === 0) return null;

    const primaryRef = doc(db, 'reports', primaryReportId);
    const primarySnap = await getDoc(primaryRef);
    if (!primarySnap.exists()) {
      throw new Error('Primary report record not found in Firestore.');
    }

    const primaryData = primarySnap.data();
    const isAlreadyMergedDoc = Boolean(
      primaryData.isMergedFile ||
        primaryReportId.startsWith('mrg_') ||
        String(primaryData.referenceNumber || '').startsWith('MRG-')
    );

    const now = new Date().toISOString();
    const primaryPi = primaryData.personalInformation || {};
    const primaryFullName =
      [primaryPi.firstName, primaryPi.middleName, primaryPi.lastName].filter(Boolean).join(' ') ||
      'Primary Client';

    // Tag existing primary attachments if not yet tagged
    const combinedAttachments: AttachmentItem[] = normalizeFirestoreArray<AttachmentItem>(
      primaryData.attachments
    ).map((att) => ({
      ...att,
      partyId: att.partyId || 'PRIMARY',
      partyLabel: att.partyLabel || `Party 1 (Primary): ${primaryFullName}`,
      partyReferenceNumber: att.partyReferenceNumber || primaryData.referenceNumber || '',
    }));

    const existingAttachmentIds = new Set(combinedAttachments.map((a) => a.id));

    const combinedMergedParties: MergedPartyRecord[] = normalizeFirestoreArray<MergedPartyRecord>(
      primaryData.mergedParties
    ).map(sanitizeMergedPartyForFirestore);
    const existingPartyIds = new Set(combinedMergedParties.map((p) => p.id));

    const combinedNotes: AdminNote[] = normalizeFirestoreArray<AdminNote>(primaryData.adminNotes);
    const existingNoteIds = new Set(combinedNotes.map((n) => n.id));

    const combinedAuditLogs: AuditLogEntry[] = normalizeFirestoreArray<AuditLogEntry>(
      primaryData.auditLogs
    );

    const sourceReportIds = new Set<string>(
      normalizeFirestoreArray<string>(primaryData.sourceReportIds)
    );
    const sourceReferenceNumbers = new Set<string>(
      normalizeFirestoreArray<string>(primaryData.sourceReferenceNumbers)
    );

    if (!isAlreadyMergedDoc) {
      sourceReportIds.add(primaryReportId);
      if (primaryData.referenceNumber) {
        sourceReferenceNumbers.add(primaryData.referenceNumber);
      }
    }

    const absorbedRefNumbers: string[] = [];
    const batch = writeBatch(db);

    for (const secId of cleanSecondaryIds) {
      const secRef = doc(db, 'reports', secId);
      const secSnap = await getDoc(secRef);
      if (!secSnap.exists()) continue;

      const secData = secSnap.data();
      const secPi = secData.personalInformation || {};
      const secFullName =
        [secPi.firstName, secPi.middleName, secPi.lastName].filter(Boolean).join(' ') ||
        'Merged Client';
      const secRefNo = secData.referenceNumber || secId;
      absorbedRefNumbers.push(secRefNo);
      sourceReportIds.add(secId);
      sourceReferenceNumbers.add(secRefNo);

      const partyIndex = combinedMergedParties.length + 2; // Party 2, Party 3, etc.
      const newPartyId = secData.id || secId;
      const partyLabel = `Party ${partyIndex}: ${secFullName} (${secRefNo})`;

      if (!existingPartyIds.has(newPartyId)) {
        combinedMergedParties.push(
          sanitizeMergedPartyForFirestore({
            id: newPartyId,
            referenceNumber: secRefNo,
            reportType: secData.reportType || 'personal-intake',
            partyLabel,
            createdAt: secData.createdAt || now,
            mergedAt: now,
            personalInformation: secPi,
            reportData: secData.reportData || {},
          })
        );
        existingPartyIds.add(newPartyId);
      }

      // If the secondary report itself had mergedParties, absorb them cleanly without nesting
      const nestedParties = normalizeFirestoreArray<MergedPartyRecord>(secData.mergedParties);
      for (const np of nestedParties) {
        if (!existingPartyIds.has(np.id)) {
          combinedMergedParties.push(
            sanitizeMergedPartyForFirestore({
              ...np,
              partyLabel:
                np.partyLabel ||
                `Party ${combinedMergedParties.length + 2}: ${
                  [np.personalInformation?.firstName, np.personalInformation?.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Merged Client'
                }`,
              mergedAt: now,
            })
          );
          existingPartyIds.add(np.id);
          sourceReportIds.add(np.id);
          if (np.referenceNumber) sourceReferenceNumbers.add(np.referenceNumber);
        }
      }

      // Copy all attachments from secondary report into top-level attachments array of the Merged File
      const secAttachments = normalizeFirestoreArray<AttachmentItem>(secData.attachments);
      for (const att of secAttachments) {
        const safeAttId = existingAttachmentIds.has(att.id)
          ? `${att.id}_${Math.random().toString(36).substring(2, 6)}`
          : att.id;
        combinedAttachments.push({
          ...att,
          id: safeAttId,
          partyId: att.partyId && att.partyId !== 'PRIMARY' ? att.partyId : newPartyId,
          partyLabel:
            att.partyLabel && !att.partyLabel.includes('Party 1') ? att.partyLabel : partyLabel,
          partyReferenceNumber: att.partyReferenceNumber || secRefNo,
        });
        existingAttachmentIds.add(safeAttId);
      }

      // Copy admin notes into Merged File
      const secNotes = normalizeFirestoreArray<AdminNote>(secData.adminNotes);
      for (const note of secNotes) {
        if (!existingNoteIds.has(note.id)) {
          combinedNotes.push({
            ...note,
            text: `[From #${secRefNo}] ${note.text}`,
          });
          existingNoteIds.add(note.id);
        }
      }
      // CRITICAL: Never delete `secRef`! Original files MUST remain intact as Original Files!
    }

    const finalSourceIds = Array.from(sourceReportIds);
    const finalSourceRefs = Array.from(sourceReferenceNumbers);

    // If primaryReportId is already a Merged File, update it in place
    if (isAlreadyMergedDoc) {
      const mergeLog: AuditLogEntry = {
        id: `log_${Date.now()}`,
        timestamp: now,
        adminUserId: auth.currentUser?.uid || 'OFFICER_01',
        adminEmail,
        action: 'UPDATE_REPORT',
        details: `Added ${absorbedRefNumbers.length} original client record(s) [${absorbedRefNumbers.join(
          ', '
        )}] into Merged File #${primaryData.referenceNumber} (all original files preserved)`,
      };
      combinedAuditLogs.push(mergeLog);

      const updatedPayload = sanitizeFirestorePayload({
        isMergedFile: true,
        sourceReportIds: finalSourceIds,
        sourceReferenceNumbers: finalSourceRefs,
        mergedParties: combinedMergedParties,
        attachments: combinedAttachments,
        adminNotes: combinedNotes,
        auditLogs: combinedAuditLogs,
        updatedAt: now,
        serverUpdatedAt: serverTimestamp(),
      });

      batch.update(primaryRef, updatedPayload);
      await batch.commit();

      return {
        id: primaryReportId,
        referenceNumber: primaryData.referenceNumber || '',
        reportType: primaryData.reportType || 'personal-intake',
        status: primaryData.status || 'NEW',
        createdAt: primaryData.createdAt || now,
        updatedAt: now,
        completedAt: primaryData.completedAt || null,
        archivedAt: primaryData.archivedAt || null,
        personalInformation: primaryData.personalInformation || {},
        reportData: primaryData.reportData || {},
        mergedParties: combinedMergedParties,
        isMergedFile: true,
        sourceReportIds: finalSourceIds,
        sourceReferenceNumbers: finalSourceRefs,
        attachments: combinedAttachments,
        adminNotes: combinedNotes,
        auditLogs: combinedAuditLogs,
        stationOffice: primaryData.stationOffice || 'Investigation & Records Section',
      };
    }

    // Otherwise, create a brand-new dedicated Merged File document while keeping all Original Files untouched!
    const newMergedId = `mrg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const primaryShort = String(primaryData.referenceNumber || '')
      .replace(/^BAU-|^MRG-/i, '')
      .trim();
    const secShorts = absorbedRefNumbers
      .map((r) => String(r).replace(/^BAU-|^MRG-/i, '').slice(-4))
      .filter(Boolean)
      .join('-');
    const newMergedRefNumber = `MRG-${primaryShort || Date.now().toString(36).toUpperCase()}${
      secShorts ? `-${secShorts}` : ''
    }`;

    const creationLog: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail,
      action: 'UPDATE_REPORT',
      details: `Created Merged File #${newMergedRefNumber} combining Original Files [${finalSourceRefs.join(
        ', '
      )}] by ${adminEmail}. All original files remain intact.`,
    };

    const newMergedReport: ReportSubmission = {
      id: newMergedId,
      referenceNumber: newMergedRefNumber,
      reportType: primaryData.reportType || 'vehicular-incident',
      status: primaryData.status || 'NEW',
      createdAt: now,
      updatedAt: now,
      completedAt: primaryData.completedAt || null,
      archivedAt: primaryData.archivedAt || null,
      personalInformation: primaryData.personalInformation || {},
      reportData: primaryData.reportData || {},
      mergedParties: combinedMergedParties,
      isMergedFile: true,
      sourceReportIds: finalSourceIds,
      sourceReferenceNumbers: finalSourceRefs,
      attachments: combinedAttachments,
      adminNotes: combinedNotes,
      auditLogs: [...combinedAuditLogs, creationLog],
      stationOffice: primaryData.stationOffice || 'Investigation & Records Section',
    };

    const newMergedRef = doc(db, 'reports', newMergedId);
    batch.set(
      newMergedRef,
      sanitizeFirestorePayload({
        ...newMergedReport,
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      })
    );

    await batch.commit();
    return newMergedReport;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return null;
  }
}

/**
 * Full Robust CRUD Update for a Report Record (Primary Personal Info, Report Data, Merged Parties, Attachments)
 */
export async function updateCompleteReportRecordInFirestore(
  reportId: string,
  updates: {
    personalInformation?: PersonalInformation;
    reportData?: Record<string, any>;
    mergedParties?: MergedPartyRecord[];
    attachments?: AttachmentItem[];
    reportType?: ReportSubmission['reportType'];
    stationOffice?: string;
  },
  adminEmail: string,
  auditDetails: string = 'Record details updated via full CRUD editor'
): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    const now = new Date().toISOString();
    const reportRef = doc(db, 'reports', reportId);

    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail,
      action: 'UPDATE_REPORT',
      details: `${auditDetails} by ${adminEmail}`,
    };

    const payload: Record<string, any> = {
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      auditLogs: arrayUnion(logEntry),
    };

    if (updates.personalInformation !== undefined) {
      payload.personalInformation = sanitizeFirestorePayload(updates.personalInformation);
    }
    if (updates.reportData !== undefined) {
      const cleanReportData: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates.reportData)) {
        if (v !== undefined && !Array.isArray(v)) {
          cleanReportData[k] = v;
        }
      }
      payload.reportData = sanitizeFirestorePayload(cleanReportData);
    }
    if (updates.mergedParties !== undefined) {
      payload.mergedParties = sanitizeFirestorePayload(
        updates.mergedParties.map(sanitizeMergedPartyForFirestore)
      );
    }
    if (updates.attachments !== undefined) {
      payload.attachments = sanitizeFirestorePayload(updates.attachments);
    }
    if (updates.reportType !== undefined) {
      payload.reportType = updates.reportType;
    }
    if (updates.stationOffice !== undefined) {
      payload.stationOffice = updates.stationOffice;
    }

    await updateDoc(reportRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Append newly uploaded / captured photos to a single or combined report file in Firestore without conflict
 */
export async function addAttachmentsToReportInFirestore(
  reportId: string,
  newAttachments: AttachmentItem[],
  adminEmail: string
): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    if (!newAttachments || newAttachments.length === 0) return;
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
    if (!snap.exists()) return;

    const currentAttachments = normalizeFirestoreArray<AttachmentItem>(snap.data().attachments);
    const existingIds = new Set(currentAttachments.map((a) => a.id));
    const mergedAttachments = [...currentAttachments];

    for (const att of newAttachments) {
      const safeId = existingIds.has(att.id)
        ? `${att.id}_${Math.random().toString(36).substring(2, 6)}`
        : att.id;
      mergedAttachments.push({
        ...att,
        id: safeId,
      });
      existingIds.add(safeId);
    }

    const now = new Date().toISOString();
    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail,
      action: 'UPDATE_REPORT',
      details: `Uploaded ${newAttachments.length} photo(s)/attachment(s) to record by ${adminEmail}`,
    };

    await updateDoc(reportRef, {
      attachments: sanitizeFirestorePayload(mergedAttachments),
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      auditLogs: arrayUnion(logEntry),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Unmerge / Split a MergedPartyRecord back out into its own standalone ReportSubmission document in Firestore
 */
export async function unmergePartyToStandaloneReportInFirestore(
  primaryReportId: string,
  partyId: string,
  adminEmail: string
): Promise<ReportSubmission | null> {
  const path = `reports/${primaryReportId}`;
  try {
    const primaryRef = doc(db, 'reports', primaryReportId);
    const snap = await getDoc(primaryRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    const currentParties = normalizeFirestoreArray<MergedPartyRecord>(data.mergedParties).map(
      sanitizeMergedPartyForFirestore
    );
    const targetParty = currentParties.find((p) => p.id === partyId);
    if (!targetParty) return null;

    const remainingParties = currentParties.filter((p) => p.id !== partyId);
    const allAttachments = normalizeFirestoreArray<AttachmentItem>(data.attachments);
    const partyAttachments = allAttachments.filter((a) => a.partyId === partyId);
    const remainingAttachments = allAttachments.filter((a) => a.partyId !== partyId);

    const now = new Date().toISOString();
    const standaloneId = targetParty.id.startsWith('rep_')
      ? targetParty.id
      : `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const restoredReport: ReportSubmission = {
      id: standaloneId,
      referenceNumber:
        targetParty.referenceNumber || `BAU-${Date.now().toString(36).toUpperCase()}`,
      reportType: targetParty.reportType || data.reportType || 'personal-intake',
      status: data.status || 'NEW',
      createdAt: targetParty.createdAt || now,
      updatedAt: now,
      personalInformation: targetParty.personalInformation,
      reportData: targetParty.reportData || {},
      mergedParties: [],
      attachments: partyAttachments,
      adminNotes: [],
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: now,
          adminUserId: auth.currentUser?.uid || 'OFFICER_01',
          adminEmail,
          action: 'UPDATE_REPORT',
          details: `Split/unmerged from combined file #${data.referenceNumber} into standalone file by ${adminEmail}`,
        },
      ],
      stationOffice: data.stationOffice || 'Investigation & Records Section',
    };

    const batch = writeBatch(db);
    const standaloneRef = doc(db, 'reports', standaloneId);
    batch.set(
      standaloneRef,
      sanitizeFirestorePayload({
        ...restoredReport,
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      })
    );

    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}_unmerge`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail,
      action: 'UPDATE_REPORT',
      details: `Unmerged party ${targetParty.partyLabel} (#${targetParty.referenceNumber}) into standalone record`,
    };

    batch.update(primaryRef, {
      mergedParties: sanitizeFirestorePayload(remainingParties),
      attachments: sanitizeFirestorePayload(remainingAttachments),
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      auditLogs: arrayUnion(logEntry),
    });

    await batch.commit();
    return restoredReport;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return null;
  }
}

/**
 * Delete a single internal AdminNote from a report in Firestore
 */
export async function deleteAdminNoteInFirestore(
  reportId: string,
  noteId: string,
  adminEmail: string
): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    const reportRef = doc(db, 'reports', reportId);
    const snap = await getDoc(reportRef);
    if (!snap.exists()) return;

    const currentNotes = normalizeFirestoreArray<AdminNote>(snap.data().adminNotes);
    const updatedNotes = currentNotes.filter((n) => n.id !== noteId);
    const now = new Date().toISOString();

    const logEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: now,
      adminUserId: auth.currentUser?.uid || 'OFFICER_01',
      adminEmail,
      action: 'UPDATE_REPORT',
      details: `Deleted internal admin note (${noteId}) by ${adminEmail}`,
    };

    await updateDoc(reportRef, {
      adminNotes: sanitizeFirestorePayload(updatedNotes),
      updatedAt: now,
      serverUpdatedAt: serverTimestamp(),
      auditLogs: arrayUnion(logEntry),
    });
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
