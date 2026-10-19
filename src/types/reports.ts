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

export type DocumentCategoryType =
  | 'VALID_ID'
  | 'OR'
  | 'CR'
  | 'OR_CR'
  | 'SCENE_PHOTO'
  | 'EVIDENCE'
  | 'OTHER';

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
  documentCategory?: DocumentCategoryType;
  documentCategoryLabel?: string;
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

export interface CommonIncidentTypeOption {
  id: string;
  labelEn: string;
  labelFil: string;
  category: string;
  descriptionEn: string;
  descriptionFil: string;
  badgeColor: string;
}

export const COMMON_INCIDENT_TYPES: CommonIncidentTypeOption[] = [
  {
    id: 'police-report-general',
    labelEn: 'Police Blotter / General Incident Report',
    labelFil: 'Opisyal na Police Report / Blotter',
    category: 'Police Report',
    descriptionEn: 'General station blotter, formal incident recording, or verified police report statement.',
    descriptionFil: 'Pangkalahatang blotter, opisyal na rekord ng himpilan, o salaysay ng pulisya.',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    id: 'theft-robbery',
    labelEn: 'Theft / Robbery (Pagnanakaw)',
    labelFil: 'Pagnanakaw / Panghoholdap / Hold-up',
    category: 'Theft / Robbery',
    descriptionEn: 'Stolen personal belongings, motorcycle theft, shoplifting, burglary, or robbery.',
    descriptionFil: 'Nanakaw na gamit, salisi, holdap, o sapilitang pagkuha ng ari-arian.',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    id: 'lost-property',
    labelEn: 'Lost Item / Documents (Affidavit of Loss)',
    labelFil: 'Nawawalang Gamit o Dokumento (Affidavit of Loss / Blotter)',
    category: 'Lost Property',
    descriptionEn: 'Lost driver license, government ID, wallet, cellphone, or important legal certificates.',
    descriptionFil: 'Nawawalang lisensya, ID, cellphone, pitaka, o opisyal na dokumento.',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'physical-injury',
    labelEn: 'Physical Injury / Assault (Pananakit)',
    labelFil: 'Pananakit / Physical Injuries / Bugbugan',
    category: 'Physical Injury',
    descriptionEn: 'Physical assault, altercation, battery, or intentional bodily injury.',
    descriptionFil: 'Pananakit, suntukan, o pinsala sa katawan mula sa ibang tao.',
    badgeColor: 'bg-red-100 text-red-900 border-red-300',
  },
  {
    id: 'vehicular-traffic',
    labelEn: 'Vehicular / Traffic Incident',
    labelFil: 'Insidente o Aksidente sa Sasakyan',
    category: 'Vehicular Incident',
    descriptionEn: 'Vehicle collision, traffic damage, or vehicular accident matter.',
    descriptionFil: 'Banggaan, atrasan, o pinsala sa sasakyan at trapiko.',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    id: 'property-damage',
    labelEn: 'Property Damage / Malicious Mischief',
    labelFil: 'Pinsala sa Ari-arian / Vandalism',
    category: 'Property Damage',
    descriptionEn: 'Intentional destruction or damage to private property, fence, building, or vehicle.',
    descriptionFil: 'Sadyang pagsira sa ari-arian, bakod, bahay, o kagamitan.',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'disturbance-threat',
    labelEn: 'Alarm & Scandal / Threat / Harassment',
    labelFil: 'Kaguluhan / Pagwawala / Banta / Harassment',
    category: 'Disturbance / Threat',
    descriptionEn: 'Neighborhood commotion, verbal death threat, drunken nuisance, or unjust vexation.',
    descriptionFil: 'Kaguluhan sa kapitbahay, banta sa buhay, panliligalig, o panggugulo.',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  },
  {
    id: 'complaint-grievance',
    labelEn: 'Complaint / Grievance (Reklamo)',
    labelFil: 'Pormal na Reklamo / Sumbong',
    category: 'Complaint',
    descriptionEn: 'Formal complaint filed against an individual, neighbor, landlord, or establishment.',
    descriptionFil: 'Pormal na reklamo o sumbong laban sa tao, kumpanya, o establisimyento.',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
  },
  {
    id: 'clearance-certification',
    labelEn: 'Police Clearance / Certification Request',
    labelFil: 'Sertipikasyon ng Pulisya / Police Record',
    category: 'Certification',
    descriptionEn: 'Official police certification, station endorsement, or clearance verification.',
    descriptionFil: 'Kahilingan para sa opisyal na sertipikasyon, patunay, o beripikasyon mula sa estasyon.',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'cyber-fraud',
    labelEn: 'Cyber Crime / Online Scam / GCash Fraud',
    labelFil: 'Panloloko sa Internet / Online Scam / GCash',
    category: 'Cyber Scam',
    descriptionEn: 'Online fraud, fake seller, phishing, social media account compromise, or scam transfer.',
    descriptionFil: 'Panloloko sa social media, pekeng nagbebenta, o unauthorized transfer.',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  },
  {
    id: 'other-case',
    labelEn: 'Other Common Police Case',
    labelFil: 'Iba Pang Karaniwang Kaso ng Pulisya',
    category: 'Other Case',
    descriptionEn: 'Other police concerns requiring official police recording and blotter.',
    descriptionFil: 'Iba pang usapin o kaganapan na kailangan ng opisyal na tala sa himpilan.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
];

export type InvestigatorTeamId = 'TEAM_1' | 'TEAM_2';

export type MergeInvestigatorName =
  | 'Team 1 — Sayco & Care (Kim Edsel Sayco & Bienne Care)'
  | 'Team 1 (Sayco & Care) — Kim Edsel Sayco'
  | 'Team 1 (Sayco & Care) — Bienne Care'
  | 'Team 2 — Alzate & Serwelas'
  | 'Team 2 (Alzate & Serwelas) — Alzate'
  | 'Team 2 (Alzate & Serwelas) — Serwelas';

export interface InvestigatorOptionItem {
  value: MergeInvestigatorName;
  shortName: string;
  roleLabel: string;
  teamId: InvestigatorTeamId;
  teamName: string;
}

export interface InvestigatorTeamConfig {
  id: InvestigatorTeamId;
  teamNumber: 1 | 2;
  teamTitle: string;
  teamPairName: string;
  teamSubtitle: string;
  defaultSelection: MergeInvestigatorName;
  investigators: InvestigatorOptionItem[];
}

export const INVESTIGATOR_TEAMS: InvestigatorTeamConfig[] = [
  {
    id: 'TEAM_1',
    teamNumber: 1,
    teamTitle: 'Team 1 — Sayco & Care',
    teamPairName: 'Sayco & Care',
    teamSubtitle: 'Kim Edsel Sayco & Bienne Care',
    defaultSelection: 'Team 1 — Sayco & Care (Kim Edsel Sayco & Bienne Care)',
    investigators: [
      {
        value: 'Team 1 — Sayco & Care (Kim Edsel Sayco & Bienne Care)',
        shortName: 'Sayco & Care (Both Team 1)',
        roleLabel: 'Full Team 1 Investigators',
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Sayco & Care',
      },
      {
        value: 'Team 1 (Sayco & Care) — Kim Edsel Sayco',
        shortName: 'Kim Edsel Sayco',
        roleLabel: 'Team 1 Investigator',
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Sayco & Care',
      },
      {
        value: 'Team 1 (Sayco & Care) — Bienne Care',
        shortName: 'Bienne Care',
        roleLabel: 'Team 1 Investigator',
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Sayco & Care',
      },
    ],
  },
  {
    id: 'TEAM_2',
    teamNumber: 2,
    teamTitle: 'Team 2 — Alzate & Serwelas',
    teamPairName: 'Alzate & Serwelas',
    teamSubtitle: 'Investigators Alzate & Serwelas',
    defaultSelection: 'Team 2 — Alzate & Serwelas',
    investigators: [
      {
        value: 'Team 2 — Alzate & Serwelas',
        shortName: 'Alzate & Serwelas (Both Team 2)',
        roleLabel: 'Full Team 2 Investigators',
        teamId: 'TEAM_2',
        teamName: 'Team 2 — Alzate & Serwelas',
      },
      {
        value: 'Team 2 (Alzate & Serwelas) — Alzate',
        shortName: 'Alzate',
        roleLabel: 'Team 2 Investigator',
        teamId: 'TEAM_2',
        teamName: 'Team 2 — Alzate & Serwelas',
      },
      {
        value: 'Team 2 (Alzate & Serwelas) — Serwelas',
        shortName: 'Serwelas',
        roleLabel: 'Team 2 Investigator',
        teamId: 'TEAM_2',
        teamName: 'Team 2 — Alzate & Serwelas',
      },
    ],
  },
];

export const MERGE_INVESTIGATOR_OPTIONS: MergeInvestigatorName[] = INVESTIGATOR_TEAMS.flatMap(
  (t) => t.investigators.map((inv) => inv.value)
);

/**
 * Validates and normalizes an investigator / team string to an official Team 1 (Sayco & Care)
 * or Team 2 (Alzate & Serwelas) investigator selection.
 */
export function validateAndNormalizeInvestigator(
  rawInput?: string | null
): {
  isValid: boolean;
  teamId: InvestigatorTeamId;
  teamName: string;
  normalizedValue: MergeInvestigatorName;
} {
  const raw = String(rawInput || '').trim();
  const lower = raw.toLowerCase();

  // Check exact match first
  for (const team of INVESTIGATOR_TEAMS) {
    for (const inv of team.investigators) {
      if (inv.value.toLowerCase() === lower) {
        return {
          isValid: true,
          teamId: team.id,
          teamName: team.teamTitle,
          normalizedValue: inv.value,
        };
      }
    }
  }

  // Check Team 2 keywords (Alzate / Serwelas / Team 2)
  if (lower.includes('alzate') && lower.includes('serwelas')) {
    if (lower.endsWith('— alzate') || lower.endsWith('- alzate')) {
      return {
        isValid: true,
        teamId: 'TEAM_2',
        teamName: 'Team 2 — Alzate & Serwelas',
        normalizedValue: 'Team 2 (Alzate & Serwelas) — Alzate',
      };
    }
    if (lower.endsWith('— serwelas') || lower.endsWith('- serwelas')) {
      return {
        isValid: true,
        teamId: 'TEAM_2',
        teamName: 'Team 2 — Alzate & Serwelas',
        normalizedValue: 'Team 2 (Alzate & Serwelas) — Serwelas',
      };
    }
    return {
      isValid: true,
      teamId: 'TEAM_2',
      teamName: 'Team 2 — Alzate & Serwelas',
      normalizedValue: 'Team 2 — Alzate & Serwelas',
    };
  }
  if (lower.includes('alzate')) {
    return {
      isValid: true,
      teamId: 'TEAM_2',
      teamName: 'Team 2 — Alzate & Serwelas',
      normalizedValue: 'Team 2 (Alzate & Serwelas) — Alzate',
    };
  }
  if (lower.includes('serwelas')) {
    return {
      isValid: true,
      teamId: 'TEAM_2',
      teamName: 'Team 2 — Alzate & Serwelas',
      normalizedValue: 'Team 2 (Alzate & Serwelas) — Serwelas',
    };
  }
  if (lower.includes('team 2') || lower === 'team_2') {
    return {
      isValid: true,
      teamId: 'TEAM_2',
      teamName: 'Team 2 — Alzate & Serwelas',
      normalizedValue: 'Team 2 — Alzate & Serwelas',
    };
  }

  // Check Team 1 keywords (Sayco / Saycon / Care / Team 1)
  if ((lower.includes('sayco') || lower.includes('saycon')) && lower.includes('care')) {
    if (lower.endsWith('kim edsel sayco') || lower.endsWith('kim edsel saycon')) {
      return {
        isValid: true,
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Sayco & Care',
        normalizedValue: 'Team 1 (Sayco & Care) — Kim Edsel Sayco',
      };
    }
    if (lower.endsWith('bienne care')) {
      return {
        isValid: true,
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Sayco & Care',
        normalizedValue: 'Team 1 (Sayco & Care) — Bienne Care',
      };
    }
    return {
      isValid: true,
      teamId: 'TEAM_1',
      teamName: 'Team 1 — Sayco & Care',
      normalizedValue: 'Team 1 — Sayco & Care (Kim Edsel Sayco & Bienne Care)',
    };
  }
  if (lower.includes('bienne') || lower.includes('care')) {
    return {
      isValid: true,
      teamId: 'TEAM_1',
      teamName: 'Team 1 — Sayco & Care',
      normalizedValue: 'Team 1 (Sayco & Care) — Bienne Care',
    };
  }
  if (lower.includes('sayco') || lower.includes('saycon') || lower.includes('kim edsel')) {
    return {
      isValid: true,
      teamId: 'TEAM_1',
      teamName: 'Team 1 — Sayco & Care',
      normalizedValue: 'Team 1 (Sayco & Care) — Kim Edsel Sayco',
    };
  }
  if (lower.includes('team 1') || lower === 'team_1') {
    return {
      isValid: true,
      teamId: 'TEAM_1',
      teamName: 'Team 1 — Sayco & Care',
      normalizedValue: 'Team 1 — Sayco & Care (Kim Edsel Sayco & Bienne Care)',
    };
  }

  return {
    isValid: false,
    teamId: 'TEAM_1',
    teamName: 'Team 1 — Sayco & Care',
    normalizedValue: 'Team 1 — Sayco & Care (Kim Edsel Sayco & Bienne Care)',
  };
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
  mergedFileTitle?: string;
  mergedByTeam?: InvestigatorTeamId;
  mergedByInvestigator?: string;
  sourceReportIds?: string[];
  sourceReferenceNumbers?: string[];
  attachments: AttachmentItem[];
  adminNotes: AdminNote[];
  auditLogs: AuditLogEntry[];
  stationOffice?: string;
}
