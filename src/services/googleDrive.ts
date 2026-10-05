import { getGoogleDriveAccessToken } from './firebase';

export interface DriveCategory {
  id: string;
  name: string;
  code: string;
  folderName: string;
  description: string;
  iconName: string;
  colorClass: string;
  badgeBg: string;
}

export const DRIVE_CLASSIFICATIONS: DriveCategory[] = [
  {
    id: 'sworn-statement',
    name: 'Sworn Statements & Affidavits',
    code: 'SS-AFF',
    folderName: '01 - Sworn Statements & Affidavits',
    description: 'Sinumpaang Salaysay, affidavits of witness/complainant/victim (.docx, .pdf)',
    iconName: 'FileText',
    colorClass: 'text-blue-600',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'spot-report',
    name: 'Spot Reports & Blotter Excerpts',
    code: 'SR-BLOT',
    folderName: '02 - Spot Reports & Blotter Excerpts',
    description: 'Initial spot reports, CIRAC blotter extracts, incident alerts (.pdf, .docx)',
    iconName: 'FileAlert',
    colorClass: 'text-amber-600',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'investigation-report',
    name: 'Investigation & Progress Reports',
    code: 'INV-PROG',
    folderName: '03 - Investigation & Progress Reports',
    description: 'Final investigation reports, progress memoranda, case build-up (.docx, .pdf)',
    iconName: 'FolderKanban',
    colorClass: 'text-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'medico-legal',
    name: 'Medico-Legal & Autopsy Records',
    code: 'MED-LEGAL',
    folderName: '04 - Medico-Legal & Autopsy Records',
    description: 'Hospital certificates, autopsy findings, toxicological & forensic results (.pdf, .jpg)',
    iconName: 'Activity',
    colorClass: 'text-rose-600',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'court-orders',
    name: 'Court Warrants & Subpoenas',
    code: 'CRT-WRNT',
    folderName: '05 - Court Warrants & Subpoenas',
    description: 'Search warrants, arrest warrants, subpoena ad testificandum, court orders (.pdf)',
    iconName: 'Scale',
    colorClass: 'text-purple-600',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'photo-cctv-evidence',
    name: 'Photographic & Digital Evidence',
    code: 'PHOTO-CCTV',
    folderName: '06 - Photographic & Digital Evidence',
    description: 'Crime scene photographs, CCTV footage captures, forensic device exports (.jpg, .png, .mp4, .pdf)',
    iconName: 'Camera',
    colorClass: 'text-cyan-600',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    id: 'traffic-accident',
    name: 'Traffic Accident Reports (TAR)',
    code: 'TAR-VEH',
    folderName: '07 - Traffic Accident Reports (TAR)',
    description: 'Vehicular collision investigation reports, sketch diagrams, driver affidavits (.pdf, .docx)',
    iconName: 'Car',
    colorClass: 'text-orange-600',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    id: 'general-documents',
    name: 'General Police Case Files',
    code: 'GEN-DOC',
    folderName: '08 - General Case Files & Documents',
    description: 'General correspondence, receipts, endorsements, memos & miscellaneous files (.docx, .pdf, .xlsx)',
    iconName: 'Folder',
    colorClass: 'text-slate-600',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
  },
];

export interface DriveRecordFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  description?: string;
  properties?: {
    category?: string;
    categoryCode?: string;
    incidentRef?: string;
    incidentTitle?: string;
    officerEmail?: string;
    notes?: string;
  };
  parents?: string[];
}

const ROOT_FOLDER_NAME = '[PNP Bauan MPS] Investigation & Evidence Records';

// Memory cache for folder IDs to prevent redundant folder queries
const folderIdCache = new Map<string, string>();

/**
 * Find or create a folder in Google Drive
 */
