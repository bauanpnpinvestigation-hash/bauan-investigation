import React, { useState, useEffect } from 'react';
import { ReportSubmission, ReportStatus } from '../../types/reports';
import { REPORT_TYPES } from '../../config/reportTypes';
import { CopyButton } from '../common/CopyButton';
import { CopySectionButton } from '../common/CopySectionButton';
import { CopyReportButton } from '../common/CopyReportButton';
import { StatusBadge } from '../common/StatusBadge';
import { DynamicReportFields } from '../form/DynamicReportFields';
import { formatPersonalInformationText, formatSectionText } from '../../utils/formatters';
import { formatHumanDate, formatHumanDateTime } from '../../utils/dateUtils';
import { 
  getGoogleDriveAccessToken, 
  connectGoogleDriveAccount 
} from '../../services/firebase';
import { 
  listGoogleDriveFiles, 
  uploadFileToGoogleDrive, 
  deleteFileFromGoogleDrive, 
  DriveRecordFile, 
  DRIVE_CLASSIFICATIONS, 
  getFileTypeBadge, 
  formatFileSize 
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
  RefreshCw
} from 'lucide-react';

interface AdminReportDetailProps {
  report: ReportSubmission;
  onBack: () => void;
  onUpdateStatus: (reportId: string, newStatus: ReportStatus) => void;
  onUpdateReportData?: (reportId: string, updatedData: Record<string, any>) => void;
  onAddNote: (reportId: string, noteText: string) => void;
  onDeleteReport?: (reportId: string) => void;
  onDeleteAttachment?: (reportId: string, attachmentId: string) => void;
  currentAdminEmail?: string;
}

