/**
 * Cloudinary Upload Service
 * Automatically uploads evidence photos to Cloudinary with:
 * - Dedicated folder hierarchy based on incident type & reference: incident_reports/${reportType}/${incidentId}
 * - Timestamped file names: ${cleanFileName}_${timestamp}
 */

export interface CloudinaryUploadOptions {
  reportType?: string;
  referenceNumber?: string;
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
 * Uploads a single file to Cloudinary with incident-specific folder and timestamped name.
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const timestamp = Date.now();
  const reportCategory = options.reportType || 'general_incident';
  const incidentRef = options.referenceNumber || `DRAFT_${timestamp}`;
  const targetFolder = `incident_reports/${reportCategory}/${incidentRef}`;

  try {
    // 1. Request secure signed upload configurations from our backend API
    const startResp = await fetch('/api/upload/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        filetype: file.type,
        referenceNumber: incidentRef,
      })
    });

    if (!startResp.ok) {
      throw new Error(`Signature endpoint returned status ${startResp.status}`);
    }

    const signedData = await startResp.json();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', signedData.timestamp.toString());
    formData.append('folder', signedData.folder);
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
      return await createLocalFallbackResult(file, targetFolder, signedData.publicId);
    }

    const data = await response.json();
    return {
      url: data.url,
      secure_url: data.secure_url,
      public_id: data.public_id,
      folder: signedData.folder,
      format: data.format,
      bytes: data.bytes,
    };
  } catch (networkErr) {
    console.warn('Secure Cloudinary upload failed, falling back to local data URL:', networkErr);
    return await createLocalFallbackResult(file, targetFolder, `file_${timestamp}`);
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
