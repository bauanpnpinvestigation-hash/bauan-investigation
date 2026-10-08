import { ReportTypeDefinition, PersonalInformation } from '../types/reports';
import { formatPersonalInformationText, formatVehicularAccidentText, formatSectionText } from '../utils/formatters';
import { formatHumanDate } from '../utils/dateUtils';

export const REPORT_TYPES: Record<string, ReportTypeDefinition> = {
  'personal-intake': {
    id: 'personal-intake',
    nameEn: 'Personal Information Record',
    nameFil: 'Pagtatala ng Impormasyon',
    descriptionEn: 'Citizen Personal Information Intake Record',
    descriptionFil: 'Pagtatala ng Opisyal na Personal na Impormasyon ng Mamamayan',
    iconName: 'User',
    sections: [
      {
        id: 'investigation-notes',
        titleEn: 'Investigation & Case Notes',
        titleFil: 'Mga Tala sa Imbestigasyon',
        description: 'Officer notes, case classification, and incident remarks recorded at the police station desk.',
        fields: [
          {
            id: 'caseClassification',
            labelEn: 'Case Classification',
            labelFil: 'Klasipikasyon ng Kaso',
            type: 'select',
            required: false,
            options: [
              { label: 'Vehicular Incident (Insidente sa Sasakyan)', value: 'Vehicular Incident' },
              { label: 'General Incident / Blotter (Pangkalahatang Insidente)', value: 'General Incident' },
              { label: 'Complaint / Grievance (Reklamo / Sumbong)', value: 'Complaint' },
              { label: 'Police Clearance / Certification (Sertipikasyon)', value: 'Certification' },
              { label: 'Other Police Matter (Iba Pa)', value: 'Other' },
            ],
          },
          {
            id: 'incidentDate',
            labelEn: 'Incident / Occurrence Date',
            labelFil: 'Petsa ng Pangyayari',
            type: 'date',
            required: false,
          },
          {
            id: 'incidentLocation',
            labelEn: 'Location',
            labelFil: 'Lugar ng Pangyayari',
            type: 'text',
            required: false,
            placeholder: 'Exact street, landmark, barangay, municipality/city',
          },
          {
            id: 'officialNarrative',
            labelEn: 'Official Police Narrative / Statement',
            labelFil: 'Opisyal na Salaysay / Rekord ng Pulisya',
            type: 'textarea',
            required: false,
            placeholder: 'Record complete statement, facts established, and actions taken by duty investigator.',
            rows: 6,
          },
          {
            id: 'investigatorAssigned',
            labelEn: 'Investigator on Case',
            labelFil: 'Nakahawak na Imbestigador',
            type: 'text',
            required: false,
            placeholder: 'Rank and full name of designated investigator',
          },
        ],
      },
    ],
    generateTemplate: (personalInfo, reportData, referenceNumber) => {
      const parts: string[] = [];

      parts.push('==================================================');
      parts.push('PHILIPPINE NATIONAL POLICE / INVESTIGATION BUREAU');
      parts.push('OFFICIAL CITIZEN INTAKE & PERSONAL RECORD');
      if (referenceNumber) parts.push(`REFERENCE NO: ${referenceNumber}`);
      parts.push('==================================================\n');

      const piText = formatPersonalInformationText(personalInfo);
      if (piText) {
        parts.push('PERSONAL INFORMATION');
        parts.push(piText);
        parts.push('');
      }

      const caseFields = [
        { label: 'Case Classification', value: reportData.caseClassification },
        { label: 'Incident Date', value: formatHumanDate(reportData.incidentDate) },
        { label: 'Incident Location', value: reportData.incidentLocation },
        { label: 'Investigator on Case', value: reportData.investigatorAssigned },
      ];
      const caseText = formatSectionText('INVESTIGATION & CASE DETAILS', caseFields);
      if (caseText) {
        parts.push(caseText);
        parts.push('');
      }

      if (reportData.officialNarrative?.trim()) {
        parts.push('OFFICIAL POLICE NARRATIVE / STATEMENT');
        parts.push(reportData.officialNarrative.trim());
        parts.push('');
      }

      return parts.join('\n').trim();
    },
  },
  'vehicular-incident': {
    id: 'vehicular-incident',
    nameEn: 'Vehicular Accident',
    nameFil: 'Aksidente / Insidente sa Sasakyan',
    descriptionEn: 'Traffic collision, property damage, vehicular physical injury, or hit and run.',
    descriptionFil: 'Banggaan ng sasakyan, pinsala sa ari-arian, pinsala sa katawan, o hit and run.',
    iconName: 'Car',
    sections: [
      {
        id: 'vehicle-info',
        titleEn: 'Vehicle Information',
        titleFil: 'Impormasyon ng Sasakyan',
        description: 'Details of the vehicle involved in the vehicular accident.',
        fields: [
          {
            id: 'vehicleMake',
            labelEn: 'Vehicle Make / Brand',
            labelFil: 'Tatak / Brand ng Sasakyan',
            type: 'text',
            required: true,
            placeholder: 'e.g. Mitsubishi, Toyota, Honda, Yamaha',
            suggestions: [
              'Mitsubishi',
              'Toyota',
              'Honda',
              'Yamaha',
              'Suzuki',
              'Isuzu',
              'Ford',
              'Nissan',
              'Hyundai',
              'Kia',
              'Geely',
              'MG',
              'Kawasaki',
              'RUSI',
            ],
          },
          {
            id: 'vehicleModel',
            labelEn: 'Vehicle Model',
            labelFil: 'Modelo ng Sasakyan',
            type: 'text',
            required: true,
            placeholder: 'e.g. Expander, Vios, Montero Sport, Click 125i',
            suggestions: [
              'Expander',
              'Montero Sport',
              'Mirage G4',
              'L300',
              'Strada / Triton',
              'Vios',
              'Innova',
              'Fortuner',
              'Hilux',
              'Wigo',
              'Raize',
              'Click 125i',
              'PCX 160',
              'ADV 160',
              'NMAX',
              'Aerox 155',
              'Sniper 155',
              'Ertiga',
              'D-Max',
              'Ranger',
            ],
          },
          {
            id: 'vehicleYear',
            labelEn: 'Vehicle Year Model',
            labelFil: 'Taon ng Modelo (Year)',
            type: 'text',
            required: true,
            placeholder: 'e.g. 2026',
          },
          {
            id: 'vehicleColor',
            labelEn: 'Vehicle Color (colored ...)',
            labelFil: 'Kulay ng Sasakyan',
            type: 'text',
            required: true,
            placeholder: 'e.g. graphite gray metallic, pearl white, black',
          },
          {
            id: 'plateNumber',
            labelEn: 'Plate Number (bearing plate number ...)',
            labelFil: 'Numero ng Plaka / MV File No.',
            type: 'text',
            required: true,
            placeholder: 'e.g. DCH 2797',
          },
        ],
      },
      {
        id: 'driver-info',
        titleEn: 'Driver Information',
        titleFil: 'Impormasyon ng Driver',
        description: 'Details of the person operating the vehicle at the time of the incident.',
        fields: [
          {
            id: 'driverName',
            labelEn: 'Driver Name',
            labelFil: 'Pangalan ng Driver',
            type: 'text',
            required: true,
            placeholder: 'Full name if different from reporting client',
          },
          {
            id: 'driverLicenseNumber',
            labelEn: 'Driver License Number',
            labelFil: 'Numero ng Lisensya',
            type: 'text',
            required: false,
            placeholder: 'e.g. N01-12-123456',
          },
          {
            id: 'driverContactNumber',
            labelEn: 'Driver Contact Number',
            labelFil: 'Numero ng Telepono',
            type: 'text',
            required: false,
            placeholder: 'e.g. 0917-123-4567',
          },
        ],
      },
      {
        id: 'incident-info',
        titleEn: 'Place & Time of Incident',
        titleFil: 'Lugar at Oras ng Insidente',
        description: 'Standalone section for Place and Time of Incident (kept separate from the full vehicle & driver blotter copy).',
        fields: [
          {
            id: 'placeOfIncident',
            labelEn: 'Place of Incident',
            labelFil: 'Lugar ng Insidente',
            type: 'text',
            required: true,
            placeholder: 'e.g. National Highway, Brgy. Manghinao Proper, Bauan, Batangas',
          },
          {
            id: 'incidentTime',
            labelEn: 'Time of Incident',
            labelFil: 'Oras at Petsa ng Insidente',
            type: 'text',
            required: true,
            placeholder: 'e.g. October 8, 2026 at 2:30 PM',
          },
          {
            id: 'incidentType',
            labelEn: 'Incident Type (Optional Officer Note)',
            labelFil: 'Uri ng Insidente',
            type: 'select',
            required: false,
            options: [
              { label: 'Rear-end Collision (Banggaan sa Likod)', value: 'Rear-end Collision' },
              { label: 'Side Impact / T-Bone (Banggaan sa Gilid)', value: 'Side Impact' },
              { label: 'Head-on Collision (Salpukang Harapan)', value: 'Head-on Collision' },
              { label: 'Sideswipe (Kaskasan / Gasgasan)', value: 'Sideswipe' },
              { label: 'Hit and Run (Hit and Run)', value: 'Hit and Run' },
              { label: 'Self-Accident / Rollover (Aksidente sa Sarili)', value: 'Self-Accident' },
              { label: 'Hitting Fixed Object (Bumangga sa Pader/Poste)', value: 'Hitting Fixed Object' },
              { label: 'Pedestrian Hit (Nasagi ang Taong Naglalakad)', value: 'Pedestrian Hit' },
              { label: 'Other (Iba Pa)', value: 'Other' },
            ],
          },
          {
            id: 'narrative',
            labelEn: 'Narrative / Description (Optional Officer Note)',
            labelFil: 'Salaysay / Paglalarawan',
            type: 'textarea',
            required: false,
            placeholder: 'Provide a detailed narrative of what transpired before, during, and after the incident.',
            rows: 4,
          },
        ],
      },
      {
        id: 'other-party',
        titleEn: 'Other Party Information',
        titleFil: 'Impormasyon ng Kabilang Panig',
        description: 'Information about the other driver, vehicle, or owner involved.',
        fields: [
          {
            id: 'otherPartyName',
            labelEn: 'Other Party Name',
            labelFil: 'Pangalan ng Kabilang Panig',
            type: 'text',
            required: false,
            placeholder: 'Name of the other driver or owner',
          },
          {
            id: 'otherPartyContact',
            labelEn: 'Other Party Contact',
            labelFil: 'Numero ng Telepono ng Kabilang Panig',
            type: 'text',
            required: false,
            placeholder: 'Contact number of the other party',
          },
          {
            id: 'otherPartyVehicle',
            labelEn: 'Other Party Vehicle',
            labelFil: 'Sasakyan ng Kabilang Panig',
            type: 'text',
            required: false,
            placeholder: 'Make, model, color of other vehicle',
          },
          {
            id: 'otherPartyPlateNumber',
            labelEn: 'Other Party Plate Number',
            labelFil: 'Plaka ng Kabilang Panig',
            type: 'text',
            required: false,
            placeholder: 'Plate or conduction sticker number',
          },
          {
            id: 'otherPartyInformation',
            labelEn: 'Other Party Information',
            labelFil: 'Iba Pang Impormasyon',
            type: 'textarea',
            required: false,
            placeholder: 'Insurance policy, driver license notes, or additional remarks',
            rows: 3,
          },
        ],
      },
      {
        id: 'witness-info',
        titleEn: 'Witness Information',
        titleFil: 'Impormasyon ng Saksi',
        description: 'Details of any witnesses present at the scene.',
        fields: [
          {
            id: 'witnessName',
            labelEn: 'Witness Name',
            labelFil: 'Pangalan ng Saksi',
            type: 'text',
            required: false,
            placeholder: 'Full name of witness',
          },
          {
            id: 'witnessContact',
            labelEn: 'Witness Contact',
            labelFil: 'Numero ng Telepono ng Saksi',
            type: 'text',
            required: false,
            placeholder: 'Contact number',
          },
          {
            id: 'witnessAddress',
            labelEn: 'Witness Address',
            labelFil: 'Tirahan ng Saksi',
            type: 'text',
            required: false,
            placeholder: 'Witness home or workplace address',
          },
          {
            id: 'witnessStatement',
            labelEn: 'Witness Statement',
            labelFil: 'Pahayag ng Saksi',
            type: 'textarea',
            required: false,
            placeholder: 'Brief summary of what the witness saw',
            rows: 3,
          },
        ],
      },
    ],
    generateTemplate: (personalInfo, reportData) => {
      // Strictly keep the full copy clipboard to the Vehicle + Driver sentence only,
      // never mixing Place & Time of Incident into the main full copy clipboard.
      return formatVehicularAccidentText(personalInfo, reportData);
    },
  },

  'incident-report': {
    id: 'incident-report',
    nameEn: 'Incident Report',
    nameFil: 'Ulat ng Insidente',
    descriptionEn: 'Report general offenses, lost items, disturbances, or public safety matters.',
    descriptionFil: 'Pag-uulat ng pangkalahatang insidente, nawawalang gamit, kaguluhan, o katiwasayan.',
    iconName: 'AlertTriangle',
    sections: [
      {
        id: 'incident-details',
        titleEn: 'Incident Information',
        titleFil: 'Impormasyon ng Insidente',
        description: 'Details of when and where the incident took place.',
        fields: [
          {
            id: 'incidentDate',
            labelEn: 'Date of Incident',
            labelFil: 'Petsa ng Insidente',
            type: 'date',
            required: true,
          },
          {
            id: 'incidentTime',
            labelEn: 'Time of Incident',
            labelFil: 'Oras ng Insidente',
            type: 'time',
            required: true,
          },
          {
            id: 'location',
            labelEn: 'Location',
            labelFil: 'Lugar ng Insidente',
            type: 'text',
            required: true,
            placeholder: 'House no., street, landmark, barangay',
          },
          {
            id: 'classification',
            labelEn: 'Classification',
            labelFil: 'Klasipikasyon ng Insidente',
            type: 'select',
            required: true,
            options: [
              { label: 'Theft / Robbery (Pagnanakaw / Panghoholdap)', value: 'Theft / Robbery' },
              { label: 'Physical Injury / Assault (Pananakit)', value: 'Physical Injury' },
              { label: 'Property Damage / Vandalism (Pinsala sa Ari-arian)', value: 'Property Damage' },
              { label: 'Alarm and Scandal / Disturbance (Kaguluhan)', value: 'Alarm and Scandal' },
              { label: 'Lost / Found Item (Nawawala / Natagpuang Gamit)', value: 'Lost or Found' },
              { label: 'Threat / Harassment (Banta / Pangha-harass)', value: 'Threat' },
              { label: 'Cyber / Online Scams (Panloloko sa Internet)', value: 'Cyber Scam' },
              { label: 'Other Incident (Iba Pang Insidente)', value: 'Other' },
            ],
          },
          {
            id: 'narrative',
            labelEn: 'Narrative / Description',
            labelFil: 'Salaysay / Detalye ng Insidente',
            type: 'textarea',
            required: true,
            placeholder: 'Narrate clearly what happened step by step, specifying people, items, and sequence of events.',
            rows: 6,
          },
        ],
      },
      {
        id: 'persons-involved',
        titleEn: 'Other Persons Involved',
        titleFil: 'Iba Pang Taong Kasangkot',
        description: 'Identify suspects, companions, or victims involved.',
        fields: [
          {
            id: 'personsInvolvedNames',
            labelEn: 'Names of Persons Involved',
            labelFil: 'Pangalan ng mga Kasangkot',
            type: 'text',
            required: false,
            placeholder: 'Names, nicknames, or aliases',
          },
          {
            id: 'personsInvolvedDescription',
            labelEn: 'Physical Description / Distinct Features',
            labelFil: 'Pisikal na Paglalarawan',
            type: 'textarea',
            required: false,
            placeholder: 'Estimated height, clothing, tattoos, marks, or vehicles used',
            rows: 3,
          },
        ],
      },
      {
        id: 'witnesses',
        titleEn: 'Witness Information',
        titleFil: 'Impormasyon ng Saksi',
        description: 'Individuals who saw or can corroborate the event.',
        fields: [
          {
            id: 'witnessName',
            labelEn: 'Witness Name',
            labelFil: 'Pangalan ng Saksi',
            type: 'text',
            required: false,
            placeholder: 'Full name of witness',
          },
          {
            id: 'witnessContact',
            labelEn: 'Witness Contact',
            labelFil: 'Numero ng Telepono ng Saksi',
            type: 'text',
            required: false,
            placeholder: 'Contact number',
          },
          {
            id: 'witnessStatement',
            labelEn: 'Witness Statement',
            labelFil: 'Pahayag ng Saksi',
            type: 'textarea',
            required: false,
            placeholder: 'What the witness observed',
            rows: 3,
          },
        ],
      },
    ],
    generateTemplate: (personalInfo, reportData, referenceNumber) => {
      const parts: string[] = [];

      parts.push('==================================================');
      parts.push('PHILIPPINE NATIONAL POLICE / INVESTIGATION BUREAU');
      parts.push('OFFICIAL GENERAL INCIDENT REPORT');
      if (referenceNumber) parts.push(`REFERENCE NO: ${referenceNumber}`);
      parts.push('==================================================\n');

      const piText = formatPersonalInformationText(personalInfo);
      if (piText) {
        parts.push('PERSONAL INFORMATION');
        parts.push(piText);
        parts.push('');
      }

      const incidentFields = [
        { label: 'Date of Incident', value: formatHumanDate(reportData.incidentDate) },
        { label: 'Time of Incident', value: reportData.incidentTime },
        { label: 'Location', value: reportData.location },
        { label: 'Classification', value: reportData.classification },
      ];
      const incidentText = formatSectionText('INCIDENT INFORMATION', incidentFields);
      if (incidentText) {
        parts.push(incidentText);
        parts.push('');
      }

      if (reportData.narrative?.trim()) {
        parts.push('NARRATIVE');
        parts.push(reportData.narrative.trim());
        parts.push('');
      }

      const personsFields = [
        { label: 'Persons Involved', value: reportData.personsInvolvedNames },
        { label: 'Physical Description', value: reportData.personsInvolvedDescription },
      ];
      const personsText = formatSectionText('OTHER PERSONS INVOLVED', personsFields);
      if (personsText) {
        parts.push(personsText);
        parts.push('');
      }

      const witnessFields = [
        { label: 'Witness Name', value: reportData.witnessName },
        { label: 'Witness Contact', value: reportData.witnessContact },
        { label: 'Witness Statement', value: reportData.witnessStatement },
      ];
      const witnessText = formatSectionText('WITNESS INFORMATION', witnessFields);
      if (witnessText) {
        parts.push(witnessText);
        parts.push('');
      }

      return parts.join('\n').trim();
    },
  },

  'complaint': {
    id: 'complaint',
    nameEn: 'Complaint',
    nameFil: 'Reklamo / Sumbong',
    descriptionEn: 'Formal complaint filed against an individual, entity, neighbor, or establishment.',
    descriptionFil: 'Pormal na reklamo laban sa tao, establisimyento, kapitbahay, o kumpanya.',
    iconName: 'ShieldAlert',
    sections: [
      {
        id: 'complaint-info',
        titleEn: 'Complaint Information',
        titleFil: 'Impormasyon ng Reklamo',
        description: 'Specific subject and location of the grievance.',
        fields: [
          {
            id: 'complaintSubject',
            labelEn: 'Subject / Nature of Complaint',
            labelFil: 'Paksa o Dahilan ng Reklamo',
            type: 'text',
            required: true,
            placeholder: 'e.g. Unlawful harassment, breach of agreement, neighborhood nuisance',
          },
          {
            id: 'incidentDate',
            labelEn: 'Date of Incident',
            labelFil: 'Petsa ng Pangyayari',
            type: 'date',
            required: true,
          },
          {
            id: 'incidentTime',
            labelEn: 'Time of Incident',
            labelFil: 'Oras ng Pangyayari',
            type: 'time',
            required: false,
          },
          {
            id: 'location',
            labelEn: 'Location',
            labelFil: 'Lugar ng Pangyayari',
            type: 'text',
            required: true,
            placeholder: 'Place where the issue took place',
          },
          {
            id: 'narrative',
            labelEn: 'Narrative / Statement of Facts',
            labelFil: 'Salaysay / Detalye ng Reklamo',
            type: 'textarea',
            required: true,
            placeholder: 'Detail the chronological series of events and specific acts committed.',
            rows: 6,
          },
          {
            id: 'remedySought',
            labelEn: 'Remedy / Action Requested',
            labelFil: 'Hinihiling na Aksyon o Lunas',
            type: 'textarea',
            required: false,
            placeholder: 'What action or resolution are you requesting from the authorities?',
            rows: 2,
          },
        ],
      },
      {
        id: 'respondent-info',
        titleEn: 'Person/Party Complained Of',
        titleFil: 'Inirereklamong Tao o Panig',
        description: 'Details of the respondent or party being complained about.',
        fields: [
          {
            id: 'respondentName',
            labelEn: 'Respondent Name',
            labelFil: 'Pangalan ng Inirereklamo',
            type: 'text',
            required: true,
            placeholder: 'Full name or company / organization name',
          },
          {
            id: 'respondentAlias',
            labelEn: 'Alias / Nickname',
            labelFil: 'Alyas o Palayaw',
            type: 'text',
            required: false,
            placeholder: 'Known alias or monicker',
          },
          {
            id: 'respondentAddress',
            labelEn: 'Respondent Address',
            labelFil: 'Tirahan ng Inirereklamo',
            type: 'text',
            required: false,
            placeholder: 'Current known address or workplace',
          },
          {
            id: 'respondentContact',
            labelEn: 'Respondent Contact Number',
            labelFil: 'Numero ng Telepono ng Inirereklamo',
            type: 'text',
            required: false,
            placeholder: 'Contact number if available',
          },
          {
            id: 'relationship',
            labelEn: 'Relationship to Complainant',
            labelFil: 'Relasyon sa Nagrereklamo',
            type: 'text',
            required: false,
            placeholder: 'e.g. Neighbor, Business Partner, Landlord, Unknown',
          },
        ],
      },
      {
        id: 'witnesses-evidence',
        titleEn: 'Witnesses and Supporting Evidence',
        titleFil: 'Mga Saksi at Karagdagang Ebidensya',
        description: 'List supporting witnesses and proof.',
        fields: [
          {
            id: 'witnessNames',
            labelEn: 'Witness Names',
            labelFil: 'Pangalan ng mga Saksi',
            type: 'text',
            required: false,
            placeholder: 'Names and contact numbers of witnesses',
          },
          {
            id: 'supportingDocumentsDesc',
            labelEn: 'Supporting Documents Description',
            labelFil: 'Paglalarawan ng mga Dokumento',
            type: 'textarea',
            required: false,
            placeholder: 'List contracts, receipts, CCTV footage, chat logs, or photos available',
            rows: 3,
          },
        ],
      },
    ],
    generateTemplate: (personalInfo, reportData, referenceNumber) => {
      const parts: string[] = [];

      parts.push('==================================================');
      parts.push('PHILIPPINE NATIONAL POLICE / INVESTIGATION BUREAU');
      parts.push('OFFICIAL COMPLAINT STATEMENT');
      if (referenceNumber) parts.push(`REFERENCE NO: ${referenceNumber}`);
      parts.push('==================================================\n');

      const piText = formatPersonalInformationText(personalInfo);
      if (piText) {
        parts.push('COMPLAINANT PERSONAL INFORMATION');
        parts.push(piText);
        parts.push('');
      }

      const complaintFields = [
        { label: 'Subject of Complaint', value: reportData.complaintSubject },
        { label: 'Date of Incident', value: formatHumanDate(reportData.incidentDate) },
        { label: 'Time of Incident', value: reportData.incidentTime },
        { label: 'Location', value: reportData.location },
      ];
      const complaintText = formatSectionText('COMPLAINT INFORMATION', complaintFields);
      if (complaintText) {
        parts.push(complaintText);
        parts.push('');
      }

      if (reportData.narrative?.trim()) {
        parts.push('NARRATIVE / STATEMENT OF FACTS');
        parts.push(reportData.narrative.trim());
        parts.push('');
      }

      if (reportData.remedySought?.trim()) {
        parts.push('REMEDY / ACTION SOUGHT');
        parts.push(reportData.remedySought.trim());
        parts.push('');
      }

      const respondentFields = [
        { label: 'Respondent Name', value: reportData.respondentName },
        { label: 'Alias / Nickname', value: reportData.respondentAlias },
        { label: 'Respondent Address', value: reportData.respondentAddress },
        { label: 'Respondent Contact', value: reportData.respondentContact },
        { label: 'Relationship', value: reportData.relationship },
      ];
      const respondentText = formatSectionText('PERSON / PARTY COMPLAINED OF', respondentFields);
      if (respondentText) {
        parts.push(respondentText);
        parts.push('');
      }

      const evidenceFields = [
        { label: 'Witnesses', value: reportData.witnessNames },
        { label: 'Supporting Documents', value: reportData.supportingDocumentsDesc },
      ];
      const evidenceText = formatSectionText('WITNESSES AND SUPPORTING EVIDENCE', evidenceFields);
      if (evidenceText) {
        parts.push(evidenceText);
        parts.push('');
      }

      return parts.join('\n').trim();
    },
  },

  'other-request': {
    id: 'other-request',
    nameEn: 'Other Request',
    nameFil: 'Iba Pang Kahilingan',
    descriptionEn: 'Police blotter extract request, clearances, certifications, security assistance, or inquiries.',
    descriptionFil: 'Sipi ng blotter, clearance, sertipikasyon, tulong panseguridad, o pangkalahatang katanungan.',
    iconName: 'FileText',
    sections: [
      {
        id: 'request-details',
        titleEn: 'Request Details',
        titleFil: 'Mga Detalye ng Kahilingan',
        description: 'Specify the exact nature and purpose of your government/police request.',
        fields: [
          {
            id: 'category',
            labelEn: 'Request Category',
            labelFil: 'Kategorya ng Kahilingan',
            type: 'select',
            required: true,
            options: [
              { label: 'Police Blotter Extract / Copy (Kopya ng Blotter)', value: 'Police Blotter Extract' },
              { label: 'Police Certification / Clearance (Sertipikasyon ng Pulisya)', value: 'Police Certification' },
              { label: 'Certificate of Loss (Sertipikasyon ng Pagkawala)', value: 'Certificate of Loss' },
              { label: 'Security Escort / Patrol Request (Kahilingan sa Seguridad / Pagpapatrolya)', value: 'Security Assistance' },
              { label: 'Verification of Record (Pagpapatunay ng Rekord)', value: 'Record Verification' },
              { label: 'General Inquiry / Assistance (Pangkalahatang Tulong)', value: 'General Inquiry' },
              { label: 'Other Request (Iba Pa)', value: 'Other' },
            ],
          },
          {
            id: 'subject',
            labelEn: 'Subject',
            labelFil: 'Paksa / Layunin',
            type: 'text',
            required: true,
            placeholder: 'Brief summary of what you are requesting',
          },
          {
            id: 'purpose',
            labelEn: 'Purpose / Reason',
            labelFil: 'Layunin o Gamit',
            type: 'text',
            required: true,
            placeholder: 'e.g. For Insurance claim, Employment, Legal proceeding, School, SSS/GSIS',
          },
          {
            id: 'description',
            labelEn: 'Description / Details',
            labelFil: 'Salaysay / Detalyeng Kahilingan',
            type: 'textarea',
            required: true,
            placeholder: 'Provide complete details and context regarding this request.',
            rows: 5,
          },
          {
            id: 'additionalNotes',
            labelEn: 'Additional Information',
            labelFil: 'Karagdagang Impormasyon',
            type: 'textarea',
            required: false,
            placeholder: 'Prior blotter entry numbers, case references, or special instructions if applicable.',
            rows: 2,
          },
        ],
      },
    ],
    generateTemplate: (personalInfo, reportData, referenceNumber) => {
      const parts: string[] = [];

      parts.push('==================================================');
      parts.push('PHILIPPINE NATIONAL POLICE / INVESTIGATION BUREAU');
      parts.push('OFFICIAL POLICE SERVICE / DOCUMENT REQUEST');
      if (referenceNumber) parts.push(`REFERENCE NO: ${referenceNumber}`);
      parts.push('==================================================\n');

      const piText = formatPersonalInformationText(personalInfo);
      if (piText) {
        parts.push('REQUESTER PERSONAL INFORMATION');
        parts.push(piText);
        parts.push('');
      }

      const requestFields = [
        { label: 'Category', value: reportData.category },
        { label: 'Subject', value: reportData.subject },
        { label: 'Purpose', value: reportData.purpose },
      ];
      const requestText = formatSectionText('REQUEST INFORMATION', requestFields);
      if (requestText) {
        parts.push(requestText);
        parts.push('');
      }

      if (reportData.description?.trim()) {
        parts.push('DESCRIPTION / DETAILS');
        parts.push(reportData.description.trim());
        parts.push('');
      }

      if (reportData.additionalNotes?.trim()) {
        parts.push('ADDITIONAL INFORMATION');
        parts.push(reportData.additionalNotes.trim());
        parts.push('');
      }

      return parts.join('\n').trim();
    },
  },
};
