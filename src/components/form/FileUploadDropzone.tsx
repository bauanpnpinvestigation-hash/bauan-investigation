import React, { useState } from 'react';
import { AttachmentItem } from '../../types/reports';
import { uploadToCloudinary } from '../../services/cloudinary';
import { UploadCloud, File, Image as ImageIcon, X, AlertCircle, CheckCircle, Cloud, Loader2 } from 'lucide-react';

interface FileUploadDropzoneProps {
  attachments: AttachmentItem[];
  onChange: (attachments: AttachmentItem[]) => void;
  reportType?: string;
  referenceNumber?: string;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = '.jpg, .jpeg, .png, .webp, .pdf';

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  attachments,
  onChange,
  reportType = 'general_incident',
  referenceNumber,
  maxFiles = 5,
  maxSizeMB = 10,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');

  const processFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);

    if (attachments.length + files.length > maxFiles) {
      setErrorMsg(`Maximum ${maxFiles} attachments allowed.`);
      return;
    }

    setIsUploading(true);
    const newItems: AttachmentItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate Type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMsg(`Unsupported file type: ${file.name}. Only JPEG, PNG, and PDF files are allowed.`);
        setIsUploading(false);
        return;
      }

      // Validate Size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setErrorMsg(`File too large: ${file.name} exceeds ${maxSizeMB}MB limit.`);
        setIsUploading(false);
        return;
      }

      setUploadStatusText(`Uploading ${file.name} to Cloudinary...`);

      try {
        // Automatically save to Cloudinary with incident-specific folder and timestamped name
        const cloudinaryResult = await uploadToCloudinary(file, {
          reportType,
          referenceNumber: referenceNumber || `INTAKE_${Date.now()}`,
        });

        newItems.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: cloudinaryResult.secure_url,
          previewUrl: cloudinaryResult.secure_url,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Upload failed', err);
        setErrorMsg(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    setIsUploading(false);
    setUploadStatusText('');
    onChange([...attachments, ...newItems]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (id: string) => {
    onChange(attachments.filter((item) => item.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Cloudinary Integration Badge */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
        <span className="flex items-center gap-1.5 font-semibold text-blue-900">
          <Cloud className="w-3.5 h-3.5 text-blue-600" />
          <span>Cloudinary Cloud Storage: Auto-organized by Incident Type & Timestamp</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          Folder: incident_reports/{reportType}
        </span>
      </div>

      {/* Drop area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-7 text-center transition-all ${
          isDragging
            ? 'border-blue-600 bg-blue-50/60'
            : isUploading
            ? 'border-blue-400 bg-blue-50/20'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
        }`}
      >
        {isUploading ? (
          <div className="py-4 space-y-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-blue-950">{uploadStatusText || 'Saving photo to Cloudinary...'}</p>
            <p className="text-[11px] text-slate-500">Creating timestamped asset in incident folder</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-800 mb-3 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Upload Photos or Evidence (I-upload sa Cloudinary)
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Photos are automatically categorized into their own incident folder with custom timestamp.
              Supported: JPEG, PNG, PDF (Up to {maxSizeMB}MB each, max {maxFiles} files).
            </p>

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
                <span>Browse Files (Pumili ng File)</span>
                <input
                  type="file"
                  multiple
                  accept={ALLOWED_EXTENSIONS}
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Attached Cloudinary Photos ({attachments.length}/{maxFiles})</span>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <span>Saved in Cloud</span>
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded bg-slate-100 shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200">
                      {item.type.includes('pdf') ? (
                        <File className="w-5 h-5 text-rose-600" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatFileSize(item.size)} • Cloudinary Cloud URL
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  title="Remove attachment"
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
