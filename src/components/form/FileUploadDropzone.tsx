import React, { useState, useRef, useEffect } from 'react';
import { AttachmentItem } from '../../types/reports';
import { uploadToCloudinary, buildClientCloudinaryFolder } from '../../services/cloudinary';
import {
  UploadCloud,
  File as FileIcon,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle,
  Cloud,
  Loader2,
  Camera,
  RefreshCw,
  FolderCheck,
} from 'lucide-react';

interface FileUploadDropzoneProps {
  attachments: AttachmentItem[];
  onChange: (attachments: AttachmentItem[]) => void;
  reportType?: string;
  referenceNumber?: string;
  clientName?: string;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = '.jpg, .jpeg, .png, .webp, .pdf';

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  attachments,
  onChange,
  reportType = 'personal-intake',
  referenceNumber,
  clientName,
  maxFiles = 5,
  maxSizeMB = 10,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');

  // Live Camera Capture State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  const clientFolder = buildClientCloudinaryFolder(reportType, referenceNumber, clientName);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startLiveCamera = async (preferredFacing: 'environment' | 'user' = facingMode) => {
    setErrorMsg(null);
    if (attachments.length >= maxFiles) {
      setErrorMsg(`Maximum ${maxFiles} attachments allowed.`);
      return;
    }

    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback to native mobile camera input
      mobileCameraInputRef.current?.click();
      return;
    }

    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: preferredFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraReady(true);
      }
    } catch (err) {
      console.warn('WebRTC camera unavailable, falling back to native camera capture:', err);
      setIsCameraOpen(false);
      stopCameraStream();
      mobileCameraInputRef.current?.click();
    }
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
  };

  const handleSnapLivePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setErrorMsg('Failed to capture photo from camera. Please try again.');
          return;
        }
        const timestamp = Date.now();
        const capturedFile = new window.File([blob], `Live_ID_Capture_${timestamp}.jpg`, {
          type: 'image/jpeg',
        });
        handleCloseCamera();
        await processFiles([capturedFile], 'live_capture');
      },
      'image/jpeg',
      0.92
    );
  };

  const processFiles = async (
    files: FileList | File[],
    sourceType: 'upload' | 'live_capture' = 'upload'
  ) => {
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
      if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        setErrorMsg(`Unsupported file type: ${file.name}. Only JPEG, PNG, WEBP, and PDF files are allowed.`);
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

      setUploadStatusText(
        sourceType === 'live_capture'
          ? `Saving live captured photo to client's Cloudinary folder...`
          : `Uploading ${file.name} to client's Cloudinary folder...`
      );

      try {
        const cloudinaryResult = await uploadToCloudinary(file, {
          reportType,
          referenceNumber: referenceNumber || `CLIENT_${Date.now()}`,
          clientName,
        });

        newItems.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'image/jpeg',
          url: cloudinaryResult.secure_url,
          previewUrl: cloudinaryResult.secure_url,
          cloudinaryFolder: cloudinaryResult.folder || clientFolder,
          publicId: cloudinaryResult.public_id,
          sourceType,
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

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, source: 'upload' | 'live_capture' = 'upload') => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files, source);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, 'upload');
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
      {/* Dedicated Per-Client Cloudinary Folder Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-600 bg-blue-50/70 px-3.5 py-2 rounded-xl border border-blue-200/80">
        <span className="flex items-center gap-1.5 font-bold text-blue-950">
          <FolderCheck className="w-4 h-4 text-blue-700 shrink-0" />
          <span>Dedicated Client Cloudinary Folder (Isolated per Client):</span>
        </span>
        <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 truncate">
          {clientFolder}
        </span>
      </div>

      {/* Hidden Fallback Mobile Camera Input */}
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileInput(e, 'live_capture')}
        className="hidden"
        disabled={isUploading}
      />

      {/* Live WebRTC Camera Viewfinder Modal/Box */}
      {isCameraOpen && (
        <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border-2 border-blue-500 shadow-xl space-y-4 text-white animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                Live Camera Capture (Kuhanan ng Valid ID / Larawan)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer"
                title="Flip Camera (Front / Back)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flip Camera</span>
              </button>
              <button
                type="button"
                onClick={handleCloseCamera}
                className="p-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Isara ang Camera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-80 mx-auto flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-xs text-slate-300 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span>Binubuksan ang camera... (Initializing Camera)</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSnapLivePhoto}
              disabled={!cameraReady}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-lg cursor-pointer transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>CAPTURE PHOTO NOW (Kuhanan Ngayon)</span>
            </button>
            <button
              type="button"
              onClick={handleCloseCamera}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel (Kanselahin)
            </button>
          </div>
        </div>
      )}

      {/* Drop & Action Area */}
      {!isCameraOpen && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition-all ${
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
              <p className="text-xs font-bold text-blue-950">
                {uploadStatusText || 'Saving photo to dedicated client Cloudinary folder...'}
              </p>
              <p className="text-[11px] font-mono text-slate-500">{clientFolder}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 shadow-xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
              </div>

              <p className="text-sm font-extrabold text-slate-900">
                Optional: Take a Live Photo or Upload Valid ID / Photo
              </p>
              <p className="text-xs font-semibold text-blue-900 mt-0.5">
                (Opsyonal: Kuhanan ng Larawan Ngayon [Live Capture] o Mag-upload ng ID)
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5 max-w-lg mx-auto">
                Kung walang naka-save na ID sa telepono, maaaring gamitin ang <strong>Live Camera Capture</strong> o mag-upload mula sa Gallery. Awtomatikong ise-save sa sariling Cloudinary folder ng kliyente.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* Option A: Live Camera Capture */}
                <button
                  type="button"
                  onClick={() => startLiveCamera('environment')}
                  disabled={isUploading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>Live Camera Capture (Kuhanan ng Larawan)</span>
                </button>

                {/* Option B: Upload Existing File */}
                <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-colors shadow-sm">
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload ID / Photo (Pumili ng File)</span>
                  <input
                    type="file"
                    multiple
                    accept={ALLOWED_EXTENSIONS}
                    onChange={(e) => handleFileInput(e, 'upload')}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Attached Client ID / Photos ({attachments.length}/{maxFiles})</span>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Stored in Client Cloudinary Folder</span>
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {item.previewUrl || item.url ? (
                    <img
                      src={item.previewUrl || item.url}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg bg-slate-100 shrink-0 border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200">
                      {(item.type || '').includes('pdf') ? (
                        <FileIcon className="w-6 h-6 text-rose-600" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  )}
                  <div className="overflow-hidden space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          item.sourceType === 'live_capture'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.sourceType === 'live_capture' ? 'LIVE CAPTURE' : 'UPLOADED'}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatFileSize(item.size)}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate" title={item.cloudinaryFolder || clientFolder}>
                      <Cloud className="w-3 h-3 inline mr-1 text-blue-600" />
                      {item.cloudinaryFolder || clientFolder}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  title="Alisin ang larawan (Remove photo)"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
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
