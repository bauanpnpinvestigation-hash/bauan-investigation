import React, { useEffect } from 'react';
import { PersonalInformation, SexType, CivilStatusType } from '../../types/reports';
import { FormField } from './FormField';
import { calculateAge } from '../../utils/dateUtils';
import { Calendar, User, Phone, MapPin, Briefcase } from 'lucide-react';

interface PersonalInformationFormProps {
  data: PersonalInformation;
  onChange: (updated: PersonalInformation) => void;
  errors?: Partial<Record<keyof PersonalInformation, string>>;
}

const COMMON_OCCUPATIONS = [
  'Government Employee',
  'Private Employee',
  'Self-Employed / Business Owner',
  'Driver (PUV / Private)',
  'Construction Worker',
  'OFW (Overseas Filipino Worker)',
  'Farmer / Fisherfolk',
  'Merchant / Vendor',
  'Student',
  'Retired / Pensioner',
  'Security Guard',
  'Housewife / Homemaker',
  'Unemployed',
];

const COMMON_SUFFIXES = ['None', 'Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

export const PersonalInformationForm: React.FC<PersonalInformationFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  // Automatically calculate and update age whenever Birthday changes
  useEffect(() => {
    if (data.birthday) {
      const computedAge = calculateAge(data.birthday);
      if (computedAge !== data.age) {
        onChange({
          ...data,
          age: computedAge,
        });
      }
    } else if (data.age !== null) {
      onChange({
        ...data,
        age: null,
      });
    }
  }, [data.birthday]);

  const handleChange = (field: keyof PersonalInformation, value: any) => {
    if (field === 'birthday') {
      const computedAge = calculateAge(value);
      onChange({
        ...data,
        birthday: value,
        age: computedAge,
      });
      return;
    }

    onChange({
      ...data,
      [field]: value,
    });
  };

  // Get max date for birthday (today)
  const maxBirthday = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Informative Guidance */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs sm:text-sm text-blue-900 flex items-start gap-2.5">
        <User className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Confidentiality Protected</p>
          <p className="text-blue-800 text-xs mt-0.5">
            Please enter the client’s accurate legal identity details. All entries are encrypted and strictly protected under police security protocols.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* 1. First Name (Unang Pangalan) */}
        <FormField
          id="firstName"
          labelEn="First Name"
          labelFil="Unang Pangalan"
          required
          error={errors.firstName}
        >
          <input
            id="firstName"
            type="text"
            value={data.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="e.g. Juan"
            autoComplete="given-name"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
          />
        </FormField>

        {/* 2. Middle Name (Gitnang Pangalan) */}
        <FormField
          id="middleName"
          labelEn="Middle Name"
          labelFil="Gitnang Pangalan"
          helpText="Leave blank if no middle name"
          error={errors.middleName}
        >
          <input
            id="middleName"
            type="text"
            value={data.middleName || ''}
            onChange={(e) => handleChange('middleName', e.target.value)}
            placeholder="e.g. Santos"
            autoComplete="additional-name"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
          />
        </FormField>

        {/* 3. Last Name (Apelyido) */}
        <FormField
          id="lastName"
          labelEn="Last Name"
          labelFil="Apelyido"
          required
          error={errors.lastName}
        >
          <input
            id="lastName"
            type="text"
            value={data.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="e.g. Dela Cruz"
            autoComplete="family-name"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
          />
        </FormField>

        {/* 4. Suffix (Panlapi sa Pangalan) */}
        <FormField
          id="suffix"
          labelEn="Suffix"
          labelFil="Panlapi sa Pangalan"
          helpText="Examples: Jr., Sr., II, III, or None"
          error={errors.suffix}
        >
          <div className="relative">
            <input
              id="suffix"
              type="text"
              list="suffix-suggestions"
              value={data.suffix || ''}
              onChange={(e) => handleChange('suffix', e.target.value)}
              placeholder="e.g. Jr., Sr., III (or None)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
            />
            <datalist id="suffix-suggestions">
              {COMMON_SUFFIXES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </FormField>

        {/* 5. Birthday (Araw ng Kapanganakan) */}
        <FormField
          id="birthday"
          labelEn="Birthday"
          labelFil="Araw ng Kapanganakan"
          required
          helpText="Age will be automatically calculated"
          error={errors.birthday}
        >
          <div className="relative">
            <input
              id="birthday"
              type="date"
              max={maxBirthday}
              value={data.birthday || ''}
              onChange={(e) => handleChange('birthday', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </FormField>

        {/* 6. Age (Edad) - READ ONLY, NEVER MANUALLY ENTERED */}
        <FormField
          id="age"
          labelEn="Age"
          labelFil="Edad"
          helpText="Automatically computed from Birthday (Read-Only)"
          error={errors.age ? String(errors.age) : undefined}
        >
          <div className="relative">
            <input
              id="age"
              type="text"
              readOnly
              value={data.age !== null && data.age !== undefined ? `${data.age} years old` : '— (Auto-calculates from Birthday)'}
              aria-readonly="true"
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 cursor-not-allowed select-none shadow-inner"
            />
          </div>
        </FormField>

        {/* 7. Sex (Kasarian) */}
        <FormField
          id="sex"
          labelEn="Sex"
          labelFil="Kasarian"
          required
          error={errors.sex}
        >
          <select
            id="sex"
            value={data.sex || ''}
            onChange={(e) => handleChange('sex', e.target.value as SexType)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
          >
            <option value="">— Select Sex (Pumili ng Kasarian) —</option>
            <option value="Male">Male (Lalaki)</option>
            <option value="Female">Female (Babae)</option>
            <option value="Other">Other (Iba Pa)</option>
            <option value="Prefer not to say">Prefer not to say (Ayaw Sabihin)</option>
          </select>
        </FormField>

        {/* 8. Civil Status (Katayuang Sibil) */}
        <FormField
          id="civilStatus"
          labelEn="Civil Status"
          labelFil="Katayuang Sibil"
          required
          error={errors.civilStatus}
        >
          <select
            id="civilStatus"
            value={data.civilStatus || ''}
            onChange={(e) => handleChange('civilStatus', e.target.value as CivilStatusType)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
          >
            <option value="">— Select Civil Status (Pumili ng Katayuang Sibil) —</option>
            <option value="Single">Single (Walang Asawa / Binata / Dalaga)</option>
            <option value="Married">Married (May Asawa)</option>
            <option value="Widowed">Widowed (Balo)</option>
            <option value="Separated">Separated (Hiwalay)</option>
            <option value="Annulled">Annulled (Kanselado ang Kasal)</option>
            <option value="Other">Other (Iba Pa)</option>
          </select>
        </FormField>

        {/* 9. Occupation (Trabaho) - MUST appear immediately after Civil Status! */}
        <FormField
          id="occupation"
          labelEn="Occupation"
          labelFil="Trabaho"
          required
          error={errors.occupation}
        >
          <div className="relative">
            <input
              id="occupation"
              type="text"
              list="occupation-suggestions"
              value={data.occupation || ''}
              onChange={(e) => handleChange('occupation', e.target.value)}
              placeholder="e.g. Driver, Private Employee, Businessman"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
            />
            <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            <datalist id="occupation-suggestions">
              {COMMON_OCCUPATIONS.map((occ) => (
                <option key={occ} value={occ} />
              ))}
            </datalist>
          </div>
        </FormField>

        {/* 10. Nationality (Nasyonalidad) */}
        <FormField
          id="nationality"
          labelEn="Nationality"
          labelFil="Nasyonalidad"
          required
          error={errors.nationality}
        >
          <input
            id="nationality"
            type="text"
            value={data.nationality || ''}
            onChange={(e) => handleChange('nationality', e.target.value)}
            placeholder="e.g. Filipino"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
          />
        </FormField>

        {/* 11. Address (Tirahan) - Multiline */}
        <div className="md:col-span-2">
          <FormField
            id="address"
            labelEn="Address"
            labelFil="Tirahan"
            required
            helpText="House No., Street, Barangay, Municipality/City, Province"
            error={errors.address}
          >
            <div className="relative">
              <textarea
                id="address"
                rows={3}
                value={data.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="e.g. 124 Rizal St., Poblacion 1, Bauan, Batangas"
                autoComplete="street-address"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </FormField>
        </div>

        {/* 12. Contact Number (Numero ng Telepono) */}
        <div className="md:col-span-2">
          <FormField
            id="contactNumber"
            labelEn="Contact Number"
            labelFil="Numero ng Telepono"
            required
            helpText="Active mobile or landline number for official verification and police updates"
            error={errors.contactNumber}
          >
            <div className="relative">
              <input
                id="contactNumber"
                type="tel"
                value={data.contactNumber || ''}
                onChange={(e) => handleChange('contactNumber', e.target.value)}
                placeholder="e.g. 0917-123-4567 or (043) 727-1234"
                autoComplete="tel"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors shadow-xs"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </FormField>
        </div>
      </div>
    </div>
  );
};