export const AdminReportDetail: React.FC<AdminReportDetailProps> = ({
  report,
  onBack,
  onUpdateStatus,
  onUpdateReportData,
  onAddNote,
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
  const [editableReportData, setEditableReportData] = useState<Record<string, any>>(report.reportData || {});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Google Drive Integration for this specific Case
  const [driveFiles, setDriveFiles] = useState<DriveRecordFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(() => !!getGoogleDriveAccessToken());
  const [showDriveUpload, setShowDriveUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>(DRIVE_CLASSIFICATIONS[0].id);
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<DriveRecordFile | null>(null);
  const [isDeletingDriveFile, setIsDeletingDriveFile] = useState(false);

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
    loadCaseDriveFiles();
  }, [report.referenceNumber]);

  const handleConnectDrive = async () => {
    try {
      const result = await connectGoogleDriveAccount();
      if (result) {
        setIsDriveConnected(true);
        await loadCaseDriveFiles();
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      alert(err.message || 'Google Drive connection failed.');
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
      alert(err.message || 'Failed to upload to Google Drive.');
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
      alert(err.message || 'Failed to delete file from Google Drive.');
    } finally {
      setIsDeletingDriveFile(false);
    }
  };

  const reportConfig = REPORT_TYPES[report.reportType];
  const personalInfo = report.personalInformation;
  const reportData = report.reportData || {};

  // Formatted plain texts for copy buttons
  const personalInfoFormatted = formatPersonalInformationText(personalInfo);
  const completeReportFormatted = reportConfig 
    ? reportConfig.generateTemplate(personalInfo, reportData, report.referenceNumber)
    : '';

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
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2500);
    }
  };

  const handleCancelEditing = () => {
    setEditableReportData(report.reportData || {});
    setIsEditingInvestigation(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to request list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                REQUEST #{report.referenceNumber}
              </h2>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Report Type: <span className="font-bold text-slate-700">{reportConfig?.nameEn || report.reportType}</span> • Intake Date: {formatHumanDateTime(report.createdAt)}
            </p>
          </div>
        </div>

        {/* Prominent Action Buttons & Close (X) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
              <span className="hidden sm:inline">Delete Record</span>
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
              Investigation Workflow Status
            </span>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-300">
              <span>Status: <strong className="text-white font-mono text-sm">{report.status}</strong></span>
              {report.completedAt && (
                <span className="text-emerald-400">
                  Completed: {formatHumanDateTime(report.completedAt)}
                </span>
              )}
              {report.archivedAt && (
                <span className="text-slate-400">
                  Archived: {formatHumanDateTime(report.archivedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {report.status !== 'PROCESSING' && report.status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('PROCESSING')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                Mark Processing
              </button>
            )}

            {report.status !== 'COMPLETED' && report.status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('COMPLETED')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                Mark Completed
              </button>
            )}

            {report.status !== 'ARCHIVED' ? (
              <button
                type="button"
                onClick={() => setShowStatusConfirm('ARCHIVED')}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-slate-600"
              >
                Archive Record
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStatusChange('PROCESSING')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Restore to Active
              </button>
            )}
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Investigation details updated and saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Client Personal Information & Investigation Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* CLIENT SUBMITTED PERSONAL INFORMATION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase">
                  Client Personal Information (Mula sa Publiko)
                </h3>
              </div>
              <CopySectionButton
                sectionTitle="Personal Information"
                formattedText={personalInfoFormatted}
                className="border-blue-400"
              />
            </div>

            <div className="p-5 divide-y divide-slate-100 text-xs sm:text-sm">
              {/* 1. First Name */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">1. First Name (Unang Pangalan)</span>
                  <span className="font-bold text-slate-900">{personalInfo.firstName || '—'}</span>
                </div>
                <CopyButton value={personalInfo.firstName} label="First Name" />
              </div>

              {/* 2. Middle Name */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">2. Middle Name (Gitnang Pangalan)</span>
                  <span className="font-bold text-slate-900">{personalInfo.middleName || '—'}</span>
                </div>
                <CopyButton value={personalInfo.middleName} label="Middle Name" />
              </div>

              {/* 3. Last Name */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">3. Last Name (Apelyido)</span>
                  <span className="font-bold text-slate-900">{personalInfo.lastName || '—'}</span>
                </div>
                <CopyButton value={personalInfo.lastName} label="Last Name" />
              </div>

              {/* 4. Suffix */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">4. Suffix (Panlapi sa Pangalan)</span>
                  <span className="font-bold text-slate-900">{personalInfo.suffix || 'None'}</span>
                </div>
                <CopyButton value={personalInfo.suffix} label="Suffix" />
              </div>

              {/* 5. Birthday */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">5. Birthday (Araw ng Kapanganakan)</span>
                  <span className="font-bold text-slate-900">{formatHumanDate(personalInfo.birthday) || '—'}</span>
                </div>
                <CopyButton value={formatHumanDate(personalInfo.birthday)} label="Birthday" />
              </div>

              {/* 6. Age */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">6. Age (Edad)</span>
                  <span className="font-bold text-slate-900">{personalInfo.age !== null ? personalInfo.age : '—'}</span>
                </div>
                <CopyButton value={personalInfo.age} label="Age" />
              </div>

              {/* 7. Sex */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">7. Sex (Kasarian)</span>
                  <span className="font-bold text-slate-900">{personalInfo.sex || '—'}</span>
                </div>
                <CopyButton value={personalInfo.sex} label="Sex" />
              </div>

              {/* 8. Civil Status */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">8. Civil Status (Katayuang Sibil)</span>
                  <span className="font-bold text-slate-900">{personalInfo.civilStatus || '—'}</span>
                </div>
                <CopyButton value={personalInfo.civilStatus} label="Civil Status" />
              </div>

              {/* 9. Occupation - MUST appear immediately after Civil Status! */}
              <div className="py-2.5 flex items-center justify-between gap-4 bg-blue-50/20 px-2 rounded">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">9. Occupation (Trabaho)</span>
                  <span className="font-bold text-slate-900">{personalInfo.occupation || '—'}</span>
                </div>
                <CopyButton value={personalInfo.occupation} label="Occupation" />
              </div>

              {/* 10. Nationality */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">10. Nationality (Nasyonalidad)</span>
                  <span className="font-bold text-slate-900">{personalInfo.nationality || '—'}</span>
                </div>
                <CopyButton value={personalInfo.nationality} label="Nationality" />
              </div>

              {/* 11. Address */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-3/4">
                  <span className="text-slate-500 font-medium block text-xs">11. Address (Tirahan)</span>
                  <span className="font-bold text-slate-900 whitespace-pre-line">{personalInfo.address || '—'}</span>
                </div>
                <CopyButton value={personalInfo.address} label="Address" />
              </div>

              {/* 12. Contact Number */}
              <div className="py-2.5 flex items-center justify-between gap-4">
                <div className="w-1/2">
                  <span className="text-slate-500 font-medium block text-xs">12. Contact Number (Numero ng Telepono)</span>
                  <span className="font-bold font-mono text-slate-900">{personalInfo.contactNumber || '—'}</span>
                </div>
                <CopyButton value={personalInfo.contactNumber} label="Contact Number" />
              </div>
            </div>

            {reportData.clientInitialRemarks && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase">
                    Initial Statement from Client
                  </span>
                  <CopyButton value={reportData.clientInitialRemarks} label="Initial Statement" />
                </div>
                <p className="text-xs text-slate-800 mt-1 whitespace-pre-line">
                  {reportData.clientInitialRemarks}
                </p>
              </div>
            )}
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Edit / Enter Investigation Details</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInvestigationData}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs"
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
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInvestigationData}
                    className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-lg shadow-sm"
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
                    value: f.type === 'date' ? formatHumanDate(reportData[f.id]) : reportData[f.id],
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
                          const displayVal = field.type === 'date' 
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
                                <span className={`font-bold mt-0.5 block whitespace-pre-line ${
                                  displayVal ? 'text-slate-900' : 'text-slate-400 italic font-normal'
                                }`}>
                                  {displayVal || '— Not recorded yet (Click "Edit / Enter Investigation Details" above)'}
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
              Export Complete Formatted Report
            </span>
            <CopyReportButton
              reportText={completeReportFormatted}
              referenceNumber={report.referenceNumber}
              size="md"
            />
          </div>
        </div>

        {/* Right 1 Column: Attachments, Internal Admin Notes & Audit Log */}
        <div className="space-y-6">
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
                  <p className="text-xs text-slate-400 italic">No Google Drive documents attached to #{report.referenceNumber} yet.</p>
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
                    const catObj = DRIVE_CLASSIFICATIONS.find((c) => c.id === df.properties?.category);
                    return (
                      <div
                        key={df.id}
                        className="p-3 bg-slate-50 hover:bg-blue-50/40 border border-slate-200 rounded-xl space-y-1.5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${badge.bg} ${badge.text}`}>
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

          {/* ATTACHMENTS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Attachments & Proof ({report.attachments.length})
              </h3>
            </div>

            <div className="p-4">
              {report.attachments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No attachments submitted.</p>
              ) : (
                <div className="space-y-3">
                  {report.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {att.previewUrl ? (
                          <img
                            src={att.previewUrl}
                            alt={att.name}
                            className="w-10 h-10 object-cover rounded bg-white border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-white flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                            {att.type.includes('pdf') ? (
                              <File className="w-5 h-5 text-rose-600" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                            {att.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(att.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {att.previewUrl && (
                          <a
                            href={att.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white border border-slate-200 px-2 py-1 rounded"
                          >
                            View
                          </a>
                        )}
                        {onDeleteAttachment && (
                          <button
                            type="button"
                            onClick={() => onDeleteAttachment(report.id, att.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* INTERNAL ADMIN NOTES */}
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post Note</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2.5 pt-2">
                {report.adminNotes.length === 0 ? (
                  <p className="text-xs text-amber-900/60 italic">No internal notes added yet.</p>
                ) : (
                  report.adminNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-white border border-amber-200 rounded-lg text-xs shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-amber-900">{note.authorEmail}</span>
                        <span>{formatHumanDateTime(note.createdAt)}</span>
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
                Audit Trail ({report.auditLogs.length})
              </h3>
            </div>

            <div className="p-4 max-h-56 overflow-y-auto space-y-2 text-xs">
              {report.auditLogs.map((log) => (
                <div key={log.id} className="p-2 bg-slate-50 border border-slate-100 rounded text-[11px]">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-semibold text-blue-900">{log.action}</span>
                    <span>{formatHumanDateTime(log.timestamp)}</span>
                  </div>
                  <p className="text-slate-700 mt-1">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Archive confirmation dialog */}
      {showStatusConfirm === 'ARCHIVED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Archive This Record?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Archived records are retained securely and can be restored at any time. Public clients will not have access.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowStatusConfirm(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('ARCHIVED')}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm"
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
            {/* Header */}
            <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm sm:text-base">Confirm Permanent Deletion</h3>
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

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="text-sm font-semibold text-slate-900">
                Are you sure you want to permanently erase this report?
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="font-mono font-bold text-rose-900 block text-xs">
                  Reference: #{report.referenceNumber}
                </span>
                <span className="text-slate-600 block text-[11px]">
                  Client: {report.personalInformation.firstName} {report.personalInformation.lastName}
                </span>
              </div>
              <p className="text-rose-700 font-medium">
                ⚠️ Warning: This will permanently delete this document and attached notes from the Cloud Firestore database. This action cannot be undone.
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
                  <p className="text-[11px] text-slate-500">
                    Ref #{report.referenceNumber}
                  </p>
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
            <h3 className="text-sm font-bold text-slate-900">
              Delete File from Google Drive?
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{fileToDelete.name}</strong> from Google Drive?
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
    </div>
  );
};
