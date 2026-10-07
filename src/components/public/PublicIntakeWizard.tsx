import React, { useState } from 'react';
import { 
  PersonalInformation, 
  ReportSubmission,
  AttachmentItem
} from '../../types/reports';
import { PersonalInformationForm } from '../form/PersonalInformationForm';
import { FileUploadDropzone } from '../form/FileUploadDropzone';
import { CopyButton } from '../common/CopyButton';
import { BrandLogo } from '../common/BrandLogo';
import { BackgroundWatermark } from '../common/BackgroundWatermark';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { PublicFooter } from './PublicFooter';
import { generateReferenceNumber } from '../../utils/referenceNumber';
import { formatHumanDate } from '../../utils/dateUtils';
import { formatVehicularAccidentText } from '../../utils/formatters';
import { 
  CheckCircle2, 
  Shield, 
  Lock, 
  Edit3, 
  Send, 
  AlertCircle, 
  UserCheck,
  Car,
  ChevronRight,
  ChevronLeft,
  X,
  HelpCircle,
  FileText,
  ArrowLeft,
  Camera
} from 'lucide-react';

interface PublicIntakeWizardProps {
  onSubmitSuccess?: (newSubmission: ReportSubmission) => void;
  onNavigateToAdmin?: () => void;
  onNavigateToFAQ?: () => void;
}

type PublicWizardMode = 'select' | 'personal-intake' | 'vehicular-incident';

