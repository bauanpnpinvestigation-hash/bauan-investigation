/**
 * Cloudinary Upload Service
 * Automatically uploads ID / evidence photos to Cloudinary with:
 * - Dedicated folder hierarchy per individual client: bauan_mps_clients/${reportType}/${referenceNumber}_${clientName}
 * - Timestamped file names: ${cleanFileName}_${timestamp}
 */

export interface CloudinaryUploadOptions {
  reportType?: string;
  referenceNumber?: string;
  clientName?: string;
  tags?: string[];
}

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  folder: string;
  format: string;
  bytes: number;
}

// Default Cloudinary configuration (can be overridden via localStorage or env)
const DEFAULT_CLOUD_NAME = 'djv4xaqdu'; // Standard demo/public sandbox or user-configured
const DEFAULT_UPLOAD_PRESET = 'police_evidence_intake';

export function getCloudinaryConfig() {
  if (typeof window !== 'undefined') {
    const customCloudName = localStorage.getItem('pnp_cloudinary_cloud_name');
    const customPreset = localStorage.getItem('pnp_cloudinary_preset');
    return {
      cloudName: customCloudName || (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUD_NAME,
      uploadPreset: customPreset || (import.meta as any).env?.VITE_CLOUDINARY_PRESET || DEFAULT_UPLOAD_PRESET,
    };
  }
  return {
    cloudName: DEFAULT_CLOUD_NAME,
    uploadPreset: DEFAULT_UPLOAD_PRESET,
  };
}

export function saveCloudinaryConfig(cloudName: string, uploadPreset: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pnp_cloudinary_cloud_name', cloudName.trim());
    localStorage.setItem('pnp_cloudinary_preset', uploadPreset.trim());
  }
}

/**
 * Builds the sanitized, isolated Cloudinary folder path for a specific client so files never mix.
 */
export function buildClientCloudinaryFolder(
  reportType?: string,
  referenceNumber?: string,
  clientName?: string
): string {
  const cleanReportType = String(reportType || 'personal-intake').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanRef = String(referenceNumber || 'UNASSIGNED_REF').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanClientName = String(clientName || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const clientFolderName = cleanClientName ? `${cleanRef}_${cleanClientName}` : cleanRef;
  return `bauan_mps_clients/${cleanReportType}/${clientFolderName}`;
}

/**
 * Uploads a single file to Cloudinary with a client-specific dedicated folder and timestamped name.
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const timestamp = Date.now();
  const reportCategory = options.reportType || 'personal-intake';
  const incidentRef = options.referenceNumber || `CLIENT_${timestamp}`;
  const targetFolder = buildClientCloudinaryFolder(reportCategory, incidentRef, options.clientName);

  try {
    // 1. Request secure signed upload configurations from our backend API
    const startResp = await fetch('/api/upload/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        filetype: file.type,
        referenceNumber: incidentRef,
        reportType: reportCategory,
        clientName: options.clientName || '',
      }),
    });

    if (!startResp.ok) {
      throw new Error(`Signature endpoint returned status ${startResp.status}`);
    }

    const signedData = await startResp.json();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', signedData.timestamp.toString());
    formData.append('folder', signedData.folder || targetFolder);
    formData.append('public_id', signedData.publicId);

    // If signed uploads are supported (secret is configured on backend), send signature & apiKey
    if (signedData.signature) {
      formData.append('api_key', signedData.apiKey);
      formData.append('signature', signedData.signature);
    } else {
      // Fallback to local config / preset if backend signature is not generated
      const { uploadPreset } = getCloudinaryConfig();
      formData.append('upload_preset', uploadPreset);
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${signedData.cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      console.warn('Cloudinary upload returned status', response.status, errJson);
      return await createLocalFallbackResult(file, signedData.folder || targetFolder, signedData.publicId);
    }

    const data = await response.json();
    return {
      url: data.url,
      secure_url: data.secure_url,
      public_id: data.public_id,
      folder: signedData.folder || targetFolder,
      format: data.format,
      bytes: data.bytes,
    };
  } catch (networkErr) {
    console.warn('Secure Cloudinary upload failed, falling back to local data URL:', networkErr);
    return await createLocalFallbackResult(file, targetFolder, `file_${timestamp}`);
  }
}

/**
 * Downloads an attachment (Cloudinary URL or Base64 Data URL) directly to the admin's device.
 */
export async function downloadAttachmentFile(fileUrl: string, fileName: string): Promise<void> {
  if (!fileUrl) return;
  const safeName = (fileName || `client_photo_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');

  // 1. If it's a base64 data URL, trigger direct download immediately
  if (fileUrl.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. If it's a remote URL (e.g. Cloudinary), fetch as Blob to force browser download with custom filename
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch {
    // 3. Fallback: use Cloudinary fl_attachment transformation if applicable, or direct anchor download
    let downloadHref = fileUrl;
    if (fileUrl.includes('res.cloudinary.com') && fileUrl.includes('/upload/')) {
      downloadHref = fileUrl.replace('/upload/', `/upload/fl_attachment:${encodeURIComponent(safeName.replace(/\.[^/.]+$/, ''))}/`);
    }
    const link = document.createElement('a');
    link.href = downloadHref;
    link.download = safeName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

async function createLocalFallbackResult(
  file: File,
  folder: string,
  public_id: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      resolve({
        url: resultStr,
        secure_url: resultStr,
        public_id: `${folder}/${public_id}`,
        folder: folder,
        format: file.type.split('/')[1] || 'jpg',
        bytes: file.size,
      });
    };
    reader.readAsDataURL(file);
  });
}
