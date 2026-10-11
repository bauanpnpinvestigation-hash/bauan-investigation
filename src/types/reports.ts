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

export type InvestigatorTeamId = 'TEAM_1' | 'TEAM_2';

export type MergeInvestigatorName =
  | 'Team 1 — Saycon & Care (Kim Edsel Saycon & Bienne Care)'
  | 'Team 1 (Saycon & Care) — Kim Edsel Saycon'
  | 'Team 1 (Saycon & Care) — Bienne Care'
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
    teamTitle: 'Team 1 — Saycon & Care',
    teamPairName: 'Saycon & Care',
    teamSubtitle: 'Kim Edsel Saycon & Bienne Care',
    defaultSelection: 'Team 1 — Saycon & Care (Kim Edsel Saycon & Bienne Care)',
    investigators: [
      {
        value: 'Team 1 — Saycon & Care (Kim Edsel Saycon & Bienne Care)',
        shortName: 'Saycon & Care (Both Team 1)',
        roleLabel: 'Full Team 1 Investigators',
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Saycon & Care',
      },
      {
        value: 'Team 1 (Saycon & Care) — Kim Edsel Saycon',
        shortName: 'Kim Edsel Saycon',
        roleLabel: 'Team 1 Investigator',
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Saycon & Care',
      },
      {
        value: 'Team 1 (Saycon & Care) — Bienne Care',
        shortName: 'Bienne Care',
        roleLabel: 'Team 1 Investigator',
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Saycon & Care',
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
 * Validates and normalizes an investigator / team string to an official Team 1 (Saycon & Care)
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

  // Check Team 1 keywords (Saycon / Care / Team 1)
  if ((lower.includes('saycon') || lower.includes('sayco')) && lower.includes('care')) {
    if (lower.endsWith('kim edsel saycon')) {
      return {
        isValid: true,
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Saycon & Care',
        normalizedValue: 'Team 1 (Saycon & Care) — Kim Edsel Saycon',
      };
    }
    if (lower.endsWith('bienne care')) {
      return {
        isValid: true,
        teamId: 'TEAM_1',
        teamName: 'Team 1 — Saycon & Care',
        normalizedValue: 'Team 1 (Saycon & Care) — Bienne Care',
      };
    }
    return {
      isValid: true,
      teamId: 'TEAM_1',
      teamName: 'Team 1 — Saycon & Care',
      normalizedValue: 'Team 1 — Saycon & Care (Kim Edsel Saycon & Bienne Care)',
    };
  }
  if (lower.includes('bienne') || lower.includes('care')) {
    return {
      isValid: true,
      teamId: 'TEAM_1',
      teamName: 'Team 1 — Saycon & Care',
      normalizedValue: 'Team 1 (Saycon & Care) — Bienne Care',
    };
  }
  if (lower.includes('saycon') || lower.includes('sayco') || lower.includes('kim edsel')) {
    return {
      isValid: true,
      teamId: 'TEAM_1',
      teamName: 'Team 1 — Saycon & Care',
      normalizedValue: 'Team 1 (Saycon & Care) — Kim Edsel Saycon',
    };
  }
  if (lower.includes('team 1') || lower === 'team_1') {
    return {
      isValid: true,
      teamId: 'TEAM_1',
      teamName: 'Team 1 — Saycon & Care',
      normalizedValue: 'Team 1 — Saycon & Care (Kim Edsel Saycon & Bienne Care)',
    };
  }

  return {
    isValid: false,
    teamId: 'TEAM_1',
    teamName: 'Team 1 — Saycon & Care',
    normalizedValue: 'Team 1 — Saycon & Care (Kim Edsel Saycon & Bienne Care)',
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