export async function getOrCreateDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  const cacheKey = `${parentFolderId || 'root'}_${folderName}`;
  if (folderIdCache.has(cacheKey)) {
    return folderIdCache.get(cacheKey)!;
  }

  // Search if folder already exists
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  const searchResp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchResp.ok) {
    const errText = await searchResp.text();
    console.error('[Google Drive Folder Search Error]', errText);
    throw new Error(`Failed to query Google Drive folder: ${searchResp.statusText}`);
  }

  const searchData = await searchResp.json();
  if (searchData.files && searchData.files.length > 0) {
    const existingId = searchData.files[0].id;
    folderIdCache.set(cacheKey, existingId);
    return existingId;
  }

  // Create folder
  const metadata: Record<string, any> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createResp = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createResp.ok) {
    const errText = await createResp.text();
    console.error('[Google Drive Folder Creation Error]', errText);
    throw new Error(`Failed to create Google Drive folder: ${createResp.statusText}`);
  }

  const newFolder = await createResp.json();
  folderIdCache.set(cacheKey, newFolder.id);
  return newFolder.id;
}

/**
 * Get the Root PNP Bauan MPS Folder
 */
export async function getRootDriveFolder(accessToken: string): Promise<string> {
  return getOrCreateDriveFolder(accessToken, ROOT_FOLDER_NAME);
}

/**
 * Get or create Category specific subfolder
 */
export async function getCategoryDriveFolder(
  accessToken: string,
  categoryId: string
): Promise<string> {
  const rootId = await getRootDriveFolder(accessToken);
  const cat = DRIVE_CLASSIFICATIONS.find((c) => c.id === categoryId) || DRIVE_CLASSIFICATIONS[7];
  return getOrCreateDriveFolder(accessToken, cat.folderName, rootId);
}

/**
 * Upload any file (Word, PDF, Images, Excel, etc.) to Google Drive with Incident metadata
 */
export interface UploadDriveParams {
  file: File;
  categoryId: string;
  incidentRef?: string;
  incidentTitle?: string;
  notes?: string;
  officerEmail?: string;
  onProgress?: (percent: number) => void;
}

