import React, { useState, useEffect, useRef } from 'react';
import {
  ReportSubmission,
  ReportStatus,
  AttachmentItem,
  MergedPartyRecord,
  PersonalInformation,
  ReportTypeId,
} from '../../types/reports';
import { REPORT_TYPES } from '../../config/reportTypes';
import { CopyButton } from '../common/CopyButton';
import { CopySectionButton } from '../common/CopySectionButton';
import { CopyReportButton } from '../common/CopyReportButton';
import { StatusBadge } from '../common/StatusBadge';
import { DynamicReportFields } from '../form/DynamicReportFields';
import {
  formatPersonalInformationText,
  formatVehicularAccidentText,
  formatPlaceAndTimeText,
  getIncidentPlaceValue,
  getIncidentTimeValue,
  formatSectionText,
} from '../../utils/formatters';
import { formatHumanDate, formatHumanDateTime, calculateAgeFromBirthday } from '../../utils/dateUtils';
import {
  getGoogleDriveAccessToken,
  connectGoogleDriveAccount,
  subscribeToGoogleDriveToken,
  normalizeFirestoreArray,
} from '../../services/firebase';
import {
  uploadToCloudinary,
  downloadAttachmentFile,
  buildClientCloudinaryFolder,
} from '../../services/cloudinary';
import {
  listGoogleDriveFiles,
  uploadFileToGoogleDrive,
  deleteFileFromGoogleDrive,
  DriveRecordFile,
  DRIVE_CLASSIFICATIONS,
  getFileTypeBadge,
  formatFileSize,
} from '../../services/googleDrive';
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  File,
  Shield,
  Lock,
  Send,
  Archive,
  Edit3,
  Save,
  X,
  CheckCircle2,
  FileEdit,
  ClipboardList,
  Trash2,
  AlertTriangle,
  HardDrive,
  UploadCloud,
  ExternalLink,
  Plus,
  RefreshCw,
  Download,
  FolderCheck,
  Camera,
  ZoomIn,
  MapPin,
  Clock,
  GitMerge,
  Users,
  UserPlus,
  Split,
  Search,
  Car,
  UserCheck,
} from 'lucide-react';

interface AdminReportDetailProps {
  report: ReportSubmission;
  allReports?: ReportSubmission[];
  onBack: () => void;
  onSelectReport?: (reportId: string) => void;
  onUpdateStatus: (reportId: string, newStatus: ReportStatus) => void;
  onUpdateReportData?: (reportId: string, updatedData: Record<string, any>) => void;
  onUpdateCompleteReport?: (
    reportId: string,
    updates: {
      personalInformation?: PersonalInformation;
      reportData?: Record<string, any>;
      mergedParties?: MergedPartyRecord[];
      attachments?: AttachmentItem[];
      reportType?: ReportSubmission['reportType'];
      stationOffice?: string;
    },
    auditDetails?: string
  ) => Promise<void> | void;
  onMergeReports?: (
    primaryReportId: string,
    secondaryReportIds: string[],
    deleteMergedOriginals?: boolean
  ) => Promise<void> | void;
  onUploadAttachments?: (
    reportId: string,
    newAttachments: AttachmentItem[]
  ) => Promise<void> | void;
  onUnmergeParty?: (primaryReportId: string, partyId: string) => Promise<void> | void;
  onAddNote: (reportId: string, noteText: string) => void;
  onDeleteNote?: (reportId: string, noteId: string) => Promise<void> | void;
  onDeleteReport?: (reportId: string) => void;
  onDeleteAttachment?: (reportId: string, attachmentId: string) => void;
  currentAdminEmail?: string;
}

const EMPTY_PERSONAL_INFO: PersonalInformation = {
  lastName: '',
  firstName: '',
  middleName: '',
  suffix: '',
  birthday: '',
  age: null,
  sex: 'Male',
  civilStatus: 'Single',
  nationality: 'Filipino',
  occupation: '',
  address: '',
  contactNumber: '',
};

