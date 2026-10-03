import React, { useState } from 'react';
import { 
  PersonalInformation, 
  AttachmentItem,
  ReportSubmission 
} from '../../types/reports';
import { PersonalInformationForm } from '../form/PersonalInformationForm';
import { FileUploadDropzone } from '../form/FileUploadDropzone';
import { CopyButton } from '../common/CopyButton';
import { BrandLogo } from '../common/BrandLogo';
import { BackgroundWatermark } from '../common/BackgroundWatermark';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { generateReferenceNumber } from '../../utils/referenceNumber';
import { formatHumanDate } from '../../utils/dateUtils';
import { 
  CheckCircle2, 
  Shield, 
  Lock, 
  Edit3, 
  Send, 
  AlertCircle, 
  Paperclip, 
  UserCheck,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';

interface PublicIntakeWizardProps {
  onSubmitSuccess?: (newSubmission: ReportSubmission) => void;
  onNavigateToAdmin?: () => void;
}

const INITIAL_PERSONAL_INFO: PersonalInformation = {
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  birthday: '',
  age: null,
  sex: '',
  civilStatus: '',
  occupation: '',
  nationality: 'Filipino',
  address: '',
  contactNumber: '',
};

export const PublicIntakeWizard: React.FC<PublicIntakeWizardProps> = ({
  onSubmitSuccess,
  onNavigateToAdmin,
}) => {
  // Pure Personal Information Flow: 1. Fill Info -> 2. Review -> 3. Success (Ref#)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [personalInfo, setPersonalInfo] = useState<PersonalInformation>(INITIAL_PERSONAL_INFO);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [showAttachmentsSection, setShowAttachmentsSection] = useState(false);
  
  // Validation errors
  const [personalErrors, setPersonalErrors] = useState<Partial<Record<keyof PersonalInformation, string>>>({});
  
  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ReportSubmission | null>(null);

  // Validate Personal Info
  const validatePersonalInfo = (): boolean => {
    const errs: Partial<Record<keyof PersonalInformation, string>> = {};
    if (!personalInfo.firstName.trim()) errs.firstName = 'First Name is required (Kailangan ang Unang Pangalan).';
    if (!personalInfo.lastName.trim()) errs.lastName = 'Last Name is required (Kailangan ang Apelyido).';
    if (!personalInfo.birthday) errs.birthday = 'Birthday is required (Kailangan ang Araw ng Kapanganakan).';
    if (!personalInfo.sex) errs.sex = 'Sex selection is required (Pumili ng Kasarian).';
    if (!personalInfo.civilStatus) errs.civilStatus = 'Civil Status is required (Pumili ng Katayuang Sibil).';
    if (!personalInfo.occupation.trim()) errs.occupation = 'Occupation is required (Kailangan ang Trabaho).';
    if (!personalInfo.nationality.trim()) errs.nationality = 'Nationality is required (Kailangan ang Nasyonalidad).';
    if (!personalInfo.address.trim()) errs.address = 'Complete Address is required (Kailangan ang Tirahan).';
    if (!personalInfo.contactNumber.trim()) {
      errs.contactNumber = 'Contact Number is required (Kailangan ang Numero ng Telepono).';
    } else if (personalInfo.contactNumber.trim().length < 7) {
      errs.contactNumber = 'Please provide a valid contact number (7-15 digits).';
    }

    setPersonalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToReview = () => {
    if (validatePersonalInfo()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToEdit = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const refNo = generateReferenceNumber();
    const newSubmission: ReportSubmission = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      referenceNumber: refNo,
      reportType: 'personal-intake',
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInformation: { ...personalInfo },
      reportData: {},
      attachments: [...attachments],
      adminNotes: [],
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          adminUserId: 'SYSTEM_INTAKE',
          adminEmail: 'public.intake.portal@system',
          action: 'VIEW_REPORT',
          details: `Client submitted full Personal Information intake via QR: ${refNo}`,
        },
      ],
      stationOffice: 'Investigation & Records Section',
    };

    try {
      if (onSubmitSuccess) {
        await onSubmitSuccess(newSubmission);
      }
    } catch (err) {
      console.warn('Submission persistence notice:', err);
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setSubmissionResult(newSubmission);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setPersonalInfo(INITIAL_PERSONAL_INFO);
    setAttachments([]);
    setShowAttachmentsSection(false);
    setSubmissionResult(null);
    setPersonalErrors({});
  };

  return (
    <div className="relative min-h-screen bg-slate-100 flex flex-col font-sans overflow-x-hidden">
      {/* Resilient Official Seal Watermark */}
      <BackgroundWatermark theme="light" />

      {/* Official Top Agency Header */}
      <header className="relative z-30 bg-blue-950 text-white shadow-md sticky top-0 border-b border-blue-900">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-extrabold tracking-tight leading-tight truncate">
                BAUAN MPS - INTAKE
              </h1>
              <p className="text-[10px] sm:text-[11px] text-blue-200 truncate">
                Public Records Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <PWAInstallButton />
            {onNavigateToAdmin && (
              <button
                type="button"
                onClick={onNavigateToAdmin}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-900/70 hover:bg-blue-800 text-blue-200 hover:text-white rounded-lg text-xs font-semibold border border-blue-700/70 transition-colors cursor-pointer shadow-xs"
                title="Authorized PNP Police Personnel Login"
              >
                <Lock className="w-3.5 h-3.5 text-blue-300" />
                <span className="hidden xs:inline">Officer Login</span>
                <span className="xs:hidden">Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 pb-24">
        {/* Step Indicator Header (Steps 1 & 2) */}
        {currentStep < 3 && (
          <div className="mb-6 bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Step {currentStep} of 2
              </span>
              <span className="text-xs font-medium text-slate-500">
                {currentStep === 1 && '1. Personal Information (Ilagay ang Impormasyon)'}
                {currentStep === 2 && '2. Review & Submit (Suriin at Isumite)'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-900 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: Personal Information Form (The ONLY information required from public) */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 mb-1">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <span>Public Citizen Entry</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Personal Information (Impormasyon ng Tao)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Pakisagutan ang kumpletong personal na impormasyon. Awtomatikong kukuwentahin ang edad mula sa kapanganakan.
                </p>
              </div>

              {/* Master Reusable Personal Information Form with strictly mandated 12 fields */}
              <PersonalInformationForm
                data={personalInfo}
                onChange={setPersonalInfo}
                errors={personalErrors}
              />

              {/* Optional Photo Attachment (ID, Proof, Documents) */}
              <div className="pt-2 border-t border-slate-200">
                {!showAttachmentsSection ? (
                  <button
                    type="button"
                    onClick={() => setShowAttachmentsSection(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Mag-attach ng ID o Dokumento (Optional Photo Upload)</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Optional Upload (ID o Dokumento)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachments([]);
                          setShowAttachmentsSection(false);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Hide upload
                      </button>
                    </div>
                    <FileUploadDropzone
                      attachments={attachments}
                      onChange={setAttachments}
                      reportType="personal-intake"
                      maxFiles={3}
                      maxSizeMB={10}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Proceed Action */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleProceedToReview}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-900 hover:bg-blue-950 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Proceed to Review (Suriin ang Datos)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Review Personal Information & Submit */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold block">Pagsusuri Bago Isumite (Review Before Submitting)</span>
                Pakitingnan kung tama ang lahat ng iyong personal na impormasyon. Pagkapasa, makakatanggap ka ng opisyal na Reference Number na ibibigay sa desk ng pulisya.
              </div>
            </div>

            {/* Personal Information Review */}
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                  PERSONAL INFORMATION (Impormasyon ng Tao)
                </h4>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleBackToEdit}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>[EDIT]</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToEdit}
                    aria-label="Back to editing"
                    title="Bumalik (X)"
                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <dt className="text-slate-500 font-medium">1. First Name (Unang Pangalan)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{personalInfo.firstName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">2. Middle Name (Gitnang Pangalan)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{personalInfo.middleName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">3. Last Name (Apelyido)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{personalInfo.lastName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">4. Suffix (Panlapi sa Pangalan)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{personalInfo.suffix || 'None'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">5. Birthday (Araw ng Kapanganakan)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{formatHumanDate(personalInfo.birthday) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">6. Age (Edad)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{personalInfo.age !== null ? `${personalInfo.age} yrs` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">7. Sex (Kasarian)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{personalInfo.sex || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">8. Civil Status (Katayuang Sibil)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{personalInfo.civilStatus || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">9. Occupation (Trabaho)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{personalInfo.occupation || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium">10. Nationality (Nasyonalidad)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{personalInfo.nationality || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500 font-medium">11. Address (Tirahan)</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5 whitespace-pre-line">{personalInfo.address || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500 font-medium">12. Contact Number (Numero ng Telepono)</dt>
                  <dd className="font-semibold font-mono text-slate-900 mt-0.5">{personalInfo.contactNumber || '—'}</dd>
                </div>
              </dl>

              {attachments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-slate-500 font-medium block text-xs">Attached Files ({attachments.length}):</span>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {attachments.map((att) => (
                      <span key={att.id} className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-700">
                        {att.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submission Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={handleBackToEdit}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Bumalik (Edit)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl text-xs sm:text-sm font-extrabold shadow-md active:scale-[0.98] cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>[SUBMIT PERSONAL INFO]</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Submission Success & Reference Number Display */}
        {currentStep === 3 && submissionResult && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn text-center pt-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 shadow-sm border border-emerald-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Personal Information Submitted
              </h2>
              <p className="text-sm font-semibold text-emerald-800 mt-1">
                (Matagumpay na Naisumite ang Iyong Datos)
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
                Naitala na ang iyong personal na impormasyon sa opisyal na sistema ng pulisya. Pakisave o i-screenshot ang iyong Reference Number at ipakita ito sa desk ng imbestigador.
              </p>
            </div>

            {/* Reference Number Box */}
            <div className="p-6 bg-white border-2 border-blue-900 rounded-2xl shadow-lg text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Official Tracking Reference Number
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-black text-blue-950 tracking-wider">
                {submissionResult.referenceNumber}
              </div>

              <div className="pt-2">
                <CopyButton
                  value={submissionResult.referenceNumber}
                  label="Reference Number"
                  size="md"
                  className="mx-auto"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Lock className="w-3.5 h-3.5 text-blue-900" />
                <span>Police Desk Notice</span>
              </div>
              <p>
                Ang imbestigador sa desk ang magtatala ng karagdagang detalye ng insidente, ulat, o transaksyon. Ipakita lamang ang Reference Number na ito.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs cursor-pointer"
              >
                Magsimula Muli (Submit Another Record)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
              aria-label="Close"
              title="Kanselahin / Close (X)"
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Isumite ang Impormasyon?
              </h3>
              <p className="text-xs font-semibold text-blue-900 mt-0.5">
                (Confirm Submission)
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Siguraduhin na totoo at tama ang iyong buong pangalan, kaarawan, tirahan, at contact number bago magsumite sa database ng pulisya.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel (Kanselahin)
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting to Database...</span>
                  </>
                ) : (
                  <span>Confirm & Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
