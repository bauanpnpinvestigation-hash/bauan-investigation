import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DRIVE_CLASSIFICATIONS, 
  DriveCategory, 
  DriveRecordFile, 
  listGoogleDriveFiles, 
  uploadFileToGoogleDrive, 
  deleteFileFromGoogleDrive, 
  getFileTypeBadge, 
  formatFileSize 
} from '../../services/googleDrive';
import { 
  getGoogleDriveAccessToken, 
  connectGoogleDriveAccount, 
  subscribeToGoogleDriveToken,
  AUTHORIZED_ADMIN_EMAIL 
} from '../../services/firebase';
import { ReportSubmission } from '../../types/reports';
import { useToast } from '../../context/ToastContext';
import { formatHumanDateTime } from '../../utils/dateUtils';
import { 
  FolderLock, 
  UploadCloud, 
  Search, 
  Filter, 
  ExternalLink, 
  Download, 
  Trash2, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Tag, 
  HardDrive, 
  Eye, 
  Copy, 
  X, 
  Plus, 
  FolderPlus,
  Lock,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface GoogleDriveVaultProps {
  reports?: ReportSubmission[];
  currentAdminEmail?: string;
  onSelectIncidentReport?: (reportId: string) => void;
  preselectedIncidentRef?: string;
}

export const GoogleDriveVault: React.FC<GoogleDriveVaultProps> = ({
  reports = [],
  currentAdminEmail = AUTHORIZED_ADMIN_EMAIL,
  onSelectIncidentReport,
  preselectedIncidentRef,
}) => {
  const toast = useToast();
  
  // Auth state
  const [isConnected, setIsConnected] = useState<boolean>(() => !!getGoogleDriveAccessToken());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  
  // Data state
  const [files, setFiles] = useState<DriveRecordFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Filter & Search state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFileType, setSelectedFileType] = useState<'ALL' | 'WORD' | 'PDF' | 'IMAGE' | 'OTHER'>('ALL');
  const [filterIncidentRef, setFilterIncidentRef] = useState<string>(preselectedIncidentRef || '');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>(DRIVE_CLASSIFICATIONS[0].id);
  const [uploadIncidentRef, setUploadIncidentRef] = useState<string>(preselectedIncidentRef || '');
  const [uploadIncidentTitle, setUploadIncidentTitle] = useState<string>('');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Delete Confirmation Modal State (Mandatory Workspace user confirmation dialog)
  const [fileToDelete, setFileToDelete] = useState<DriveRecordFile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check connection and load files
  const fetchFiles = async () => {
    const token = getGoogleDriveAccessToken();
    if (!token) {
      setIsConnected(false);
      return;
    }
    setIsConnected(true);
    setIsLoading(true);
    try {
      const fetched = await listGoogleDriveFiles({
        categoryId: selectedCategory,
        incidentRef: filterIncidentRef,
        searchQuery: searchQuery,
      });
      setFiles(fetched);
    } catch (err: any) {
      console.error('[Google Drive Fetch Error]', err);
      toast.error('Failed to load files from Google Drive. Please reconnect.');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to token changes across the app (e.g., if officer signed in via Google on login screen)
  useEffect(() => {
    const unsubscribe = subscribeToGoogleDriveToken((token) => {
      const connected = !!token;
      setIsConnected(connected);
      if (connected) {
        setIsConnecting(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const token = getGoogleDriveAccessToken();
    setIsConnected(!!token);
    if (token) {
      fetchFiles();
    }
  }, [selectedCategory, filterIncidentRef, isConnected]);

  // Connect and Upload Action
  const handleOpenUploadWithAuth = async () => {
    if (!isConnected) {
      setIsConnecting(true);
      const timer = setTimeout(() => setIsConnecting(false), 20000);
      try {
        const result = await connectGoogleDriveAccount();
        clearTimeout(timer);
        setIsConnecting(false);
        if (result) {
          setIsConnected(true);
          toast.success(`Connected to Google Drive as ${result.user.email || 'Officer'}`);
          setShowUploadModal(true);
          fetchFiles();
        }
      } catch (err: any) {
        clearTimeout(timer);
        setIsConnecting(false);
        if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
          return;
        }
        console.error('[Google Drive Connect Error]', err);
        toast.error(err.message || 'Google Drive connection failed. Please try again.');
      }
    } else {
      setShowUploadModal(true);
    }
  };

  // Connect Google Drive Action
  const handleConnectDrive = async () => {
    setIsConnecting(true);
    const timer = setTimeout(() => setIsConnecting(false), 20000);
    try {
      const result = await connectGoogleDriveAccount();
      clearTimeout(timer);
      setIsConnecting(false);
      if (result) {
        setIsConnected(true);
        toast.success(`Connected to Google Drive as ${result.user.email || 'Officer'}`);
        fetchFiles();
      }
    } catch (err: any) {
      clearTimeout(timer);
      setIsConnecting(false);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      console.error('[Google Drive Connect Error]', err);
      toast.error(err.message || 'Google Drive connection failed. Please try again.');
    }
  };

  // Upload Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const uploaded = await uploadFileToGoogleDrive({
        file: uploadFile,
        categoryId: uploadCategory,
        incidentRef: uploadIncidentRef,
        incidentTitle: uploadIncidentTitle,
        notes: uploadNotes,
        officerEmail: currentAdminEmail,
        onProgress: (p) => setUploadProgress(p),
      });

      toast.success(`Uploaded "${uploadFile.name}" to Google Drive`, 'Evidence Stored');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadNotes('');
      if (!preselectedIncidentRef) {
        setUploadIncidentRef('');
        setUploadIncidentTitle('');
      }
      setUploadProgress(0);
      
      // Refresh list
      await fetchFiles();
    } catch (err: any) {
      console.error('[Upload Error]', err);
      toast.error(err.message || 'Failed to upload file to Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Action with explicit confirmation
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFileFromGoogleDrive(fileToDelete.id);
      toast.info(`Deleted "${fileToDelete.name}" from Google Drive`);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err: any) {
      console.error('[Delete Error]', err);
      toast.error(err.message || 'Failed to delete file from Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered files in memory for fast search
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // File type filter
      if (selectedFileType === 'WORD') {
        const isWord = file.mimeType.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc');
        if (!isWord) return false;
      } else if (selectedFileType === 'PDF') {
        if (!file.mimeType.includes('pdf') && !file.name.endsWith('.pdf')) return false;
      } else if (selectedFileType === 'IMAGE') {
        if (!file.mimeType.startsWith('image/')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = file.name.toLowerCase().includes(q);
        const matchRef = (file.properties?.incidentRef || '').toLowerCase().includes(q);
        const matchNotes = (file.properties?.notes || '').toLowerCase().includes(q);
        const matchCategory = (file.properties?.category || '').toLowerCase().includes(q);
        if (!matchName && !matchRef && !matchNotes && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [files, selectedFileType, searchQuery]);

  // Total summary metrics
  const stats = useMemo(() => {
    const wordCount = files.filter((f) => f.name.endsWith('.docx') || f.name.endsWith('.doc') || f.mimeType.includes('word')).length;
    const pdfCount = files.filter((f) => f.name.endsWith('.pdf') || f.mimeType.includes('pdf')).length;
    const photoCount = files.filter((f) => f.mimeType.startsWith('image/')).length;
    return {
      total: files.length,
      wordCount,
      pdfCount,
      photoCount,
    };
  }, [files]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Drive Connection Status */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-blue-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg text-xs font-bold text-blue-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>OFFICIAL PNP EVIDENCE & CASE VAULT</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-blue-400" />
              <span>Google Drive Document Storage</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Store Word documents (.docx), PDFs, affidavits, spot reports, and media evidence in official Google Drive folders organized by incident classification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Drive Connected ({currentAdminEmail})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>+ Upload Document</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConnectDrive}
                  disabled={isConnecting}
                  className="gsi-material-button cursor-pointer transition-all hover:scale-[1.02] shadow-lg"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isConnecting ? 'Connecting Drive...' : 'Connect Google Drive'}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleOpenUploadWithAuth}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Directory Breadcrumb & Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <FolderLock className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Drive Folder Target</span>
              <span className="text-xs font-bold text-white truncate block">[PNP Bauan MPS] Investigation & Evidence Records</span>
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Vault Access Level</span>
              <span className="text-xs font-bold text-emerald-300">Admin Only • Confidential</span>
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Total Stored Files</span>
              <span className="text-xs font-bold text-white">{files.length} documents in Google Drive</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK UPLOAD ACTION BAR (Always visible) */}
      <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-800 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Upload Case Document (.docx, .pdf, .xlsx, Photos)
            </h3>
            <p className="text-xs text-slate-500">
              Files are automatically categorized and saved directly to your Google Drive folder.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenUploadWithAuth}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload File to Google Drive</span>
        </button>
      </div>

      {/* When Disconnected View */}
      {!isConnected && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
            <FolderLock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Google Drive Vault Authentication Required
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              This vault is restricted strictly to authorized PNP administrators. Authorize your Google Account to read, upload, and organize case documents in the PNP Bauan MPS Drive.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConnectDrive}
              disabled={isConnecting}
              className="gsi-material-button cursor-pointer mx-auto shadow-md"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isConnecting ? 'Signing in with Google...' : 'Sign in with Google to Access Vault'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Connected Explorer View */}
      {isConnected && (
        <div className="space-y-4">
          {/* Classification Categories Selector */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                <span>Incident & Document Classifications</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {selectedCategory === 'ALL' ? 'Showing all classifications' : DRIVE_CLASSIFICATIONS.find((c) => c.id === selectedCategory)?.name}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer border ${
                  selectedCategory === 'ALL'
                    ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                All Folders ({files.length})
              </button>

              {DRIVE_CLASSIFICATIONS.map((cat) => {
                const count = files.filter((f) => f.properties?.category === cat.id).length;
                const isSel = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer border flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{cat.code}</span>
                    <span className="font-normal opacity-85 truncate max-w-[150px]">{cat.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${isSel ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & File Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by file name, Case Reference Number (BAU-XXXX), or notes..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All File Formats</option>
                <option value="WORD">Word Documents (.docx/.doc)</option>
                <option value="PDF">PDF Incident Reports (.pdf)</option>
                <option value="IMAGE">Photos / Images (.jpg/.png)</option>
              </select>

              <button
                type="button"
                onClick={fetchFiles}
                disabled={isLoading}
                title="Refresh Google Drive files"
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* Incident Filter Tag (if active) */}
          {filterIncidentRef && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-700" />
                <span>
                  Filtering files for Case Incident: <strong className="font-mono font-black">{filterIncidentRef}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFilterIncidentRef('')}
                className="text-xs text-blue-700 hover:text-blue-950 font-bold underline cursor-pointer"
              >
                Show All Incidents
              </button>
            </div>
          )}

          {/* Files Grid / List */}
          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-xs text-center space-y-3">
              <span className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
              <p className="text-xs font-semibold text-slate-500">Querying Google Drive files & folders...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Google Drive Documents Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'No documents match the current filter or search query.'
                  : 'Start by uploading Word documents (.docx), spot reports (.pdf), or sworn statements to this classified vault.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload First File</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => {
                const badge = getFileTypeBadge(file.mimeType, file.name);
                const categoryObj = DRIVE_CLASSIFICATIONS.find((c) => c.id === file.properties?.category);
                const incidentTag = file.properties?.incidentRef;

                return (
                  <div
                    key={file.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group"
                  >
                    {/* Header: File Type Badge + Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        {categoryObj && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryObj.badgeBg}`}>
                            {categoryObj.code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Open file in Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete from Google Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* File Title & Description */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 break-all" title={file.name}>
                        {file.name}
                      </h4>
                      {file.properties?.notes && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                          "{file.properties.notes}"
                        </p>
                      )}
                    </div>

                    {/* Incident Reference Tag */}
                    {incidentTag && (
                      <div className="pt-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-900">
                          <Tag className="w-3 h-3 text-amber-700" />
                          <span>Case Ref:</span>
                          <span className="font-mono">{incidentTag}</span>
                        </div>
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatHumanDateTime(file.modifiedTime || file.createdTime)}</span>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold text-center border border-blue-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View in Drive</span>
                        </a>
                      )}
                      {file.webContentLink ? (
                        <a
                          href={file.webContentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold text-center border border-slate-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (file.webViewLink) {
                              navigator.clipboard.writeText(file.webViewLink);
                              toast.success('Drive link copied to clipboard');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold text-center border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-900 rounded-xl">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Upload to Google Drive Vault
                  </h3>
                  <p className="text-xs text-slate-500">
                    Classified Police Case Storage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isUploading && setShowUploadModal(false)}
                disabled={isUploading}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Drop / Select Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Document / Evidence File <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  accept=".doc,.docx,.pdf,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.zip"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    uploadFile
                      ? 'border-emerald-400 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50'
                  }`}
                >
                  {uploadFile ? (
                    <div className="space-y-1">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-xs mx-auto">
                        {uploadFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatFileSize(uploadFile.size)} • Click to change file
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
                        <Plus className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Click or drag file to upload
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports Word (.docx), PDF, Excel (.xlsx), Images (.png/.jpg), etc.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Classification Category Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Classification Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {DRIVE_CLASSIFICATIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      [{cat.code}] {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {DRIVE_CLASSIFICATIONS.find((c) => c.id === uploadCategory)?.description}
                </p>
              </div>

              {/* Link with Incident Report (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Case / Incident Reference No.
                  </label>
                  {reports.length > 0 ? (
                    <div className="space-y-1">
                      <select
                        value={uploadIncidentRef}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUploadIncidentRef(val);
                          const matched = reports.find((r) => r.referenceNumber === val);
                          if (matched) {
                            setUploadIncidentTitle(
                              `${matched.reportType.toUpperCase()} - ${matched.personalInformation.firstName} ${matched.personalInformation.lastName}`
                            );
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- No specific incident --</option>
                        {reports.map((r) => (
                          <option key={r.id} value={r.referenceNumber}>
                            {r.referenceNumber} ({r.personalInformation.lastName}, {r.personalInformation.firstName})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={uploadIncidentRef}
                      onChange={(e) => setUploadIncidentRef(e.target.value)}
                      placeholder="e.g. BAU-7K9P-4Q2M"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Case Title / Blotter Subject
                  </label>
                  <input
                    type="text"
                    value={uploadIncidentTitle}
                    onChange={(e) => setUploadIncidentTitle(e.target.value)}
                    placeholder="e.g. Robbery Investigation"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Investigator Description / Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Investigator Notes & Summary
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional remarks or evidence description..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Progress indicator */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-blue-900">
                    <span>Uploading to Google Drive...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Drive...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Save to Google Drive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE GOOGLE DRIVE OPERATIONS */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Delete File from Google Drive?
              </h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete <strong className="text-slate-900 font-semibold">{fileToDelete.name}</strong> from your Google Drive evidence vault?
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs text-rose-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>Permanent Deletion Notice</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                This action will delete the file from the PNP Bauan MPS Google Drive folder. This operation cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
