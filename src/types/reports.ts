export type ReportTypeId = 
  | 'personal-intake'
  | 'vehicular-incident'
  | 'incident-report'
  | 'complaint'
  | 'other-request';

export type ReportStatus = 'NEW' | 'PROCESSING' | 'COMPLETED' | 'ARCHIVED';

export type SexType = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export type CivilStatusType = 
  | 'Single' 
  | 'Married' 
  | 'Widowed' 
  | 'Separated' 
  | 'Annulled' 
  | 'Other';

export interface PersonalInformation {
  firstName: string;          // 1. First Name (Unang Pangalan)
  middleName: string;         // 2. Middle Name (Gitnang Pangalan)
  lastName: string;           // 3. Last Name (Apelyido)
  suffix: string;             // 4. Suffix (Panlapi sa Pangalan)
  birthday: string;           // 5. Birthday (Araw ng Kapanganakan) - YYYY-MM-DD
  age: number | null;         // 6. Age (Edad) - Read only, computed
  sex: SexType | '';          // 7. Sex (Kasarian)
  civilStatus: CivilStatusType | ''; // 8. Civil Status (Katayuang Sibil)
  occupation: string;         // 9. Occupation (Trabaho) - Immediately after Civil Status!
  nationality: string;        // 10. Nationality (Nasyonalidad)
  address: string;            // 11. Address (Tirahan)
  contactNumber: string;      // 12. Contact Number (Numero ng Telepono)
}

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'date' 
  | 'time' 
  | 'datetime' 
  | 'select' 
  | 'number';

export interface FieldOption {
  label: string;
  value: string;
}

export interface ReportFieldDefinition {
  id: string;
  labelEn: string;
  labelFil: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  suggestions?: string[];
  helpText?: string;
  rows?: number;
}

export interface ReportSectionDefinition {
  id: string;
  titleEn: string;
  titleFil: string;
  description?: string;
  fields: ReportFieldDefinition[];
}

export interface ReportTypeDefinition {
  id: ReportTypeId;
  nameEn: string;
  nameFil: string;
  descriptionEn: string;
  descriptionFil: string;
  iconName: string;
  sections: ReportSectionDefinition[];
  generateTemplate: (
    personalInfo: PersonalInformation,
    reportData: Record<string, any>,
    referenceNumber?: string
  ) => string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  previewUrl?: string;
  cloudinaryFolder?: string;
  publicId?: string;
  sourceType?: 'upload' | 'live_capture';
  uploadedAt: string;
  partyId?: string;
  partyLabel?: string;
  partyReferenceNumber?: string;
}

export interface MergedPartyRecord {
  id: string;
  referenceNumber: string;
  reportType: ReportTypeId;
  partyLabel: string;
  createdAt: string;
  mergedAt: string;
  personalInformation: PersonalInformation;
  reportData: Record<string, any>;
}

export interface AdminNote {
  id: string;
  authorEmail: string;
  text: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminUserId: string;
  adminEmail: string;
  action: 
    | 'ADMIN_LOGIN' 
    | 'VIEW_REPORT' 
    | 'UPDATE_REPORT' 
    | 'STATUS_CHANGED' 
    | 'REPORT_COMPLETED' 
    | 'REPORT_ARCHIVED' 
    | 'REPORT_RESTORED' 
    | 'ATTACHMENT_VIEWED'
    | 'COPIED_DATA';
  reportId?: string;
  referenceNumber?: string;
  details?: string;
}

export interface ReportSubmission {
  id: string;
  referenceNumber: string;
  reportType: ReportTypeId;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  archivedAt?: string | null;
  personalInformation: PersonalInformation;
  reportData: Record<string, any>;
  mergedParties?: MergedPartyRecord[];
  isMergedFile?: boolean;
  sourceReportIds?: string[];
  sourceReferenceNumbers?: string[];
  attachments: AttachmentItem[];
  adminNotes: AdminNote[];
  auditLogs: AuditLogEntry[];
  stationOffice?: string;
}