export async function uploadFileToGoogleDrive({
  file,
  categoryId,
  incidentRef = '',
  incidentTitle = '',
  notes = '',
  officerEmail = 'bauan.pnp.investigation@gmail.com',
  onProgress,
}: UploadDriveParams): Promise<DriveRecordFile> {
  const accessToken = getGoogleDriveAccessToken();
  if (!accessToken) {
    throw new Error('Google Drive access is not authorized. Please connect with your Google Account first.');
  }

  // 1. Locate category folder in Google Drive
  const categoryFolderId = await getCategoryDriveFolder(accessToken, categoryId);
  const cat = DRIVE_CLASSIFICATIONS.find((c) => c.id === categoryId) || DRIVE_CLASSIFICATIONS[7];

  // 2. Prepare file name (Prefix with Incident Reference if provided)
  const safeRef = incidentRef.trim();
  const baseFileName = file.name;
  const fileNameToSave = safeRef ? `[${safeRef}] ${baseFileName}` : baseFileName;

  // 3. Metadata for Google Drive v3
  const metadata = {
    name: fileNameToSave,
    parents: [categoryFolderId],
    description: `PNP Bauan MPS Case Evidence Record\nCategory: ${cat.name}\nRef: ${safeRef || 'N/A'}\nNotes: ${notes || 'No description'}\nUploaded by: ${officerEmail}`,
    properties: {
      category: categoryId,
      categoryCode: cat.code,
      incidentRef: safeRef,
      incidentTitle: incidentTitle.trim(),
      officerEmail: officerEmail.trim(),
      notes: notes.trim(),
    },
  };

  // 4. Multipart upload boundary construction
  const boundary = `-------BauanMPSDriveBoundary${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileData = await file.arrayBuffer();
  const contentType = file.type || 'application/octet-stream';

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaPartHeader = `${delimiter}Content-Type: ${contentType}\r\n\r\n`;

  // Concatenate parts as Blob
  const multipartBlob = new Blob([
    metadataPart,
    mediaPartHeader,
    fileData,
    closeDelimiter,
  ], { type: `multipart/related; boundary=${boundary}` });

  if (onProgress) onProgress(30);

  const uploadResp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink,description,properties,parents',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBlob,
    }
  );

  if (onProgress) onProgress(100);

  if (!uploadResp.ok) {
    const errText = await uploadResp.text();
    console.error('[Google Drive Upload Error]', errText);
    throw new Error(`Google Drive upload failed: ${uploadResp.statusText} (${errText})`);
  }

  const uploadedData: DriveRecordFile = await uploadResp.json();
  return uploadedData;
}

/**
 * List classified files from Google Drive
 */
export interface ListDriveFilesParams {
  categoryId?: string;
  incidentRef?: string;
  searchQuery?: string;
  pageSize?: number;
}

export async function listGoogleDriveFiles({
  categoryId = 'ALL',
  incidentRef,
  searchQuery = '',
  pageSize = 100,
}: ListDriveFilesParams = {}): Promise<DriveRecordFile[]> {
  const accessToken = getGoogleDriveAccessToken();
  if (!accessToken) {
    return [];
  }

  try {
    // Only search non-folder files that are not in trash
    const queryParts: string[] = ["mimeType != 'application/vnd.google-apps.folder'", 'trashed = false'];

    // Search query
    if (searchQuery.trim()) {
      const escaped = searchQuery.trim().replace(/'/g, "\\'");
      queryParts.push(`(name contains '${escaped}' or fullText contains '${escaped}')`);
    }

    if (incidentRef && incidentRef.trim()) {
      const escapedRef = incidentRef.trim().replace(/'/g, "\\'");
      queryParts.push(`(name contains '${escapedRef}' or properties has { key='incidentRef' and value='${escapedRef}' })`);
    }

    const q = queryParts.join(' and ');
    const fields = 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink,description,properties,parents)';

    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=${pageSize}&orderBy=modifiedTime desc&fields=${encodeURIComponent(fields)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.warn('[Google Drive List Files Warning]', errText);
      return [];
    }

    const data = await resp.json();
    let files: DriveRecordFile[] = data.files || [];

    // Filter by category if specified
    if (categoryId && categoryId !== 'ALL') {
      files = files.filter((f) => {
        return f.properties?.category === categoryId;
      });
    }

    return files;
  } catch (err) {
    console.error('[Google Drive Fetch Error]', err);
    return [];
  }
}

/**
 * Delete a file permanently from Google Drive (Mandatory user confirmation dialog in UI required)
 */
export async function deleteFileFromGoogleDrive(fileId: string): Promise<void> {
  const accessToken = getGoogleDriveAccessToken();
  if (!accessToken) {
    throw new Error('Google Drive access is not authorized.');
  }

  const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!resp.ok && resp.status !== 404) {
    const errText = await resp.text();
    throw new Error(`Failed to delete Google Drive file: ${resp.statusText} (${errText})`);
  }
}

/**
 * Helper to determine file type label and icon
 */
export function getFileTypeBadge(mimeType: string, fileName: string): { label: string; bg: string; text: string; icon: string } {
  const lowerName = fileName.toLowerCase();

  if (
    mimeType.includes('word') ||
    mimeType.includes('officedocument.wordprocessingml') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc')
  ) {
    return { label: 'WORD DOC', bg: 'bg-blue-600', text: 'text-white', icon: 'FileText' };
  }

  if (mimeType.includes('pdf') || lowerName.endsWith('.pdf')) {
    return { label: 'PDF DOCUMENT', bg: 'bg-rose-600', text: 'text-white', icon: 'FileText' };
  }

  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.csv')
  ) {
    return { label: 'SPREADSHEET', bg: 'bg-emerald-600', text: 'text-white', icon: 'Table' };
  }

  if (mimeType.startsWith('image/') || lowerName.match(/\.(png|jpg|jpeg|webp|gif)$/)) {
    return { label: 'IMAGE / PHOTO', bg: 'bg-cyan-600', text: 'text-white', icon: 'Image' };
  }

  if (mimeType.startsWith('video/') || lowerName.match(/\.(mp4|mov|avi|mkv)$/)) {
    return { label: 'CCTV / VIDEO', bg: 'bg-purple-600', text: 'text-white', icon: 'Film' };
  }

  return { label: 'DOCUMENT', bg: 'bg-slate-700', text: 'text-white', icon: 'File' };
}

/**
 * Format bytes into human readable size
 */
export function formatFileSize(bytes?: string | number): string {
  if (!bytes) return 'Unknown size';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