interface VehicularAccidentFields {
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  plateNumber: string;
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

const INITIAL_VEHICULAR_FIELDS: VehicularAccidentFields = {
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: '',
  vehicleColor: '',
  plateNumber: '',
};

export const PublicIntakeWizard: React.FC<PublicIntakeWizardProps> = ({
  onSubmitSuccess,
  onNavigateToAdmin,
  onNavigateToFAQ,
}) => {
  // Public Mode Selection: 'select' (choose Personal Info or Vehicular Accident), 'personal-intake', or 'vehicular-incident'
  const [wizardMode, setWizardMode] = useState<PublicWizardMode>('select');

  // Step 1: Fill Info -> Step 2: Review -> Step 3: Success (Ref#)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [personalInfo, setPersonalInfo] = useState<PersonalInformation>(INITIAL_PERSONAL_INFO);
  const [vehicularFields, setVehicularFields] = useState<VehicularAccidentFields>(INITIAL_VEHICULAR_FIELDS);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [clientReferenceNumber, setClientReferenceNumber] = useState<string>(() => generateReferenceNumber());
  
  // Validation errors
  const [personalErrors, setPersonalErrors] = useState<Partial<Record<keyof PersonalInformation, string>>>({});
  const [vehicularErrors, setVehicularErrors] = useState<Partial<Record<keyof VehicularAccidentFields, string>>>({});
  
  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ReportSubmission | null>(null);

  // Consent Agreement State
  const [hasConsented, setHasConsented] = useState(false);
  const [consentError, setConsentError] = useState(false);

  // Select which standalone wizard to open
  const handleSelectMode = (mode: 'personal-intake' | 'vehicular-incident') => {
    setWizardMode(mode);
    setCurrentStep(1);
    setPersonalErrors({});
    setVehicularErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToSelection = () => {
    setWizardMode('select');
    setCurrentStep(1);
    setPersonalErrors({});
    setVehicularErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Validate Vehicular Info
  const validateVehicularInfo = (): boolean => {
    const vErrs: Partial<Record<keyof VehicularAccidentFields, string>> = {};
    if (!vehicularFields.vehicleMake.trim()) {
      vErrs.vehicleMake = 'Vehicle Make / Brand is required (Hal. Mitsubishi, Toyota, Honda).';
    }
    if (!vehicularFields.vehicleModel.trim()) {
      vErrs.vehicleModel = 'Vehicle Model is required (Hal. Expander, Vios, Click 125i).';
    }
    if (!vehicularFields.vehicleYear.trim()) {
      vErrs.vehicleYear = 'Vehicle Year Model is required (Hal. 2026).';
    }
    if (!vehicularFields.vehicleColor.trim()) {
      vErrs.vehicleColor = 'Vehicle Color is required (Hal. graphite gray metallic).';
    }
    if (!vehicularFields.plateNumber.trim()) {
      vErrs.plateNumber = 'Plate Number / Conduction Sticker is required (Hal. DCH 2797).';
    }
    setVehicularErrors(vErrs);
    const isPersonalValid = validatePersonalInfo();
    return Object.keys(vErrs).length === 0 && isPersonalValid;
  };

  const handleProceedToReview = () => {
    if (wizardMode === 'vehicular-incident') {
      if (validateVehicularInfo()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (validatePersonalInfo()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBackToEdit = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const refNo = clientReferenceNumber || generateReferenceNumber();
    const isVehicular = wizardMode === 'vehicular-incident';

    const newSubmission: ReportSubmission = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      referenceNumber: refNo,
      reportType: isVehicular ? 'vehicular-incident' : 'personal-intake',
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInformation: { ...personalInfo },
      reportData: isVehicular
        ? {
            vehicleMake: vehicularFields.vehicleMake.trim(),
            vehicleModel: vehicularFields.vehicleModel.trim(),
            vehicleYear: vehicularFields.vehicleYear.trim(),
            vehicleColor: vehicularFields.vehicleColor.trim(),
            plateNumber: vehicularFields.plateNumber.trim(),
          }
        : {},
      attachments: [...attachments],
      adminNotes: [],
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          adminUserId: 'SYSTEM_INTAKE',
          adminEmail: 'public.intake.portal@system',
          action: 'VIEW_REPORT',
          details: isVehicular
            ? `Client submitted Vehicular Accident intake via Public Portal (${attachments.length} photo/ID attached): ${refNo}`
            : `Client submitted full Personal Information intake via QR (${attachments.length} photo/ID attached): ${refNo}`,
        },
      ],
      stationOffice: isVehicular ? 'Traffic Enforcement Unit' : 'Investigation & Records Section',
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
    setWizardMode('select');
    setCurrentStep(1);
    setPersonalInfo(INITIAL_PERSONAL_INFO);
    setVehicularFields(INITIAL_VEHICULAR_FIELDS);
    setAttachments([]);
    setClientReferenceNumber(generateReferenceNumber());
    setSubmissionResult(null);
    setPersonalErrors({});
    setVehicularErrors({});
    setHasConsented(false);
    setConsentError(false);
  };

  const clientFullNameSlug = [
    personalInfo.lastName.trim(),
    personalInfo.firstName.trim(),
    personalInfo.middleName.trim(),
  ]
    .filter(Boolean)
    .join('_');

  const formattedVehicularSentence = formatVehicularAccidentText(personalInfo, {
    vehicleMake: vehicularFields.vehicleMake,
    vehicleModel: vehicularFields.vehicleModel,
    vehicleYear: vehicularFields.vehicleYear,
    vehicleColor: vehicularFields.vehicleColor,
    plateNumber: vehicularFields.plateNumber,
  });

  return (
    <div className="relative min-h-screen bg-transparent flex flex-col font-sans overflow-x-hidden">
      {/* Resilient Official Seal Watermark */}
      <BackgroundWatermark theme="light" />

      {/* Official Top Agency Header */}
      <header className="relative z-30 bg-blue-950 text-white shadow-md sticky top-0 border-b border-blue-900">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-extrabold tracking-tight leading-tight truncate">
                Bauan MPS Investigation
              </h1>
              <p className="text-[10px] sm:text-[11px] text-blue-200 truncate">
                Public Records Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {onNavigateToFAQ && (
              <button
                type="button"
                onClick={onNavigateToFAQ}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-extrabold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                title="Buksan ang Pahina ng Mga Madalas Itanong sa Kaso (FAQ Route)"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                <span className="hidden xs:inline">FAQ at 15 Kaso</span>
                <span className="xs:hidden">FAQ</span>
              </button>
            )}
            <PWAInstallButton />
            {onNavigateToAdmin && (
              <button
                type="button"
                onClick={onNavigateToAdmin}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-900/70 hover:bg-blue-800 text-blue-200 hover:text-white rounded-lg text-xs font-semibold border border-blue-700/70 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
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
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 pb-20 space-y-6">
        {/* =====================================================================
            MODE SELECTION SCREEN: Choose between Personal Info & Vehicular Accident
           ===================================================================== */}
        {wizardMode === 'select' && (
          <div className="space-y-6 animate-fadeIn pt-2">
            <div className="bg-white/85 rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-extrabold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-blue-700" />
                <span>Public Intake Selection</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pumili ng Uri ng Form (Select Intake Form)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                Piliin kung magsusumite ng <strong className="text-slate-900">Personal Information</strong> para sa blotter/rekord o <strong className="text-slate-900">Vehicular Accident</strong> para sa detalye ng sasakyan at nagmamaneho.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Option 1: Personal Information (Standalone) */}
              <button
                type="button"
                onClick={() => handleSelectMode('personal-intake')}
                className="group text-left bg-white/85 hover:bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800 block">
                      Option 1 • General Intake
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                      Personal Information
                    </h3>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      (Impormasyon ng Tao)
                    </p>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                      Para sa kumpletong personal na detalye (Pangalan, Kapanganakan, Edad, Kasarian, Katayuang Sibil, Trabaho, Tirahan, at Contact Number).
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-blue-900 group-hover:text-blue-950">
                  <span>Buksan ang Personal Info Wizard</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Option 2: Vehicular Accident (Standalone) */}
              <button
                type="button"
                onClick={() => handleSelectMode('vehicular-incident')}
                className="group text-left bg-white/85 hover:bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-amber-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block">
                      Option 2 • Traffic / Vehicular
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                      Vehicular Accident
                    </h3>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      (Aksidente / Insidente sa Sasakyan)
                    </p>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                      Para sa detalye ng sasakyan (Make/Model/Year, Color, Plate Number) at kumpletong impormasyon ng nagmamaneho (Driven by).
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-amber-800 group-hover:text-amber-950">
                  <span>Buksan ang Vehicular Accident Wizard</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            ACTIVE WIZARD: Either 'personal-intake' OR 'vehicular-incident'
           ===================================================================== */}
        {wizardMode !== 'select' && (
          <>
            {/* Top Mode Switcher / Back to Form Selection (Steps 1 & 2) */}
            {currentStep < 3 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleReturnToSelection}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 rounded-lg text-xs font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Palitan ang Uri ng Form (Change Form Type)</span>
                  </button>

                  <div className="inline-flex rounded-lg bg-slate-200/80 p-1 border border-slate-300/70">
                    <button
                      type="button"
                      onClick={() => handleSelectMode('personal-intake')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        wizardMode === 'personal-intake'
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      Personal Info
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMode('vehicular-incident')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        wizardMode === 'vehicular-incident'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      Vehicular Accident
                    </button>
                  </div>
                </div>

                {/* Step Indicator Header */}
                <div className="bg-white/75 rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Step {currentStep} of 2
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {currentStep === 1 &&
                        (wizardMode === 'vehicular-incident'
                          ? '1. Vehicular Accident & Driver Info (Detalye ng Sasakyan at Driver)'
                          : '1. Personal Information (Ilagay ang Impormasyon)')}
                      {currentStep === 2 && '2. Review & Submit (Suriin at Isumite)'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        wizardMode === 'vehicular-incident' ? 'bg-amber-600' : 'bg-blue-900'
                      }`}
                      style={{ width: `${(currentStep / 2) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================
                STEP 1A: PERSONAL INFORMATION WIZARD (UNTOUCHED STANDALONE)
               ================================================================= */}
            {currentStep === 1 && wizardMode === 'personal-intake' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white/75 rounded-xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
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
                </div>

                {/* Optional Valid ID / Live Capture Upload Section */}
                <div className="bg-white/80 rounded-xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-0.5">
                        <Camera className="w-4 h-4 text-emerald-700" />
                        <span>Optional Valid ID / Photo Capture</span>
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Valid ID or Live Photo (Opsyonal na ID o Live Capture)
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 shrink-0">
                      Optional (Opsyonal)
                    </span>
                  </div>

                  <FileUploadDropzone
                    attachments={attachments}
                    onChange={setAttachments}
                    reportType="personal-intake"
                    referenceNumber={clientReferenceNumber}
                    clientName={clientFullNameSlug}
                  />
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

            {/* =================================================================
                STEP 1B: VEHICULAR ACCIDENT WIZARD (STANDALONE)
               ================================================================= */}
            {currentStep === 1 && wizardMode === 'vehicular-incident' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Part 1: Vehicle Details */}
                <div className="bg-white/80 rounded-xl p-5 sm:p-7 border border-amber-300/90 shadow-xs space-y-5">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-1">
                      <Car className="w-4 h-4 text-amber-700" />
                      <span>Vehicular Accident Entry • Part 1 of 2</span>
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Vehicle Information (Impormasyon ng Sasakyan)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Ilagay nang hiwalay ang Brand/Make, Modelo, Taon (Year), Kulay (Color), at Plate Number ng sasakyan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Vehicle Make / Brand */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        1. Vehicle Make / Brand <span className="text-rose-600">*</span>
                        <span className="block text-[11px] font-normal text-slate-500">
                          (Tatak / Brand ng Sasakyan)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={vehicularFields.vehicleMake}
                        onChange={(e) => {
                          setVehicularFields((prev) => ({
                            ...prev,
                            vehicleMake: e.target.value,
                          }));
                          if (vehicularErrors.vehicleMake) {
                            setVehicularErrors((prev) => ({ ...prev, vehicleMake: undefined }));
                          }
                        }}
                        placeholder="e.g. Mitsubishi"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                          vehicularErrors.vehicleMake
                            ? 'border-rose-400 focus:ring-rose-500/30'
                            : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/20'
                        }`}
                      />
                      {vehicularErrors.vehicleMake && (
                        <p className="text-xs text-rose-600 font-semibold mt-1">
                          {vehicularErrors.vehicleMake}
                        </p>
                      )}
                    </div>

                    {/* 2. Vehicle Model */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        2. Vehicle Model <span className="text-rose-600">*</span>
                        <span className="block text-[11px] font-normal text-slate-500">
                          (Modelo ng Sasakyan)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={vehicularFields.vehicleModel}
                        onChange={(e) => {
                          setVehicularFields((prev) => ({
                            ...prev,
                            vehicleModel: e.target.value,
                          }));
                          if (vehicularErrors.vehicleModel) {
                            setVehicularErrors((prev) => ({ ...prev, vehicleModel: undefined }));
                          }
                        }}
                        placeholder="e.g. Expander"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                          vehicularErrors.vehicleModel
                            ? 'border-rose-400 focus:ring-rose-500/30'
                            : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/20'
                        }`}
                      />
                      {vehicularErrors.vehicleModel && (
                        <p className="text-xs text-rose-600 font-semibold mt-1">
                          {vehicularErrors.vehicleModel}
                        </p>
                      )}
                    </div>

                    {/* 3. Vehicle Year Model */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        3. Vehicle Year Model <span className="text-rose-600">*</span>
                        <span className="block text-[11px] font-normal text-slate-500">
                          (Taon ng Modelo / Year)
                        </span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={vehicularFields.vehicleYear}
                        onChange={(e) => {
                          setVehicularFields((prev) => ({
                            ...prev,
                            vehicleYear: e.target.value.replace(/[^0-9]/g, ''),
                          }));
                          if (vehicularErrors.vehicleYear) {
                            setVehicularErrors((prev) => ({ ...prev, vehicleYear: undefined }));
                          }
                        }}
                        placeholder="e.g. 2026"
                        className={`w-full px-3.5 py-2.5 text-sm font-mono font-semibold rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                          vehicularErrors.vehicleYear
                            ? 'border-rose-400 focus:ring-rose-500/30'
                            : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/20'
                        }`}
                      />
                      {vehicularErrors.vehicleYear && (
                        <p className="text-xs text-rose-600 font-semibold mt-1">
                          {vehicularErrors.vehicleYear}
                        </p>
                      )}
                    </div>

                    {/* 4. Vehicle Color */}
                    <div className="sm:col-span-1 lg:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        4. Vehicle Color (colored) <span className="text-rose-600">*</span>
                        <span className="block text-[11px] font-normal text-slate-500">
                          (Kulay ng Sasakyan)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={vehicularFields.vehicleColor}
                        onChange={(e) => {
                          setVehicularFields((prev) => ({
                            ...prev,
                            vehicleColor: e.target.value,
                          }));
                          if (vehicularErrors.vehicleColor) {
                            setVehicularErrors((prev) => ({ ...prev, vehicleColor: undefined }));
                          }
                        }}
                        placeholder="e.g. graphite gray metallic"
                        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                          vehicularErrors.vehicleColor
                            ? 'border-rose-400 focus:ring-rose-500/30'
                            : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/20'
                        }`}
                      />
                      {vehicularErrors.vehicleColor && (
                        <p className="text-xs text-rose-600 font-semibold mt-1">
                          {vehicularErrors.vehicleColor}
                        </p>
                      )}
                    </div>

                    {/* 5. Plate Number */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        5. Plate Number (bearing plate number) <span className="text-rose-600">*</span>
                        <span className="block text-[11px] font-normal text-slate-500">
                          (Plaka o Conduction Sticker)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={vehicularFields.plateNumber}
                        onChange={(e) => {
                          setVehicularFields((prev) => ({
                            ...prev,
                            plateNumber: e.target.value.toUpperCase(),
                          }));
                          if (vehicularErrors.plateNumber) {
                            setVehicularErrors((prev) => ({ ...prev, plateNumber: undefined }));
                          }
                        }}
                        placeholder="e.g. DCH 2797"
                        className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold uppercase rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                          vehicularErrors.plateNumber
                            ? 'border-rose-400 focus:ring-rose-500/30'
                            : 'border-slate-300 focus:border-amber-600 focus:ring-amber-500/20'
                        }`}
                      />
                      {vehicularErrors.plateNumber && (
                        <p className="text-xs text-rose-600 font-semibold mt-1">
                          {vehicularErrors.plateNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Part 2: Driver Personal Information ("and driven by...") */}
                <div className="bg-white/75 rounded-xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 mb-1">
                      <UserCheck className="w-4 h-4 text-blue-700" />
                      <span>Vehicular Accident Entry • Part 2 of 2</span>
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Driver Information (Impormasyon ng Nagmamaneho / Driven By)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Pakisagutan ang kumpletong personal na impormasyon ng nagmamaneho (driver). Awtomatikong bubuuin ang pangungusap para sa blotter.
                    </p>
                  </div>

                  <PersonalInformationForm
                    data={personalInfo}
                    onChange={setPersonalInfo}
                    errors={personalErrors}
                  />
                </div>

                {/* Part 3 (Optional): Valid ID / Driver License / Live Capture Photo */}
                <div className="bg-white/80 rounded-xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-0.5">
                        <Camera className="w-4 h-4 text-emerald-700" />
                        <span>Optional Driver's License / Valid ID / Vehicle Photo</span>
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Valid ID, License or Live Photo (Opsyonal na ID o Live Capture)
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 shrink-0">
                      Optional (Opsyonal)
                    </span>
                  </div>

                  <FileUploadDropzone
                    attachments={attachments}
                    onChange={setAttachments}
                    reportType="vehicular-incident"
                    referenceNumber={clientReferenceNumber}
                    clientName={clientFullNameSlug}
                  />
                </div>

                {/* Live Official Vehicular Accident Format Preview */}
                <div className="bg-amber-50/90 rounded-xl p-4 sm:p-5 border border-amber-300 shadow-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-700" />
                      <span>Generated Police Blotter Format (Live Preview)</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-slate-900 bg-white/90 p-3.5 rounded-lg border border-amber-200 leading-relaxed select-all">
                    {formattedVehicularSentence}
                  </p>
                </div>

                {/* Bottom Proceed Action */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleProceedToReview}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Proceed to Review (Suriin ang Vehicular Accident Data)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================
                STEP 2: REVIEW & SUBMIT (Supports both Personal & Vehicular)
               ================================================================= */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 text-amber-900 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <span className="font-bold block">Pagsusuri Bago Isumite (Review Before Submitting)</span>
                    Pakitingnan kung tama ang lahat ng iyong impormasyon. Pagkapasa, makakatanggap ka ng opisyal na Reference Number na ibibigay sa desk ng pulisya.
                  </div>
                </div>

                {/* If Vehicular Accident: Show Official Formatted Paragraph + Vehicle Details */}
                {wizardMode === 'vehicular-incident' && (
                  <div className="bg-white/85 rounded-xl p-5 sm:p-6 border-2 border-amber-400 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block">
                          Official Blotter Entry Preview
                        </span>
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                          VEHICULAR ACCIDENT RECORD (Sasakyan at Nagmamaneho)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToEdit}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>[EDIT]</span>
                      </button>
                    </div>

                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                          Formatted Entry (Para sa Blotter):
                        </span>
                        <CopyButton
                          value={formattedVehicularSentence}
                          label="Copy Format"
                          size="sm"
                        />
                      </div>
                      <p className="text-xs sm:text-sm font-mono font-semibold text-slate-900 leading-relaxed select-all">
                        {formattedVehicularSentence}
                      </p>
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs sm:text-sm pt-1">
                      <div>
                        <dt className="text-slate-500 font-medium">1. Vehicle Make / Brand</dt>
                        <dd className="font-bold text-slate-900 mt-0.5">
                          {vehicularFields.vehicleMake || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 font-medium">2. Vehicle Model</dt>
                        <dd className="font-bold text-slate-900 mt-0.5">
                          {vehicularFields.vehicleModel || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 font-medium">3. Year Model</dt>
                        <dd className="font-mono font-bold text-slate-900 mt-0.5">
                          {vehicularFields.vehicleYear || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 font-medium">4. Vehicle Color</dt>
                        <dd className="font-bold text-slate-900 mt-0.5">
                          {vehicularFields.vehicleColor || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 font-medium">5. Plate Number</dt>
                        <dd className="font-mono font-bold text-slate-900 mt-0.5">
                          {vehicularFields.plateNumber || '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                {/* Personal Information Review */}
                <div className="bg-white/75 rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {wizardMode === 'vehicular-incident'
                        ? 'DRIVER PERSONAL INFORMATION (Impormasyon ng Nagmamaneho)'
                        : 'PERSONAL INFORMATION (Impormasyon ng Tao)'}
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
                </div>

                {/* Review Attached / Captured Photos (if any) */}
                <div className="bg-white/75 rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-800" />
                      <span>VALID ID / CAPTURED PHOTOS ({attachments.length})</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleBackToEdit}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>[ADD / EDIT PHOTO]</span>
                    </button>
                  </div>

                  {attachments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No ID or photo attached (Optional — Maaaring magpatuloy kahit walang ID photo o pindutin ang [ADD / EDIT PHOTO] kung nais mag-capture/upload).
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                        >
                          {(att.previewUrl || att.url) && (
                            <img
                              src={att.previewUrl || att.url}
                              alt={att.name}
                              className="w-16 h-16 object-cover rounded-lg border border-slate-300 shrink-0 bg-white"
                            />
                          )}
                          <div className="overflow-hidden space-y-0.5">
                            <span
                              className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                att.sourceType === 'live_capture'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {att.sourceType === 'live_capture' ? 'LIVE CAPTURE' : 'UPLOADED PHOTO'}
                            </span>
                            <p className="text-xs font-bold text-slate-900 truncate">{att.name}</p>
                            {att.cloudinaryFolder && (
                              <p className="text-[10px] font-mono text-slate-500 truncate">
                                Folder: {att.cloudinaryFolder}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Data Privacy & Records Safekeeping Consent Checkbox */}
                <div className={`p-5 rounded-xl border transition-all ${
                  consentError 
                    ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs animate-shake' 
                    : 'bg-white/70 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-50 text-blue-900 rounded-lg shrink-0 border border-blue-100">
                      <Shield className="w-4 h-4 text-blue-800" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wide text-blue-950">
                        Official Record Safekeeping Agreement & Consent
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        By submitting this form, I hereby voluntarily declare that the information provided above is true and correct. I authorize the <strong className="text-blue-900">Bauan Municipal Police Station (MPS) Investigation & Records Section</strong> to securely record, store, and process my details in their digital database in complete accordance with <strong className="text-slate-900">Republic Act No. 10173 (Data Privacy Act of 2012)</strong> for official police records safekeeping and future investigator lookup.
                      </p>
                      <p className="text-xs text-blue-950 font-bold leading-relaxed">
                        (Sa pagsumite nito, pinatutunayan ko na kusang-loob at tama ang aking ibinigay na impormasyon at pinapahintulutan ko ang Bauan MPS na ligtas na itago ito para sa opisyal na rekord ng pulisya.)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer group text-xs font-bold text-slate-900 select-none">
                      <input
                        type="checkbox"
                        checked={hasConsented}
                        onChange={(e) => {
                          setHasConsented(e.target.checked);
                          if (e.target.checked) setConsentError(false);
                        }}
                        className="w-4 h-4 text-blue-900 border-slate-300 rounded focus:ring-blue-900 cursor-pointer"
                      />
                      <span>SANG-AYON AKO / I AGREE TO THE SAFEKEEPING AGREEMENT</span>
                    </label>

                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setHasConsented(false);
                          setConsentError(false);
                          handleBackToEdit();
                        }}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        TUMATANGGI AKO (I Refuse)
                      </button>
                    </div>
                  </div>
                  
                  {consentError && (
                    <p className="mt-2 text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Kailangan mong lagyan ng tsek ang kahon ng pagsang-ayon (I Agree) bago magpatuloy.</span>
                    </p>
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
                    onClick={() => {
                      if (!hasConsented) {
                        setConsentError(true);
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        return;
                      }
                      setShowConfirmModal(true);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl text-xs sm:text-sm font-extrabold shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {wizardMode === 'vehicular-incident'
                        ? '[SUBMIT VEHICULAR ACCIDENT]'
                        : '[SUBMIT PERSONAL INFO]'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================
                STEP 3: SUBMISSION SUCCESS & REFERENCE NUMBER DISPLAY
               ================================================================= */}
            {currentStep === 3 && submissionResult && (
              <div className="max-w-xl mx-auto space-y-6 animate-fadeIn text-center pt-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 shadow-sm border border-emerald-200">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {submissionResult.reportType === 'vehicular-incident'
                      ? 'Vehicular Accident Info Submitted'
                      : 'Personal Information Submitted'}
                  </h2>
                  <p className="text-sm font-semibold text-emerald-800 mt-1">
                    (Matagumpay na Naisumite ang Iyong Datos)
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
                    Naitala na ang iyong impormasyon sa opisyal na sistema ng pulisya. Pakisave o i-screenshot ang iyong Reference Number at ipakita ito sa desk ng imbestigador.
                  </p>
                </div>

                {/* Reference Number Box */}
                <div className="p-6 bg-white/80 border-2 border-blue-900 rounded-2xl shadow-lg text-center space-y-3">
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

                {/* If Vehicular Accident, also show the formatted paragraph for quick copy */}
                {submissionResult.reportType === 'vehicular-incident' && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-left space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                        Submitted Vehicular Accident Format:
                      </span>
                      <CopyButton
                        value={formattedVehicularSentence}
                        label="Copy Blotter Text"
                        size="sm"
                      />
                    </div>
                    <p className="text-xs font-mono text-slate-900 bg-white p-3 rounded-lg border border-amber-200 leading-relaxed select-all">
                      {formattedVehicularSentence}
                    </p>
                  </div>
                )}

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
          </>
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
                Siguraduhin na totoo at tama ang lahat ng detalye bago magsumite sa database ng pulisya.
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
      {/* Magnificent Justice & Emergency Contacts Footer (includes Top FAQ Ribbon) */}
      <PublicFooter onNavigateToFAQ={onNavigateToFAQ} />
    </div>
  );
};