export const AdminReportDetail: React.FC<AdminReportDetailProps> = ({
  report,
  allReports = [],
  onBack,
  onSelectReport,
  onUpdateStatus,
  onUpdateReportData,
  onUpdateCompleteReport,
  onMergeReports,
  onUploadAttachments,
  onUnmergeParty,
  onAddNote,
  onDeleteNote,
  onDeleteReport,
  onDeleteAttachment,
  currentAdminEmail = 'bauan.pnp.investigation@gmail.com',
}) => {
  const [newNote, setNewNote] = useState('');
  const [showStatusConfirm, setShowStatusConfirm] = useState<ReportStatus | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Investigation Editing Mode for Police Officers ("the rest will be ours")
  const [isEditingInvestigation, setIsEditingInvestigation] = useState(false);
  const [editableReportData, setEditableReportData] = useState<Record<string, any>>(
    report.reportData || {}
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Full CRUD: Primary Party 1 Personal + Vehicle Editing State
  const [isEditingPrimaryParty, setIsEditingPrimaryParty] = useState(false);
  const [editPrimaryPersonalInfo, setEditPrimaryPersonalInfo] = useState<PersonalInformation>(
    report.personalInformation || EMPTY_PERSONAL_INFO
  );
  const [editPrimaryReportData, setEditPrimaryReportData] = useState<Record<string, any>>(
    report.reportData || {}
  );
  const [editPrimaryReportType, setEditPrimaryReportType] = useState<ReportTypeId>(
    report.reportType || 'personal-intake'
  );
  const [isSavingPrimaryCRUD, setIsSavingPrimaryCRUD] = useState(false);

  // Full CRUD: Merged Party Editing / Creation State
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [editPartyLabel, setEditPartyLabel] = useState<string>('');
  const [editPartyRef, setEditPartyRef] = useState<string>('');
  const [editPartyReportType, setEditPartyReportType] = useState<ReportTypeId>('vehicular-incident');
  const [editPartyPersonalInfo, setEditPartyPersonalInfo] =
    useState<PersonalInformation>(EMPTY_PERSONAL_INFO);
  const [editPartyReportData, setEditPartyReportData] = useState<Record<string, any>>({});
  const [isSavingPartyCRUD, setIsSavingPartyCRUD] = useState(false);

  // Add New Party Modal (Create Party inside Combined File)
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newPartyLabel, setNewPartyLabel] = useState('');
  const [newPartyReportType, setNewPartyReportType] = useState<ReportTypeId>(
    report.reportType || 'vehicular-incident'
  );
  const [newPartyPersonalInfo, setNewPartyPersonalInfo] =
    useState<PersonalInformation>(EMPTY_PERSONAL_INFO);
  const [newPartyReportData, setNewPartyReportData] = useState<Record<string, any>>({
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    plateNumber: '',
    placeOfIncident: '',
    incidentTime: '',
    clientInitialRemarks: '',
  });

  // Merge Other Submitted Documents Modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSearchQuery, setMergeSearchQuery] = useState('');
  const [selectedIdsToMerge, setSelectedIdsToMerge] = useState<string[]>([]);
  const [deleteOriginalsOnMerge, setDeleteOriginalsOnMerge] = useState(true);
  const [isMergingRecords, setIsMergingRecords] = useState(false);

  // Conflict-Free Photo Upload & Live Camera Capture State for Single/Combined File
  const [showPhotoUploadPanel, setShowPhotoUploadPanel] = useState(false);
  const [selectedPhotoPartyId, setSelectedPhotoPartyId] = useState<string>('PRIMARY');
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Google Drive Integration for this specific Case
  const [driveFiles, setDriveFiles] = useState<DriveRecordFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(
    () => !!getGoogleDriveAccessToken()
  );
  const [showDriveUpload, setShowDriveUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>(DRIVE_CLASSIFICATIONS[0].id);
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<DriveRecordFile | null>(null);
  const [isDeletingDriveFile, setIsDeletingDriveFile] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentItem | null>(null);

  // Sync local editable states when report prop updates from Firestore
  useEffect(() => {
    setEditableReportData(report.reportData || {});
    setEditPrimaryPersonalInfo(report.personalInformation || EMPTY_PERSONAL_INFO);
    setEditPrimaryReportData(report.reportData || {});
    setEditPrimaryReportType(report.reportType || 'personal-intake');
  }, [report]);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const showTempSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const loadCaseDriveFiles = async () => {
    const token = getGoogleDriveAccessToken();
    if (!token) {
      setIsDriveConnected(false);
      return;
    }
    setIsDriveConnected(true);
    setIsLoadingDrive(true);
    try {
      const files = await listGoogleDriveFiles({
        incidentRef: report.referenceNumber,
      });
      setDriveFiles(files);
    } catch (err) {
      console.warn('[Google Drive Report Detail Error]', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToGoogleDriveToken((token) => {
      setIsDriveConnected(!!token);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDriveConnected) {
      loadCaseDriveFiles();
    }
  }, [report.referenceNumber, isDriveConnected]);

  const handleConnectDrive = async () => {
    try {
      const result = await connectGoogleDriveAccount();
      if (result) {
        setIsDriveConnected(true);
        loadCaseDriveFiles();
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      console.error('[Google Drive Connect Error]', err);
    }
  };

  const handleUploadCaseDriveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploadingDrive(true);
    try {
      await uploadFileToGoogleDrive({
        file: uploadFile,
        categoryId: uploadCategory,
        incidentRef: report.referenceNumber,
        incidentTitle: `${report.reportType.toUpperCase()} - ${report.personalInformation.lastName}, ${report.personalInformation.firstName}`,
        notes: uploadNotes,
        officerEmail: currentAdminEmail,
      });
      setShowDriveUpload(false);
      setUploadFile(null);
      setUploadNotes('');
      await loadCaseDriveFiles();
    } catch (err: any) {
      console.error('Failed to upload to Google Drive:', err);
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const handleConfirmDeleteDriveFile = async () => {
    if (!fileToDelete) return;
    setIsDeletingDriveFile(true);
    try {
      await deleteFileFromGoogleDrive(fileToDelete.id);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete file from Google Drive:', err);
    } finally {
      setIsDeletingDriveFile(false);
    }
  };

  const reportConfig = REPORT_TYPES[report.reportType];
  const personalInfo = report.personalInformation || ({} as PersonalInformation);
  const reportData = report.reportData || {};
  const safeMergedParties = normalizeFirestoreArray<MergedPartyRecord>(report.mergedParties);
  const safeAttachments = normalizeFirestoreArray<AttachmentItem>(report.attachments);
  const safeAdminNotes = normalizeFirestoreArray(report.adminNotes);
  const safeAuditLogs = normalizeFirestoreArray(report.auditLogs);

  const totalPartiesCount = 1 + safeMergedParties.length;
  const isCombinedFile = safeMergedParties.length > 0;

  // Formatted plain texts for copy buttons
  const isVehicular = report.reportType === 'vehicular-incident';
  const personalInfoFormatted = formatPersonalInformationText(personalInfo);
  const vehicularAccidentFormatted = formatVehicularAccidentText(personalInfo, reportData);
  const placeAndTimeFormatted = formatPlaceAndTimeText(reportData);
  const incidentPlaceValue = getIncidentPlaceValue(reportData);
  const incidentTimeValue = getIncidentTimeValue(reportData);
  const primaryFormattedEntry = isVehicular ? vehicularAccidentFormatted : personalInfoFormatted;

  // Build formatted text for each merged party so officer can copy each party or all combined
  const getPartyFormattedEntry = (party: MergedPartyRecord): string => {
    const partyIsVehicular =
      party.reportType === 'vehicular-incident' ||
      Boolean(
        party.reportData?.vehicleMake ||
          party.reportData?.vehicleMakeModel ||
          party.reportData?.plateNumber
      );
    return partyIsVehicular
      ? formatVehicularAccidentText(party.personalInformation, party.reportData || {})
      : formatPersonalInformationText(party.personalInformation);
  };

  const allPartiesCombinedBlotterText = [
    `[PARTY 1 — PRIMARY (#${report.referenceNumber})]\n${primaryFormattedEntry}`,
    ...safeMergedParties.map(
      (p, idx) =>
        `[PARTY ${idx + 2} — ${p.partyLabel || p.referenceNumber}]\n${getPartyFormattedEntry(p)}`
    ),
  ].join('\n\n');

  const baseCompleteReportFormatted = reportConfig
    ? reportConfig.generateTemplate(personalInfo, reportData, report.referenceNumber)
    : primaryFormattedEntry;

  const completeReportFormatted = isCombinedFile
    ? `${baseCompleteReportFormatted}\n\n=== COMBINED / MERGED PARTIES (${safeMergedParties.length}) ===\n\n${safeMergedParties
        .map(
          (p, idx) =>
            `--- PARTY ${idx + 2}: ${p.partyLabel || p.referenceNumber} ---\n${getPartyFormattedEntry(
              p
            )}`
        )
        .join('\n\n')}`
    : baseCompleteReportFormatted;

  // Party options for tagging uploaded photos without conflict
  const partyOptions = [
    {
      id: 'PRIMARY',
      label: `Party 1 (Primary): ${[personalInfo.firstName, personalInfo.lastName]
        .filter(Boolean)
        .join(' ')} (#${report.referenceNumber})`,
      refNumber: report.referenceNumber,
      clientName: [personalInfo.lastName, personalInfo.firstName, personalInfo.middleName]
        .filter(Boolean)
        .join('_'),
      reportType: report.reportType,
    },
    ...safeMergedParties.map((mp, idx) => ({
      id: mp.id,
      label:
        mp.partyLabel ||
        `Party ${idx + 2}: ${[mp.personalInformation?.firstName, mp.personalInformation?.lastName]
          .filter(Boolean)
          .join(' ')} (#${mp.referenceNumber})`,
      refNumber: mp.referenceNumber || report.referenceNumber,
      clientName: [
        mp.personalInformation?.lastName,
        mp.personalInformation?.firstName,
        mp.personalInformation?.middleName,
      ]
        .filter(Boolean)
        .join('_'),
      reportType: mp.reportType || report.reportType,
    })),
  ];

  // Candidate reports available to merge into this report
  const mergeableReports = allReports.filter((r) => {
    if (!r || r.id === report.id) return false;
    if (!mergeSearchQuery.trim()) return true;
    const q = mergeSearchQuery.toLowerCase();
    const fullName = `${r.personalInformation?.firstName || ''} ${
      r.personalInformation?.middleName || ''
    } ${r.personalInformation?.lastName || ''}`.toLowerCase();
    const plate = String(r.reportData?.plateNumber || '').toLowerCase();
    return (
      r.referenceNumber.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      plate.includes(q) ||
      r.reportType.toLowerCase().includes(q)
    );
  });

  const handleStatusChange = (status: ReportStatus) => {
    onUpdateStatus(report.id, status);
    setShowStatusConfirm(null);
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddNote(report.id, newNote.trim());
    setNewNote('');
  };

  const handleSaveInvestigationData = () => {
    if (onUpdateReportData) {
      onUpdateReportData(report.id, editableReportData);
      setIsEditingInvestigation(false);
      showTempSuccess('Investigation details updated and saved successfully!');
    }
  };

  const handleCancelEditing = () => {
    setEditableReportData(report.reportData || {});
    setIsEditingInvestigation(false);
  };

  // ==========================================
  // FULL CRUD HANDLERS FOR PRIMARY & MERGED PARTIES
  // ==========================================

  const handleSavePrimaryPartyCRUD = async () => {
    if (!onUpdateCompleteReport) return;
    setIsSavingPrimaryCRUD(true);
    try {
      const updatedMakeModel = [
        editPrimaryReportData.vehicleMake,
        editPrimaryReportData.vehicleModel,
      ]
        .filter(Boolean)
        .join(' ');
      const cleanedReportData = {
        ...editPrimaryReportData,
        vehicleMakeModel: updatedMakeModel || editPrimaryReportData.vehicleMakeModel || '',
      };

      await onUpdateCompleteReport(
        report.id,
        {
          personalInformation: editPrimaryPersonalInfo,
          reportData: cleanedReportData,
          reportType: editPrimaryReportType,
        },
        `Updated Party 1 (Primary Client #${report.referenceNumber}) personal & vehicle details`
      );
      setIsEditingPrimaryParty(false);
      showTempSuccess('Party 1 (Primary) record updated successfully!');
    } finally {
      setIsSavingPrimaryCRUD(false);
    }
  };

  const startEditingMergedParty = (party: MergedPartyRecord) => {
    setEditingPartyId(party.id);
    setEditPartyLabel(party.partyLabel || '');
    setEditPartyRef(party.referenceNumber || '');
    setEditPartyReportType(party.reportType || 'vehicular-incident');
    setEditPartyPersonalInfo({
      ...EMPTY_PERSONAL_INFO,
      ...(party.personalInformation || {}),
    });
    setEditPartyReportData({ ...(party.reportData || {}) });
  };

  const handleSaveMergedPartyCRUD = async (partyId: string) => {
    if (!onUpdateCompleteReport) return;
    setIsSavingPartyCRUD(true);
    try {
      const updatedMakeModel = [editPartyReportData.vehicleMake, editPartyReportData.vehicleModel]
        .filter(Boolean)
        .join(' ');
      const cleanedPartyReportData: Record<string, any> = {};
      for (const [k, v] of Object.entries({
        ...editPartyReportData,
        vehicleMakeModel: updatedMakeModel || editPartyReportData.vehicleMakeModel || '',
      })) {
        if (v !== undefined && !Array.isArray(v)) {
          cleanedPartyReportData[k] = v;
        }
      }

      const updatedParties = safeMergedParties.map((p) =>
        p.id === partyId
          ? {
              ...p,
              partyLabel:
                editPartyLabel.trim() ||
                `Party: ${editPartyPersonalInfo.firstName} ${editPartyPersonalInfo.lastName}`,
              referenceNumber: editPartyRef.trim() || p.referenceNumber,
              reportType: editPartyReportType,
              personalInformation: editPartyPersonalInfo,
              reportData: cleanedPartyReportData,
            }
          : p
      );

      await onUpdateCompleteReport(
        report.id,
        { mergedParties: updatedParties },
        `Updated merged party (${editPartyLabel || partyId}) via Full CRUD editor`
      );
      setEditingPartyId(null);
      showTempSuccess('Merged party details saved without conflict!');
    } finally {
      setIsSavingPartyCRUD(false);
    }
  };

  const handleDeleteMergedParty = async (party: MergedPartyRecord) => {
    if (!onUpdateCompleteReport) return;
    const updatedParties = safeMergedParties.filter((p) => p.id !== party.id);
    await onUpdateCompleteReport(
      report.id,
      { mergedParties: updatedParties },
      `Removed merged party ${party.partyLabel || party.referenceNumber} from combined file`
    );
    showTempSuccess(`Removed ${party.partyLabel || party.referenceNumber} from combined file.`);
  };

  const handleCreateNewPartyInFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCompleteReport) return;
    setIsSavingPartyCRUD(true);
    try {
      const now = new Date().toISOString();
      const partyIdx = safeMergedParties.length + 2;
      const generatedRef = `${report.referenceNumber}-P${partyIdx}`;
      const fullName =
        [newPartyPersonalInfo.firstName, newPartyPersonalInfo.middleName, newPartyPersonalInfo.lastName]
          .filter(Boolean)
          .join(' ') || `Party ${partyIdx}`;
      const label = newPartyLabel.trim() || `Party ${partyIdx}: ${fullName} (${generatedRef})`;

      const updatedMakeModel = [newPartyReportData.vehicleMake, newPartyReportData.vehicleModel]
        .filter(Boolean)
        .join(' ');

      const newPartyRecord: MergedPartyRecord = {
        id: `party_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        referenceNumber: generatedRef,
        reportType: newPartyReportType,
        partyLabel: label,
        createdAt: now,
        mergedAt: now,
        personalInformation: newPartyPersonalInfo,
        reportData: {
          ...newPartyReportData,
          vehicleMakeModel: updatedMakeModel,
        },
      };

      await onUpdateCompleteReport(
        report.id,
        { mergedParties: [...safeMergedParties, newPartyRecord] },
        `Added new party (${label}) directly to combined file`
      );

      setShowAddPartyModal(false);
      setNewPartyLabel('');
      setNewPartyPersonalInfo(EMPTY_PERSONAL_INFO);
      setNewPartyReportData({
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        vehicleColor: '',
        plateNumber: '',
        placeOfIncident: '',
        incidentTime: '',
        clientInitialRemarks: '',
      });
      showTempSuccess(`Added ${label} to this combined file!`);
    } finally {
      setIsSavingPartyCRUD(false);
    }
  };

  const handleConfirmMergeInsideDetail = async () => {
    if (!onMergeReports || selectedIdsToMerge.length === 0) return;
    setIsMergingRecords(true);
    try {
      await onMergeReports(report.id, selectedIdsToMerge, deleteOriginalsOnMerge);
      setSelectedIdsToMerge([]);
      setShowMergeModal(false);
      showTempSuccess('Selected client documents merged into this single file without conflict!');
    } finally {
      setIsMergingRecords(false);
    }
  };

  // ==========================================
  // CONFLICT-FREE PHOTO UPLOAD & LIVE CAMERA CAPTURE TO FILE
  // ==========================================

  const uploadFilesForSelectedParty = async (
    files: File[],
    sourceType: 'upload' | 'live_capture'
  ) => {
    if (!files.length) return;
    setIsUploadingPhotos(true);
    try {
      const targetParty =
        partyOptions.find((p) => p.id === selectedPhotoPartyId) || partyOptions[0];
      const uploadedItems: AttachmentItem[] = [];

      for (const file of files) {
        const result = await uploadToCloudinary(file, {
          reportType: targetParty.reportType,
          referenceNumber: targetParty.refNumber,
          clientName: targetParty.clientName,
        });

        uploadedItems.push({
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          name: file.name,
          size: file.size || result.bytes || 0,
          type: file.type || 'image/jpeg',
          url: result.secure_url || result.url,
          previewUrl: result.secure_url || result.url,
          cloudinaryFolder: result.folder,
          publicId: result.public_id,
          sourceType,
          uploadedAt: new Date().toISOString(),
          partyId: targetParty.id,
          partyLabel: targetParty.label,
          partyReferenceNumber: targetParty.refNumber,
        });
      }

      if (onUploadAttachments) {
        await onUploadAttachments(report.id, uploadedItems);
      } else if (onUpdateCompleteReport) {
        await onUpdateCompleteReport(
          report.id,
          { attachments: [...safeAttachments, ...uploadedItems] },
          `Uploaded ${uploadedItems.length} photo(s) for ${targetParty.label}`
        );
      }

      showTempSuccess(
        `Uploaded ${uploadedItems.length} photo(s) to ${targetParty.label} without conflict!`
      );
    } catch (err) {
      console.error('[Photo Upload Error]:', err);
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    await uploadFilesForSelectedParty(filesArray, 'upload');
    e.target.value = '';
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('Could not access camera. Please check permissions or use File Upload.');
    }
  };

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureLivePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const fileName = `live_capture_${Date.now()}.jpg`;
        const capturedFile = new window.File([blob], fileName, { type: 'image/jpeg' });
        stopLiveCamera();
        await uploadFilesForSelectedParty([capturedFile], 'live_capture');
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to request list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isCombinedFile ? `COMBINED CASE FILE #${report.referenceNumber}` : `REQUEST #${report.referenceNumber}`}
              </h2>
              <StatusBadge status={report.status} />
              {isCombinedFile && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-900 text-white shadow-2xs">
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  <span>{totalPartiesCount} COMBINED PARTIES</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Report Type:{' '}
              <span className="font-bold text-slate-700">
                {reportConfig?.nameEn || report.reportType}
              </span>{' '}
              • Intake Date: {formatHumanDateTime(report.createdAt)}
            </p>
          </div>
        </div>

        {/* Prominent Action Buttons: Merge Documents, Add Party, Upload Photo, Copy Report, Delete, Close */}
        <div className="flex items-center gap-2 flex-wrap">
          {onMergeReports && (
            <button
              type="button"
              onClick={() => setShowMergeModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
              title="Merge another submitted client document into this single file without conflict"
            >
              <GitMerge className="w-4 h-4 text-amber-300" />
              <span>Merge Another Record ({mergeableReports.length})</span>
            </button>
          )}

          {onUpdateCompleteReport && (
            <button
              type="button"
              onClick={() => setShowAddPartyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
              title="Add a new party directly to this combined file (CRUD)"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Party</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPhotoUploadPanel((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-extrabold transition-colors shadow-xs cursor-pointer"
            title="Upload or capture photos directly into this file"
          >
            <Camera className="w-4 h-4 text-amber-300" />
            <span>Upload Photo to File</span>
          </button>

          <CopyReportButton
            reportText={completeReportFormatted}
            referenceNumber={report.referenceNumber}
            size="md"
          />

          {onDeleteReport && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="Delete record from database"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          {/* Prominent X Mark for Back / Close */}
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close Record (Back to List)"
            aria-label="Close Record"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Status Workflow Ribbon */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-300">
              Investigation Workflow & Combined Case Control
            </span>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-300 flex-wrap">
              <span>
                Status: <strong className="text-white font-mono text-sm">{report.status}</strong>
              </span>
              <span>•</span>
              <span>
                Parties in File: <strong className="text-amber-300">{totalPartiesCount}</strong>
              </span>
              <span>•</span>
              <span>
                Photos Attached: <strong className="text-emerald-300">{safeAttachments.length}</strong>
              </span>
              {report.completedAt && (
                <span className="text-emerald-400">
                  • Completed: {formatHumanDateTime(report.completedAt)}
                </span>
              )}
              {report.archivedAt && (
                <span className="text-slate-400">
                  • Archived: {formatHumanDateTime(report.archivedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {report.status !== 'PROCESSING' && report.status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('PROCESSING')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
              >
                Mark Processing
              </button>
            )}

            {report.status !== 'COMPLETED' && report.status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('COMPLETED')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
              >
                Mark Completed
              </button>
            )}

            {report.status !== 'ARCHIVED' ? (
              <button
                type="button"
                onClick={() => setShowStatusConfirm('ARCHIVED')}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-slate-600 cursor-pointer"
              >
                Archive Record
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusChange('PROCESSING')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Restore to Active
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MERGED CASE FILE BANNER WITH LINKS TO PRESERVED ORIGINAL FILES */}
      {(safeMergedParties.length > 0 || report.isMergedFile || report.id.startsWith('mrg_')) && (
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-md border border-indigo-700 flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500 text-white">
                    Merged Case File ({totalPartiesCount} Parties Combined)
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    All Original Client Files Preserved Intact
                  </span>
                </div>
                <p className="text-xs text-indigo-100 font-medium mt-1">
                  This is a dedicated Merged File combining {totalPartiesCount} client submissions. All original submitted files remain 100% untouched in the Original Client Submissions section.
                </p>
              </div>
            </div>
          </div>

          {onSelectReport && (
            <div className="pt-2.5 border-t border-indigo-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                Preserved Original Source Files:
              </span>
              {allReports
                .filter(
                  (orig) =>
                    orig.id !== report.id &&
                    !orig.isMergedFile &&
                    !orig.id.startsWith('mrg_') &&
                    ((Array.isArray(report.sourceReportIds) &&
                      report.sourceReportIds.includes(orig.id)) ||
                      (Array.isArray(report.sourceReferenceNumbers) &&
                        report.sourceReferenceNumbers.includes(orig.referenceNumber)) ||
                      safeMergedParties.some(
                        (mp) => mp.id === orig.id || mp.referenceNumber === orig.referenceNumber
                      ))
                )
                .map((orig) => {
                  const origName = [
                    orig.personalInformation?.firstName,
                    orig.personalInformation?.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <button
                      key={orig.id}
                      type="button"
                      onClick={() => onSelectReport(orig.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-indigo-400/30 transition-all cursor-pointer"
                      title="Open preserved original client submission"
                    >
                      <FileText className="w-3 h-3 text-emerald-300" />
                      <span>#{orig.referenceNumber}</span>
                      {origName && <span className="text-indigo-200">({origName})</span>}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between gap-2 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Conflict-Free Photo Upload Panel (When Toggled from Top Bar) */}
      {showPhotoUploadPanel && (
        <div className="bg-white rounded-xl border-2 border-blue-700 shadow-lg overflow-hidden animate-fadeIn">
          <div className="px-5 py-3.5 bg-blue-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-300" />
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  Upload or Capture Photos to Case File #{report.referenceNumber}
                </h3>
                <p className="text-[11px] text-blue-200">
                  Conflict-free top-level storage • Assign photo to any Party in this combined file
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopLiveCamera();
                setShowPhotoUploadPanel(false);
              }}
              className="p-1 text-blue-200 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Assign Uploaded Photo To Which Client / Party?
                </label>
                <select
                  value={selectedPhotoPartyId}
                  onChange={(e) => setSelectedPhotoPartyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:border-blue-600"
                >
                  {partyOptions.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingPhotos}
                  onClick={() => photoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-amber-300" />
                  <span>
                    {isUploadingPhotos ? 'Uploading to Cloudinary...' : 'Select Photo(s) from Device'}
                  </span>
                </button>

                {!isCameraOpen ? (
                  <button
                    type="button"
                    disabled={isUploadingPhotos}
                    onClick={startLiveCamera}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Live Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Close Camera</span>
                  </button>
                )}
              </div>
            </div>

            {cameraError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {cameraError}
              </div>
            )}

            {isCameraOpen && (
              <div className="bg-slate-900 rounded-xl p-4 space-y-3 text-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-80 object-contain rounded-lg mx-auto bg-black"
                />
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={captureLivePhoto}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture & Save Photo to File</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Place & Time on Top, All Parties (Copy Each or Combined + Full CRUD), Photos & Investigation */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. STANDALONE PLACE & TIME OF INCIDENT SECTION FOR VEHICULAR ACCIDENT (STRICTLY ON TOP) */}
          {isVehicular && (
            <div className="bg-white rounded-xl border-2 border-amber-500 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-amber-900 text-white flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-300" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase">
                      Place & Time of Incident (Lugar at Oras ng Insidente)
                    </h3>
                    <p className="text-[11px] text-amber-200">
                      Top Priority Copy Section (Kept separate from vehicle & driver blotter copy)
                    </p>
                  </div>
                </div>
                <CopySectionButton
                  sectionTitle="Place & Time of Incident"
                  formattedText={placeAndTimeFormatted}
                  className="border-amber-300"
                />
              </div>

              <div className="p-5 space-y-4">
                {/* Copy Both Together Box */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                      Copy Both (Place & Time Together):
                    </span>
                    <pre className="text-xs sm:text-sm font-mono font-semibold text-slate-900 whitespace-pre-wrap select-all">
                      {placeAndTimeFormatted || '—'}
                    </pre>
                  </div>
                  <CopyButton
                    value={placeAndTimeFormatted}
                    label="Both Place & Time of Incident"
                  />
                </div>

                {/* Individual Single Entity Copy Rows */}
                <div className="divide-y divide-slate-100 text-xs sm:text-sm border border-slate-200 rounded-xl px-4 bg-slate-50/50">
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="w-3/4">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-amber-700" />
                        <span>1. Place of Incident (Lugar ng Insidente — Single Copy)</span>
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block">
                        {incidentPlaceValue || '—'}
                      </span>
                    </div>
                    <CopyButton value={incidentPlaceValue} label="Place of Incident" />
                  </div>

                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="w-3/4">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>2. Time of Incident (Oras at Petsa ng Insidente — Single Copy)</span>
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block">
                        {incidentTimeValue || '—'}
                      </span>
                    </div>
                    <CopyButton value={incidentTimeValue} label="Time of Incident" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMBINED MULTI-PARTY OVERVIEW & COPY ALL BANNER (WHEN 2+ PARTIES ARE MERGED IN THIS SINGLE FILE) */}
          {isCombinedFile && (
            <div className="bg-indigo-950 text-white rounded-xl border-2 border-indigo-500 shadow-md overflow-hidden">
              <div className="px-5 py-3.5 bg-indigo-900/90 border-b border-indigo-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-amber-300" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                      Combined Single Case File • {totalPartiesCount} Client Records Merged
                    </h3>
                    <p className="text-[11px] text-indigo-200">
                      Copy all combined parties together below, or copy each individual client's file & fields separately.
                    </p>
                  </div>
                </div>
                <CopySectionButton
                  sectionTitle="All Combined Parties Blotter"
                  formattedText={allPartiesCombinedBlotterText}
                  className="border-amber-300"
                />
              </div>
              <div className="p-4 bg-indigo-950/60 space-y-3">
                <pre className="text-xs font-mono text-indigo-100 bg-slate-900/90 p-3.5 rounded-lg border border-indigo-800 whitespace-pre-wrap select-all">
                  {allPartiesCombinedBlotterText}
                </pre>
              </div>
            </div>
          )}

          {/* PARTY 1 (PRIMARY): READY-TO-COPY OFFICIAL BLOTTER PARAGRAPH */}
          <div className="bg-white rounded-xl border-2 border-blue-900 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-blue-950 text-white flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase">
                  {isCombinedFile ? 'Party 1 (Primary File): ' : ''}
                  {isVehicular
                    ? 'Official Vehicular Accident Blotter Format (Vehicle & Driver Only)'
                    : 'Official Personal Information Blotter Format (Ready to Copy)'}
                </h3>
              </div>
              <CopySectionButton
                sectionTitle={
                  isVehicular ? 'Party 1 Vehicular Accident Entry' : 'Party 1 Personal Information Entry'
                }
                formattedText={primaryFormattedEntry}
                className="border-amber-400"
              />
            </div>
            <div className="p-5 bg-blue-50/40">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed select-all font-mono bg-white p-4 rounded-lg border border-blue-200 shadow-2xs">
                {primaryFormattedEntry || '—'}
              </p>
            </div>
          </div>

          {/* PARTY 1 (PRIMARY): CLIENT SUBMITTED PERSONAL & VEHICLE INFORMATION + FULL CRUD EDITOR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-blue-950 text-white flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase">
                    {isCombinedFile
                      ? `Party 1 (Primary Client #${report.referenceNumber}): ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`
                      : isVehicular
                      ? 'Submitted Vehicle & Driver Information (Mula sa Publiko)'
                      : 'Client Personal Information (Mula sa Publiko)'}
                  </h3>
                  <p className="text-[10px] text-blue-200">
                    Single-Entity Copy for Every Field • Full CRUD Edit Enabled
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onUpdateCompleteReport && !isEditingPrimaryParty && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPrimaryParty(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Party 1 (CRUD)</span>
                  </button>
                )}
                <CopySectionButton
                  sectionTitle={isVehicular ? 'Party 1 Vehicular & Driver Info' : 'Party 1 Personal Info'}
                  formattedText={primaryFormattedEntry}
                  className="border-blue-400"
                />
              </div>
            </div>

            {/* FULL CRUD EDITOR FOR PARTY 1 (PRIMARY) */}
            {isEditingPrimaryParty ? (
              <div className="p-5 bg-amber-50/40 border-b border-amber-200 space-y-5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase text-slate-900">
                      Full CRUD Editor — Party 1 (Primary Record #{report.referenceNumber})
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Modify any personal, vehicle, or incident field without conflict.
                    </p>
                  </div>
                  <select
                    value={editPrimaryReportType}
                    onChange={(e) => setEditPrimaryReportType(e.target.value as ReportTypeId)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="personal-intake">Personal Information</option>
                    <option value="vehicular-incident">Vehicular Accident</option>
                  </select>
                </div>

                {editPrimaryReportType === 'vehicular-incident' && (
                  <div className="p-4 bg-white rounded-xl border border-amber-300 space-y-3">
                    <h5 className="text-xs font-black uppercase text-amber-900">
                      Place, Time & Vehicle Fields (Party 1)
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Place of Incident (Lugar ng Insidente)
                        </label>
                        <input
                          type="text"
                          value={editPrimaryReportData.placeOfIncident || ''}
                          onChange={(e) =>
                            setEditPrimaryReportData((prev) => ({
                              ...prev,
                              placeOfIncident: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Time & Date of Incident (Oras at Petsa)
                        </label>
                        <input
                          type="text"
                          value={editPrimaryReportData.incidentTime || ''}
                          onChange={(e) =>
                            setEditPrimaryReportData((prev) => ({
                              ...prev,
                              incidentTime: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          1. Vehicle Make / Brand
                        </label>
                        <input
                          type="text"
                          value={editPrimaryReportData.vehicleMake || ''}
                          onChange={(e) =>
                            setEditPrimaryReportData((prev) => ({
                              ...prev,
                              vehicleMake: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          2. Vehicle Model
                        </label>
                        <input
                          type="text"
                          value={editPrimaryReportData.vehicleModel || ''}
                          onChange={(e) =>
                            setEditPrimaryReportData((prev) => ({
                              ...prev,
                              vehicleModel: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          3. Vehicle Year Model
                        </label>
                        <input
                          type="text"
                          value={editPrimaryReportData.vehicleYear || ''}
                          onChange={(e) =>
                            setEditPrimaryReportData((prev) => ({
                              ...prev,
                              vehicleYear: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          4. Vehicle Color
                        </label>
                        <input
                          type="text"
                          value={editPrimaryReportData.vehicleColor || ''}
                          onChange={(e) =>
                            setEditPrimaryReportData((prev) => ({
                              ...prev,
                              vehicleColor: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          5. Plate Number
                        </label>
                        <input
                          type="text"
                          value={editPrimaryReportData.plateNumber || ''}
                          onChange={(e) =>
                            setEditPrimaryReportData((prev) => ({
                              ...prev,
                              plateNumber: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Information Fields for Party 1 */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <h5 className="text-xs font-black uppercase text-blue-950">
                    Personal Information Fields (Party 1)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        1. First Name
                      </label>
                      <input
                        type="text"
                        value={editPrimaryPersonalInfo.firstName}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({ ...p, firstName: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        2. Middle Name
                      </label>
                      <input
                        type="text"
                        value={editPrimaryPersonalInfo.middleName}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({ ...p, middleName: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        3. Last Name
                      </label>
                      <input
                        type="text"
                        value={editPrimaryPersonalInfo.lastName}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({ ...p, lastName: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        4. Suffix
                      </label>
                      <input
                        type="text"
                        value={editPrimaryPersonalInfo.suffix}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({ ...p, suffix: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        5. Birthday
                      </label>
                      <input
                        type="date"
                        value={editPrimaryPersonalInfo.birthday}
                        onChange={(e) => {
                          const bday = e.target.value;
                          const computedAge = calculateAgeFromBirthday(bday);
                          setEditPrimaryPersonalInfo((p) => ({
                            ...p,
                            birthday: bday,
                            age: computedAge !== null ? computedAge : p.age,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        6. Age
                      </label>
                      <input
                        type="number"
                        value={editPrimaryPersonalInfo.age ?? ''}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({
                            ...p,
                            age: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        7. Sex
                      </label>
                      <select
                        value={editPrimaryPersonalInfo.sex}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({ ...p, sex: e.target.value as any }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        8. Civil Status
                      </label>
                      <select
                        value={editPrimaryPersonalInfo.civilStatus}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({
                            ...p,
                            civilStatus: e.target.value as any,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                        <option value="Annulled">Annulled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        9. Occupation
                      </label>
                      <input
                        type="text"
                        value={editPrimaryPersonalInfo.occupation}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({ ...p, occupation: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        10. Nationality
                      </label>
                      <input
                        type="text"
                        value={editPrimaryPersonalInfo.nationality}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({ ...p, nationality: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        12. Contact Number
                      </label>
                      <input
                        type="text"
                        value={editPrimaryPersonalInfo.contactNumber}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({
                            ...p,
                            contactNumber: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        11. Complete Address
                      </label>
                      <input
                        type="text"
                        value={editPrimaryPersonalInfo.address}
                        onChange={(e) =>
                          setEditPrimaryPersonalInfo((p) => ({ ...p, address: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingPrimaryParty(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingPrimaryCRUD}
                    onClick={handleSavePrimaryPartyCRUD}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingPrimaryCRUD ? 'Saving...' : 'Save Party 1 Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {isVehicular && (
                  <div className="p-5 bg-amber-50/40 border-b border-slate-200 divide-y divide-amber-200/60 text-xs sm:text-sm">
                    <div className="pb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                        Vehicle Details (Impormasyon ng Sasakyan — Single Entity Copy)
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <div className="w-2/3">
                        <span className="text-slate-500 font-medium block text-xs">
                          1. Vehicle Make / Brand (Tatak / Brand ng Sasakyan)
                        </span>
                        <span className="font-bold text-slate-900">
                          {reportData.vehicleMake || reportData.vehicleMakeModel || '—'}
                        </span>
                      </div>
                      <CopyButton
                        value={reportData.vehicleMake || reportData.vehicleMakeModel}
                        label="Vehicle Make / Brand"
                      />
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <div className="w-2/3">
                        <span className="text-slate-500 font-medium block text-xs">
                          2. Vehicle Model (Modelo ng Sasakyan)
                        </span>
                        <span className="font-bold text-slate-900">
                          {reportData.vehicleModel || '—'}
                        </span>
                      </div>
                      <CopyButton value={reportData.vehicleModel} label="Vehicle Model" />
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <div className="w-2/3">
                        <span className="text-slate-500 font-medium block text-xs">
                          3. Vehicle Year Model (Taon ng Sasakyan)
                        </span>
                        <span className="font-bold text-slate-900">
                          {reportData.vehicleYear || '—'}
                        </span>
                      </div>
                      <CopyButton value={reportData.vehicleYear} label="Vehicle Year" />
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <div className="w-2/3">
                        <span className="text-slate-500 font-medium block text-xs">
                          4. Vehicle Color (Kulay — "colored ...")
                        </span>
                        <span className="font-bold text-slate-900">
                          {reportData.vehicleColor || '—'}
                        </span>
                      </div>
                      <CopyButton value={reportData.vehicleColor} label="Vehicle Color" />
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <div className="w-2/3">
                        <span className="text-slate-500 font-medium block text-xs">
                          5. Plate Number (Numero ng Plaka — "bearing plate number ...")
                        </span>
                        <span className="font-bold font-mono text-slate-900">
                          {reportData.plateNumber || '—'}
                        </span>
                      </div>
                      <CopyButton value={reportData.plateNumber} label="Plate Number" />
                    </div>
                  </div>
                )}

                <div className="p-5 divide-y divide-slate-100 text-xs sm:text-sm">
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        1. First Name (Unang Pangalan)
                      </span>
                      <span className="font-bold text-slate-900">
                        {personalInfo.firstName || '—'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.firstName} label="First Name" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        2. Middle Name (Gitnang Pangalan)
                      </span>
                      <span className="font-bold text-slate-900">
                        {personalInfo.middleName || '—'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.middleName} label="Middle Name" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        3. Last Name (Apelyido)
                      </span>
                      <span className="font-bold text-slate-900">
                        {personalInfo.lastName || '—'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.lastName} label="Last Name" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        4. Suffix (Panlapi sa Pangalan)
                      </span>
                      <span className="font-bold text-slate-900">
                        {personalInfo.suffix || 'None'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.suffix} label="Suffix" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        5. Birthday (Araw ng Kapanganakan)
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatHumanDate(personalInfo.birthday) || '—'}
                      </span>
                    </div>
                    <CopyButton value={formatHumanDate(personalInfo.birthday)} label="Birthday" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        6. Age (Edad)
                      </span>
                      <span className="font-bold text-slate-900">
                        {personalInfo.age !== null ? personalInfo.age : '—'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.age} label="Age" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        7. Sex (Kasarian)
                      </span>
                      <span className="font-bold text-slate-900">{personalInfo.sex || '—'}</span>
                    </div>
                    <CopyButton value={personalInfo.sex} label="Sex" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        8. Civil Status (Katayuang Sibil)
                      </span>
                      <span className="font-bold text-slate-900">
                        {personalInfo.civilStatus || '—'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.civilStatus} label="Civil Status" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4 bg-blue-50/20 px-2 rounded">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        9. Occupation (Trabaho)
                      </span>
                      <span className="font-bold text-slate-900">
                        {personalInfo.occupation || '—'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.occupation} label="Occupation" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        10. Nationality (Nasyonalidad)
                      </span>
                      <span className="font-bold text-slate-900">
                        {personalInfo.nationality || '—'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.nationality} label="Nationality" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-3/4">
                      <span className="text-slate-500 font-medium block text-xs">
                        11. Address (Tirahan)
                      </span>
                      <span className="font-bold text-slate-900 whitespace-pre-line">
                        {personalInfo.address || '—'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.address} label="Address" />
                  </div>

                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <div className="w-1/2">
                      <span className="text-slate-500 font-medium block text-xs">
                        12. Contact Number (Numero ng Telepono)
                      </span>
                      <span className="font-bold font-mono text-slate-900">
                        {personalInfo.contactNumber || '—'}
                      </span>
                    </div>
                    <CopyButton value={personalInfo.contactNumber} label="Contact Number" />
                  </div>
                </div>
              </>
            )}

            {reportData.clientInitialRemarks && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase">
                    Initial Statement from Party 1
                  </span>
                  <CopyButton value={reportData.clientInitialRemarks} label="Initial Statement" />
                </div>
                <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">
                  {reportData.clientInitialRemarks}
                </p>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* MERGED PARTIES SECTION: COPY EACH OTHER CLIENT'S FILE & FULL CRUD     */}
          {/* ===================================================================== */}
          {safeMergedParties.map((party, pIndex) => {
            const partyNum = pIndex + 2;
            const pInfo = party.personalInformation || ({} as PersonalInformation);
            const pData = party.reportData || {};
            const partyIsVehicular =
              party.reportType === 'vehicular-incident' ||
              Boolean(pData.vehicleMake || pData.vehicleMakeModel || pData.plateNumber);
            const partyBlotterFormatted = getPartyFormattedEntry(party);
            const partyPlaceAndTime = formatPlaceAndTimeText(pData);
            const partyPlaceVal = getIncidentPlaceValue(pData);
            const partyTimeVal = getIncidentTimeValue(pData);
            const isEditingThisParty = editingPartyId === party.id;

            return (
              <div
                key={party.id}
                className="bg-white rounded-xl border-2 border-indigo-700 shadow-md overflow-hidden"
              >
                {/* Merged Party Header */}
                <div className="px-5 py-3.5 bg-indigo-950 text-white flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-black uppercase">
                      PARTY {partyNum}
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                        {party.partyLabel ||
                          `${pInfo.firstName || ''} ${pInfo.lastName || ''} (#${party.referenceNumber})`}
                      </h3>
                      <p className="text-[11px] text-indigo-200">
                        Original Ref: #{party.referenceNumber} • Merged File — Full Individual Copy & CRUD
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhotoPartyId(party.id);
                        setShowPhotoUploadPanel(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      title="Upload photo specifically for this party"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>

                    {onUpdateCompleteReport && !isEditingThisParty && (
                      <button
                        type="button"
                        onClick={() => startEditingMergedParty(party)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[11px] font-extrabold cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Party {partyNum}</span>
                      </button>
                    )}

                    {onUnmergeParty && (
                      <button
                        type="button"
                        onClick={() => onUnmergeParty(report.id, party.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-200 rounded-lg text-[11px] font-bold border border-indigo-700 cursor-pointer"
                        title="Split this party back out into its own standalone record"
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Unmerge</span>
                      </button>
                    )}

                    {onUpdateCompleteReport && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMergedParty(party)}
                        className="p-1.5 bg-rose-900/60 hover:bg-rose-700 text-rose-200 hover:text-white rounded-lg cursor-pointer"
                        title="Remove this party from combined file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Ready-to-Copy Blotter Box for This Merged Party */}
                <div className="p-4 bg-indigo-50/60 border-b border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-950">
                      Party {partyNum} Official Blotter Format (Copy This Client's File Only):
                    </span>
                    <CopySectionButton
                      sectionTitle={`Party ${partyNum} Blotter Format`}
                      formattedText={partyBlotterFormatted}
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed select-all font-mono bg-white p-3.5 rounded-lg border border-indigo-200 shadow-2xs">
                    {partyBlotterFormatted || '—'}
                  </p>

                  {/* If this merged party also recorded Place or Time of Incident */}
                  {(partyPlaceVal || partyTimeVal) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs">
                        <span className="font-black uppercase text-amber-900 block">
                          Party {partyNum} Submitted Place & Time:
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {partyPlaceVal ? `Place: ${partyPlaceVal}` : ''}{' '}
                          {partyTimeVal ? `| Time: ${partyTimeVal}` : ''}
                        </span>
                      </div>
                      <CopyButton
                        value={partyPlaceAndTime}
                        label={`Party ${partyNum} Place & Time`}
                      />
                    </div>
                  )}
                </div>

                {/* Inline Full CRUD Editor for This Merged Party */}
                {isEditingThisParty ? (
                  <div className="p-5 bg-amber-50/40 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Party Label / Role
                        </label>
                        <input
                          type="text"
                          value={editPartyLabel}
                          onChange={(e) => setEditPartyLabel(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Party Type
                        </label>
                        <select
                          value={editPartyReportType}
                          onChange={(e) => setEditPartyReportType(e.target.value as ReportTypeId)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        >
                          <option value="vehicular-incident">Vehicular Accident</option>
                          <option value="personal-intake">Personal Information</option>
                        </select>
                      </div>
                    </div>

                    {editPartyReportType === 'vehicular-incident' && (
                      <div className="p-3.5 bg-white rounded-xl border border-amber-300 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Vehicle Make / Brand
                          </label>
                          <input
                            type="text"
                            value={editPartyReportData.vehicleMake || ''}
                            onChange={(e) =>
                              setEditPartyReportData((prev) => ({
                                ...prev,
                                vehicleMake: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Vehicle Model
                          </label>
                          <input
                            type="text"
                            value={editPartyReportData.vehicleModel || ''}
                            onChange={(e) =>
                              setEditPartyReportData((prev) => ({
                                ...prev,
                                vehicleModel: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Vehicle Year
                          </label>
                          <input
                            type="text"
                            value={editPartyReportData.vehicleYear || ''}
                            onChange={(e) =>
                              setEditPartyReportData((prev) => ({
                                ...prev,
                                vehicleYear: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Vehicle Color
                          </label>
                          <input
                            type="text"
                            value={editPartyReportData.vehicleColor || ''}
                            onChange={(e) =>
                              setEditPartyReportData((prev) => ({
                                ...prev,
                                vehicleColor: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Plate Number
                          </label>
                          <input
                            type="text"
                            value={editPartyReportData.plateNumber || ''}
                            onChange={(e) =>
                              setEditPartyReportData((prev) => ({
                                ...prev,
                                plateNumber: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={editPartyPersonalInfo.firstName}
                          onChange={(e) =>
                            setEditPartyPersonalInfo((p) => ({ ...p, firstName: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Middle Name
                        </label>
                        <input
                          type="text"
                          value={editPartyPersonalInfo.middleName}
                          onChange={(e) =>
                            setEditPartyPersonalInfo((p) => ({ ...p, middleName: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={editPartyPersonalInfo.lastName}
                          onChange={(e) =>
                            setEditPartyPersonalInfo((p) => ({ ...p, lastName: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Birthday
                        </label>
                        <input
                          type="date"
                          value={editPartyPersonalInfo.birthday}
                          onChange={(e) => {
                            const bday = e.target.value;
                            const computedAge = calculateAgeFromBirthday(bday);
                            setEditPartyPersonalInfo((p) => ({
                              ...p,
                              birthday: bday,
                              age: computedAge !== null ? computedAge : p.age,
                            }));
                          }}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          value={editPartyPersonalInfo.age ?? ''}
                          onChange={(e) =>
                            setEditPartyPersonalInfo((p) => ({
                              ...p,
                              age: e.target.value ? Number(e.target.value) : null,
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Sex
                        </label>
                        <select
                          value={editPartyPersonalInfo.sex}
                          onChange={(e) =>
                            setEditPartyPersonalInfo((p) => ({ ...p, sex: e.target.value as any }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Civil Status
                        </label>
                        <select
                          value={editPartyPersonalInfo.civilStatus}
                          onChange={(e) =>
                            setEditPartyPersonalInfo((p) => ({
                              ...p,
                              civilStatus: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        >
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Separated">Separated</option>
                          <option value="Annulled">Annulled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Occupation
                        </label>
                        <input
                          type="text"
                          value={editPartyPersonalInfo.occupation}
                          onChange={(e) =>
                            setEditPartyPersonalInfo((p) => ({ ...p, occupation: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          value={editPartyPersonalInfo.contactNumber}
                          onChange={(e) =>
                            setEditPartyPersonalInfo((p) => ({
                              ...p,
                              contactNumber: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          value={editPartyPersonalInfo.address}
                          onChange={(e) =>
                            setEditPartyPersonalInfo((p) => ({ ...p, address: e.target.value }))
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPartyId(null)}
                        className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingPartyCRUD}
                        onClick={() => handleSaveMergedPartyCRUD(party.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingPartyCRUD ? 'Saving...' : `Save Party ${partyNum}`}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Vehicle Fields for Merged Party */}
                    {partyIsVehicular && (
                      <div className="p-5 bg-amber-50/40 border-b border-slate-200 divide-y divide-amber-200/60 text-xs sm:text-sm">
                        <div className="pb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                            Party {partyNum} Vehicle Details (Single Entity Copy)
                          </span>
                        </div>
                        <div className="py-2 flex items-center justify-between gap-4">
                          <div className="w-2/3">
                            <span className="text-slate-500 font-medium block text-xs">
                              1. Vehicle Make / Brand
                            </span>
                            <span className="font-bold text-slate-900">
                              {pData.vehicleMake || pData.vehicleMakeModel || '—'}
                            </span>
                          </div>
                          <CopyButton
                            value={pData.vehicleMake || pData.vehicleMakeModel}
                            label={`Party ${partyNum} Vehicle Make`}
                          />
                        </div>
                        <div className="py-2 flex items-center justify-between gap-4">
                          <div className="w-2/3">
                            <span className="text-slate-500 font-medium block text-xs">
                              2. Vehicle Model
                            </span>
                            <span className="font-bold text-slate-900">
                              {pData.vehicleModel || '—'}
                            </span>
                          </div>
                          <CopyButton
                            value={pData.vehicleModel}
                            label={`Party ${partyNum} Vehicle Model`}
                          />
                        </div>
                        <div className="py-2 flex items-center justify-between gap-4">
                          <div className="w-2/3">
                            <span className="text-slate-500 font-medium block text-xs">
                              3. Vehicle Year
                            </span>
                            <span className="font-bold text-slate-900">
                              {pData.vehicleYear || '—'}
                            </span>
                          </div>
                          <CopyButton
                            value={pData.vehicleYear}
                            label={`Party ${partyNum} Vehicle Year`}
                          />
                        </div>
                        <div className="py-2 flex items-center justify-between gap-4">
                          <div className="w-2/3">
                            <span className="text-slate-500 font-medium block text-xs">
                              4. Vehicle Color
                            </span>
                            <span className="font-bold text-slate-900">
                              {pData.vehicleColor || '—'}
                            </span>
                          </div>
                          <CopyButton
                            value={pData.vehicleColor}
                            label={`Party ${partyNum} Vehicle Color`}
                          />
                        </div>
                        <div className="py-2 flex items-center justify-between gap-4">
                          <div className="w-2/3">
                            <span className="text-slate-500 font-medium block text-xs">
                              5. Plate Number
                            </span>
                            <span className="font-bold font-mono text-slate-900">
                              {pData.plateNumber || '—'}
                            </span>
                          </div>
                          <CopyButton
                            value={pData.plateNumber}
                            label={`Party ${partyNum} Plate Number`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Personal Info Fields for Merged Party */}
                    <div className="p-5 divide-y divide-slate-100 text-xs sm:text-sm">
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="w-1/2">
                          <span className="text-slate-500 font-medium block text-xs">
                            1. First Name
                          </span>
                          <span className="font-bold text-slate-900">{pInfo.firstName || '—'}</span>
                        </div>
                        <CopyButton
                          value={pInfo.firstName}
                          label={`Party ${partyNum} First Name`}
                        />
                      </div>
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="w-1/2">
                          <span className="text-slate-500 font-medium block text-xs">
                            2. Middle Name
                          </span>
                          <span className="font-bold text-slate-900">
                            {pInfo.middleName || '—'}
                          </span>
                        </div>
                        <CopyButton
                          value={pInfo.middleName}
                          label={`Party ${partyNum} Middle Name`}
                        />
                      </div>
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="w-1/2">
                          <span className="text-slate-500 font-medium block text-xs">
                            3. Last Name
                          </span>
                          <span className="font-bold text-slate-900">{pInfo.lastName || '—'}</span>
                        </div>
                        <CopyButton value={pInfo.lastName} label={`Party ${partyNum} Last Name`} />
                      </div>
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="w-1/2">
                          <span className="text-slate-500 font-medium block text-xs">
                            5. Birthday
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatHumanDate(pInfo.birthday) || '—'}
                          </span>
                        </div>
                        <CopyButton
                          value={formatHumanDate(pInfo.birthday)}
                          label={`Party ${partyNum} Birthday`}
                        />
                      </div>
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="w-1/2">
                          <span className="text-slate-500 font-medium block text-xs">6. Age</span>
                          <span className="font-bold text-slate-900">
                            {pInfo.age !== null && pInfo.age !== undefined ? pInfo.age : '—'}
                          </span>
                        </div>
                        <CopyButton value={pInfo.age} label={`Party ${partyNum} Age`} />
                      </div>
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="w-1/2">
                          <span className="text-slate-500 font-medium block text-xs">7. Sex</span>
                          <span className="font-bold text-slate-900">{pInfo.sex || '—'}</span>
                        </div>
                        <CopyButton value={pInfo.sex} label={`Party ${partyNum} Sex`} />
                      </div>
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="w-1/2">
                          <span className="text-slate-500 font-medium block text-xs">
                            8. Civil Status
                          </span>
                          <span className="font-bold text-slate-900">
                            {pInfo.civilStatus || '—'}
                          </span>
                        </div>
                        <CopyButton
                          value={pInfo.civilStatus}
                          label={`Party ${partyNum} Civil Status`}
                        />
                      </div>
                      <div className="py-2 flex items-center justify-between gap-4 bg-indigo-50/30 px-2 rounded">
                        <div className="w-1/2">
                          <span className="text-slate-500 font-medium block text-xs">
                            9. Occupation
                          </span>
                          <span className="font-bold text-slate-900">
                            {pInfo.occupation || '—'}
                          </span>
                        </div>
                        <CopyButton
                          value={pInfo.occupation}
                          label={`Party ${partyNum} Occupation`}
                        />
                      </div>
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="w-3/4">
                          <span className="text-slate-500 font-medium block text-xs">
                            11. Address
                          </span>
                          <span className="font-bold text-slate-900 whitespace-pre-line">
                            {pInfo.address || '—'}
                          </span>
                        </div>
                        <CopyButton value={pInfo.address} label={`Party ${partyNum} Address`} />
                      </div>
                      <div className="py-2 flex items-center justify-between gap-4">
                        <div className="w-1/2">
                          <span className="text-slate-500 font-medium block text-xs">
                            12. Contact Number
                          </span>
                          <span className="font-bold font-mono text-slate-900">
                            {pInfo.contactNumber || '—'}
                          </span>
                        </div>
                        <CopyButton
                          value={pInfo.contactNumber}
                          label={`Party ${partyNum} Contact Number`}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* CLIENT VALID ID / CAPTURED PHOTO GALLERY (WITH UPLOAD TO FILE, PARTY TAGS & DOWNLOAD) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                    Case File Photos, Valid IDs & Evidence ({safeAttachments.length})
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Conflict-free photo gallery for all combined parties • Upload, View & Download
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowPhotoUploadPanel((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload / Capture Photo to File</span>
                </button>
              </div>
            </div>

            <div className="p-5">
              {safeAttachments.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <ImageIcon className="w-7 h-7 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    No Valid ID or Live Photo attached to this file yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPhotoUploadPanel(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Photo to This File Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {safeAttachments.map((att) => {
                    const photoSrc = att.url || att.previewUrl || '';
                    const isPdf = (att.type || '').toLowerCase().includes('pdf');
                    const downloadFileName = `${att.partyReferenceNumber || report.referenceNumber}_${
                      (personalInfo.lastName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_')
                    }_${att.name || 'Photo.jpg'}`;
                    const itemFolder =
                      att.cloudinaryFolder ||
                      buildClientCloudinaryFolder(
                        report.reportType,
                        att.partyReferenceNumber || report.referenceNumber,
                        [personalInfo.lastName, personalInfo.firstName, personalInfo.middleName]
                          .filter(Boolean)
                          .join('_')
                      );

                    return (
                      <div
                        key={att.id}
                        className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          {/* Large Visual Photo Preview */}
                          {photoSrc && !isPdf ? (
                            <div
                              onClick={() => setPreviewAttachment(att)}
                              className="relative group cursor-pointer bg-slate-900 aspect-video w-full overflow-hidden flex items-center justify-center"
                            >
                              <img
                                src={photoSrc}
                                alt={att.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 text-slate-900 rounded-lg text-xs font-extrabold shadow-md transition-opacity">
                                  <ZoomIn className="w-3.5 h-3.5 text-blue-700" />
                                  <span>View Full Size</span>
                                </span>
                              </div>
                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-xs ${
                                    att.sourceType === 'live_capture'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-blue-800 text-white'
                                  }`}
                                >
                                  {att.sourceType === 'live_capture' ? 'LIVE CAPTURE' : 'PHOTO / ID'}
                                </span>
                                {att.partyLabel && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs truncate max-w-[180px]">
                                    {att.partyLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video w-full bg-slate-100 flex flex-col items-center justify-center text-slate-500 p-4">
                              <File className="w-10 h-10 text-rose-600 mb-1" />
                              <span className="text-xs font-bold text-slate-700">{att.name}</span>
                            </div>
                          )}

                          {/* Metadata & Folder Info */}
                          <div className="p-3.5 space-y-1">
                            <p className="text-xs font-extrabold text-slate-900 truncate" title={att.name}>
                              {att.name}
                            </p>
                            {att.partyLabel && (
                              <p className="text-[11px] font-bold text-indigo-800 truncate">
                                Owner: {att.partyLabel}
                              </p>
                            )}
                            <p className="text-[10px] font-mono text-slate-500 truncate" title={itemFolder}>
                              Folder: {itemFolder}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: View & Download & Delete */}
                        <div className="px-3.5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {photoSrc && !isPdf && (
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment(att)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                <ZoomIn className="w-3.5 h-3.5 text-blue-700" />
                                <span>View</span>
                              </button>
                            )}
                            {photoSrc && (
                              <button
                                type="button"
                                onClick={() => downloadAttachmentFile(photoSrc, downloadFileName)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                title="Download Client Photo to Device"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            )}
                          </div>

                          {onDeleteAttachment && (
                            <button
                              type="button"
                              onClick={() => onDeleteAttachment(report.id, att.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete attachment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* OFFICIAL INVESTIGATION DETAILS & REPORT SECTIONS ("The Rest Will Be Ours") */}
          <div className="space-y-4">
            <div className="bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-300" />
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                  Police Investigation Entry ("The Rest Will Be Ours")
                </span>
              </div>

              {!isEditingInvestigation ? (
                <button
                  type="button"
                  onClick={() => setIsEditingInvestigation(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Edit / Enter Investigation Details</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInvestigationData}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Report</span>
                  </button>
                </div>
              )}
            </div>

            {/* Officer Editing Mode */}
            {isEditingInvestigation && reportConfig && (
              <div className="bg-white border-2 border-blue-600 rounded-xl p-5 shadow-lg space-y-6 animate-fadeIn">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-blue-950 uppercase">
                      Enter Investigation Fields for {reportConfig.nameEn}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Officer in charge can complete vehicle information, time, location, incident narrative, other party, and witnesses below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveInvestigationData}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Update</span>
                  </button>
                </div>

                <DynamicReportFields
                  sections={reportConfig.sections}
                  values={editableReportData}
                  onChange={(fieldId, val) =>
                    setEditableReportData((prev) => ({ ...prev, [fieldId]: val }))
                  }
                />

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInvestigationData}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    Save Investigation Data
                  </button>
                </div>
              </div>
            )}

            {/* Inspection Mode with Individual COPY buttons for every field */}
            {!isEditingInvestigation && reportConfig && (
              <div className="space-y-4">
                {reportConfig.sections.map((sec) => {
                  const fieldPairs = sec.fields.map((f) => ({
                    label: f.labelEn,
                    value:
                      f.type === 'date' ? formatHumanDate(reportData[f.id]) : reportData[f.id],
                  }));
                  const sectionFormatted = formatSectionText(sec.titleEn, fieldPairs);

                  return (
                    <div
                      key={sec.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                    >
                      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase">
                            {sec.titleEn} ({sec.titleFil})
                          </h3>
                        </div>
                        <CopySectionButton
                          sectionTitle={sec.titleEn}
                          formattedText={sectionFormatted}
                        />
                      </div>

                      <div className="p-5 divide-y divide-slate-100 text-xs sm:text-sm">
                        {sec.fields.map((field) => {
                          const rawVal = reportData[field.id];
                          const displayVal =
                            field.type === 'date'
                              ? formatHumanDate(rawVal)
                              : rawVal !== undefined && rawVal !== null
                              ? String(rawVal)
                              : '';

                          return (
                            <div
                              key={field.id}
                              className="py-2.5 flex items-start justify-between gap-4"
                            >
                              <div className="w-3/4">
                                <span className="text-slate-500 font-medium block text-xs">
                                  {field.labelEn} ({field.labelFil})
                                </span>
                                <span
                                  className={`font-bold mt-0.5 block whitespace-pre-line ${
                                    displayVal
                                      ? 'text-slate-900'
                                      : 'text-slate-400 italic font-normal'
                                  }`}
                                >
                                  {displayVal ||
                                    '— Not recorded yet (Click "Edit / Enter Investigation Details" above)'}
                                </span>
                              </div>
                              <CopyButton
                                value={displayVal}
                                label={`${field.labelEn} (${field.labelFil})`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Duplicate of COPY COMPLETE REPORT */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Export Complete Formatted Report ({totalPartiesCount} {totalPartiesCount === 1 ? 'Party' : 'Parties'})
            </span>
            <CopyReportButton
              reportText={completeReportFormatted}
              referenceNumber={report.referenceNumber}
              size="md"
            />
          </div>
        </div>

        {/* Right 1 Column: Combined Parties Quick List, Google Drive, Attachments, Internal Admin Notes & Audit Log */}
        <div className="space-y-6">
          {/* COMBINED FILE MULTI-PARTY MANAGER WIDGET */}
          <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-300" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Parties in This Single File ({totalPartiesCount})
                </h3>
              </div>
              {onMergeReports && (
                <button
                  type="button"
                  onClick={() => setShowMergeModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  <GitMerge className="w-3 h-3 text-amber-300" />
                  <span>Merge Record</span>
                </button>
              )}
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-900 block">
                    Party 1 (Primary File #{report.referenceNumber})
                  </span>
                  <span className="font-bold text-slate-900">
                    {personalInfo.firstName} {personalInfo.lastName}
                  </span>
                </div>
                <CopyButton value={primaryFormattedEntry} label="Party 1 Blotter" />
              </div>

              {safeMergedParties.map((mp, idx) => (
                <div
                  key={mp.id}
                  className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase text-indigo-900 block truncate">
                      Party {idx + 2} (#{mp.referenceNumber})
                    </span>
                    <span className="font-bold text-slate-900 block truncate">
                      {mp.personalInformation?.firstName} {mp.personalInformation?.lastName}
                    </span>
                  </div>
                  <CopyButton
                    value={getPartyFormattedEntry(mp)}
                    label={`Party ${idx + 2} Blotter`}
                  />
                </div>
              ))}

              <div className="pt-2 flex flex-col gap-2">
                {onMergeReports && (
                  <button
                    type="button"
                    onClick={() => setShowMergeModal(true)}
                    className="w-full py-2 px-3 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <GitMerge className="w-3.5 h-3.5 text-amber-300" />
                    <span>Combine Another Submitted Document</span>
                  </button>
                )}
                {onUpdateCompleteReport && (
                  <button
                    type="button"
                    onClick={() => setShowAddPartyModal(true)}
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Add New Party Manually (CRUD)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GOOGLE DRIVE CASE DOCUMENTS (CLASSIFIED WORD/PDF VAULT) */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Google Drive Case Files ({driveFiles.length})
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                {isDriveConnected && (
                  <button
                    type="button"
                    onClick={() => setShowDriveUpload(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add File</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={loadCaseDriveFiles}
                  title="Refresh case drive files"
                  className="p-1 text-blue-300 hover:text-white rounded transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {!isDriveConnected ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-slate-600">
                    Connect Google Drive to attach Word documents (.docx), PDFs, and sworn statements to this case.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectDrive}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Connect Google Drive</span>
                  </button>
                </div>
              ) : isLoadingDrive ? (
                <div className="text-center py-4 space-y-2 text-xs text-slate-500">
                  <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
                  <p>Searching Google Drive for case files...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-slate-400 italic">
                    No Google Drive documents attached to #{report.referenceNumber} yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDriveUpload(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold rounded-lg border border-blue-200 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Case Word/PDF to Drive</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {driveFiles.map((df) => {
                    const badge = getFileTypeBadge(df.mimeType, df.name);
                    const catObj = DRIVE_CLASSIFICATIONS.find(
                      (c) => c.id === df.properties?.category
                    );
                    return (
                      <div
                        key={df.id}
                        className="p-3 bg-slate-50 hover:bg-blue-50/40 border border-slate-200 rounded-xl space-y-1.5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${badge.bg} ${badge.text}`}
                            >
                              {badge.label}
                            </span>
                            {catObj && (
                              <span className="text-[10px] font-bold text-slate-600">
                                {catObj.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {df.webViewLink && (
                              <a
                                href={df.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100/60 rounded"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setFileToDelete(df)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Delete from Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs font-bold text-slate-900 truncate" title={df.name}>
                          {df.name}
                        </p>
                        {df.properties?.notes && (
                          <p className="text-[10px] text-slate-500 italic truncate">
                            "{df.properties.notes}"
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                          <span>{formatFileSize(df.size)}</span>
                          <span>{formatHumanDateTime(df.modifiedTime || df.createdTime)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* INTERNAL ADMIN NOTES (WITH CREATE & DELETE CRUD) */}
          <div className="bg-amber-50/40 rounded-xl border border-amber-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-amber-100/60 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-800" />
                <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  INTERNAL POLICE NOTES
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
                Confidential
              </span>
            </div>

            <div className="p-4 space-y-4">
              <form onSubmit={handleNoteSubmit} className="space-y-2">
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record case updates, investigator assignment, or blotter entry number..."
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNote.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post Note</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2.5 pt-2">
                {safeAdminNotes.length === 0 ? (
                  <p className="text-xs text-amber-900/60 italic">No internal notes added yet.</p>
                ) : (
                  safeAdminNotes.map((note, idx) => (
                    <div
                      key={note.id || idx}
                      className="p-3 bg-white border border-amber-200 rounded-lg text-xs shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-amber-900">{note.authorEmail}</span>
                        <div className="flex items-center gap-2">
                          <span>{formatHumanDateTime(note.createdAt)}</span>
                          {onDeleteNote && note.id && (
                            <button
                              type="button"
                              onClick={() => onDeleteNote(report.id, note.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                        {note.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* AUDIT LOG PREVIEW */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Audit Trail ({safeAuditLogs.length})
              </h3>
            </div>

            <div className="p-4 max-h-56 overflow-y-auto space-y-2 text-xs">
              {safeAuditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No audit entries recorded.</p>
              ) : (
                safeAuditLogs.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-2 bg-slate-50 border border-slate-100 rounded text-[11px]"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="font-semibold text-blue-900">{log.action}</span>
                      <span>{formatHumanDateTime(log.timestamp)}</span>
                    </div>
                    <p className="text-slate-700 mt-1">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: MERGE / COMBINE OTHER SUBMITTED DOCUMENTS INTO THIS SINGLE FILE    */}
      {/* ========================================================================= */}
      {showMergeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => !isMergingRecords && setShowMergeModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GitMerge className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                    Combine Submitted Client Documents into File #{report.referenceNumber}
                  </h3>
                  <p className="text-[11px] text-indigo-200">
                    Merges selected records & photos into this single file without conflict or nested errors
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isMergingRecords && setShowMergeModal(false)}
                className="p-1.5 text-indigo-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950">
                <strong>Primary Destination File:</strong> #{report.referenceNumber} —{' '}
                {personalInfo.firstName} {personalInfo.lastName} ({reportConfig?.nameEn})
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mergeSearchQuery}
                  onChange={(e) => setMergeSearchQuery(e.target.value)}
                  placeholder="Search other submitted client records by name, reference #, or plate number..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              {mergeableReports.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No other standalone client submissions found to merge.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {mergeableReports.map((cand) => {
                    const isChecked = selectedIdsToMerge.includes(cand.id);
                    const cPi = cand.personalInformation || ({} as PersonalInformation);
                    const cData = cand.reportData || {};
                    return (
                      <label
                        key={cand.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-600'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setSelectedIdsToMerge((prev) =>
                              prev.includes(cand.id)
                                ? prev.filter((id) => id !== cand.id)
                                : [...prev, cand.id]
                            )
                          }
                          className="mt-1 w-4 h-4 accent-indigo-700 rounded cursor-pointer"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-black text-slate-900">
                              {cPi.firstName} {cPi.middleName} {cPi.lastName} (#{cand.referenceNumber})
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {cand.reportType === 'vehicular-incident'
                                ? 'Vehicular Accident'
                                : 'Personal Info'}
                            </span>
                          </div>
                          {cData.plateNumber && (
                            <p className="text-[11px] font-mono text-amber-900 font-bold mt-0.5">
                              Vehicle: {cData.vehicleMake || cData.vehicleMakeModel}{' '}
                              {cData.vehicleModel} ({cData.plateNumber})
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            Address: {cPi.address || '—'} • Submitted:{' '}
                            {formatHumanDateTime(cand.createdAt)}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-emerald-950">
                    All Original Client Files Remain 100% Untouched
                  </span>
                  <span className="text-[11px] text-emerald-800 block mt-0.5">
                    Merging creates/updates a dedicated record in the <strong>Merged Files Section</strong> while keeping every original client file intact in the <strong>Original Client Submissions</strong> section.
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isMergingRecords}
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMergingRecords || selectedIdsToMerge.length === 0}
                onClick={handleConfirmMergeInsideDetail}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-900 hover:bg-indigo-950 disabled:bg-slate-300 text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer"
              >
                <GitMerge className="w-4 h-4 text-amber-300" />
                <span>
                  {isMergingRecords
                    ? 'Creating Merged File...'
                    : `Merge ${selectedIdsToMerge.length} Selected into Merged File`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW PARTY MANUALLY TO COMBINED FILE (FULL CREATE CRUD)         */}
      {/* ========================================================================= */}
      {showAddPartyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => !isSavingPartyCRUD && setShowAddPartyModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                    Add New Party to Combined File #{report.referenceNumber}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Create another involved driver, passenger, or client inside this single file
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSavingPartyCRUD && setShowAddPartyModal(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPartyInFile} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Party Role / Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={newPartyLabel}
                    onChange={(e) => setNewPartyLabel(e.target.value)}
                    placeholder="e.g. Party 2 (Second Driver / Involved Vehicle)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Format Type
                  </label>
                  <select
                    value={newPartyReportType}
                    onChange={(e) => setNewPartyReportType(e.target.value as ReportTypeId)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="vehicular-incident">Vehicular Accident</option>
                    <option value="personal-intake">Personal Information</option>
                  </select>
                </div>
              </div>

              {newPartyReportType === 'vehicular-incident' && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Vehicle Make / Brand
                    </label>
                    <input
                      type="text"
                      value={newPartyReportData.vehicleMake || ''}
                      onChange={(e) =>
                        setNewPartyReportData((p) => ({ ...p, vehicleMake: e.target.value }))
                      }
                      placeholder="e.g. Toyota"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      2. Vehicle Model
                    </label>
                    <input
                      type="text"
                      value={newPartyReportData.vehicleModel || ''}
                      onChange={(e) =>
                        setNewPartyReportData((p) => ({ ...p, vehicleModel: e.target.value }))
                      }
                      placeholder="e.g. Vios"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      3. Year Model
                    </label>
                    <input
                      type="text"
                      value={newPartyReportData.vehicleYear || ''}
                      onChange={(e) =>
                        setNewPartyReportData((p) => ({ ...p, vehicleYear: e.target.value }))
                      }
                      placeholder="e.g. 2024"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      4. Color
                    </label>
                    <input
                      type="text"
                      value={newPartyReportData.vehicleColor || ''}
                      onChange={(e) =>
                        setNewPartyReportData((p) => ({ ...p, vehicleColor: e.target.value }))
                      }
                      placeholder="e.g. silver metallic"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      5. Plate Number
                    </label>
                    <input
                      type="text"
                      value={newPartyReportData.plateNumber || ''}
                      onChange={(e) =>
                        setNewPartyReportData((p) => ({ ...p, plateNumber: e.target.value }))
                      }
                      placeholder="e.g. ABC 1234"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartyPersonalInfo.firstName}
                    onChange={(e) =>
                      setNewPartyPersonalInfo((p) => ({ ...p, firstName: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={newPartyPersonalInfo.middleName}
                    onChange={(e) =>
                      setNewPartyPersonalInfo((p) => ({ ...p, middleName: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartyPersonalInfo.lastName}
                    onChange={(e) =>
                      setNewPartyPersonalInfo((p) => ({ ...p, lastName: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Birthday
                  </label>
                  <input
                    type="date"
                    value={newPartyPersonalInfo.birthday}
                    onChange={(e) => {
                      const bday = e.target.value;
                      const age = calculateAgeFromBirthday(bday);
                      setNewPartyPersonalInfo((p) => ({
                        ...p,
                        birthday: bday,
                        age: age !== null ? age : p.age,
                      }));
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={newPartyPersonalInfo.age ?? ''}
                    onChange={(e) =>
                      setNewPartyPersonalInfo((p) => ({
                        ...p,
                        age: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Sex</label>
                  <select
                    value={newPartyPersonalInfo.sex}
                    onChange={(e) =>
                      setNewPartyPersonalInfo((p) => ({ ...p, sex: e.target.value as any }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Civil Status
                  </label>
                  <select
                    value={newPartyPersonalInfo.civilStatus}
                    onChange={(e) =>
                      setNewPartyPersonalInfo((p) => ({
                        ...p,
                        civilStatus: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={newPartyPersonalInfo.occupation}
                    onChange={(e) =>
                      setNewPartyPersonalInfo((p) => ({ ...p, occupation: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={newPartyPersonalInfo.contactNumber}
                    onChange={(e) =>
                      setNewPartyPersonalInfo((p) => ({ ...p, contactNumber: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Complete Address
                  </label>
                  <input
                    type="text"
                    value={newPartyPersonalInfo.address}
                    onChange={(e) =>
                      setNewPartyPersonalInfo((p) => ({ ...p, address: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPartyCRUD}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSavingPartyCRUD ? 'Adding Party...' : 'Add Party to Combined File'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive confirmation dialog */}
      {showStatusConfirm === 'ARCHIVED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Archive This Record?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Archived records are retained securely and can be restored at any time. Public clients will not have access.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowStatusConfirm(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('ARCHIVED')}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  Confirm Permanent Deletion
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-200 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
                title="Cancel and close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="text-sm font-semibold text-slate-900">
                Are you sure you want to permanently erase this report?
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="font-mono font-bold text-rose-900 block text-xs">
                  Reference: #{report.referenceNumber}
                </span>
                <span className="text-slate-600 block text-[11px]">
                  Client: {report.personalInformation.firstName}{' '}
                  {report.personalInformation.lastName}
                </span>
              </div>
              <p className="text-rose-700 font-medium">
                Warning: This will permanently delete this document and attached notes from the Cloud Firestore database. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (onDeleteReport) {
                      setIsDeleting(true);
                      await onDeleteReport(report.id);
                      setIsDeleting(false);
                      setShowDeleteModal(false);
                      onBack();
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Erasing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Delete (Permanent)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Google Drive File Upload Modal */}
      {showDriveUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Upload Case File to Google Drive
                  </h3>
                  <p className="text-[11px] text-slate-500">Ref #{report.referenceNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isUploadingDrive && setShowDriveUpload(false)}
                disabled={isUploadingDrive}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadCaseDriveFile} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Document / Evidence File <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  accept=".doc,.docx,.pdf,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.zip"
                  className="w-full text-xs text-slate-700 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Classification Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {DRIVE_CLASSIFICATIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      [{cat.code}] {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Notes / Document Summary
                </label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="e.g. Sworn affidavit of witness taken on Oct 5..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriveUpload(false)}
                  disabled={isUploadingDrive}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingDrive || !uploadFile}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isUploadingDrive ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Drive...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload to Google Drive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Drive File Confirmation Dialog */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Delete File from Google Drive?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">{fileToDelete.name}</strong> from Google Drive?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeletingDriveFile}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDriveFile}
                disabled={isDeletingDriveFile}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
              >
                {isDeletingDriveFile ? 'Deleting...' : 'Delete File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Client Photo Lightbox Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="relative bg-slate-900 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-700 space-y-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block truncate">
                  {previewAttachment.cloudinaryFolder ||
                    buildClientCloudinaryFolder(
                      report.reportType,
                      previewAttachment.partyReferenceNumber || report.referenceNumber,
                      [personalInfo.lastName, personalInfo.firstName, personalInfo.middleName]
                        .filter(Boolean)
                        .join('_')
                    )}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold truncate">
                  {previewAttachment.name} —{' '}
                  {previewAttachment.partyLabel ||
                    `${personalInfo.lastName}, ${personalInfo.firstName} (#${report.referenceNumber})`}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    downloadAttachmentFile(
                      previewAttachment.url || previewAttachment.previewUrl || '',
                      `${previewAttachment.partyReferenceNumber || report.referenceNumber}_${(
                        personalInfo.lastName || 'Client'
                      ).replace(/[^a-zA-Z0-9_-]/g, '_')}_${previewAttachment.name || 'Photo.jpg'}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-colors"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-black rounded-xl overflow-hidden max-h-[75vh] flex items-center justify-center p-2">
              <img
                src={previewAttachment.url || previewAttachment.previewUrl}
                alt={previewAttachment.name}
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
