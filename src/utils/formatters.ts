import { PersonalInformation } from '../types/reports';
import { formatHumanDate } from './dateUtils';

/**
 * Capitalizes the first letter of each word in a string, preserving other casing.
 */
function capitalizeWords(str: string): string {
  if (!str) return str;
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format personal information into plain text key-value lines without empty fields.
 */
export function formatPersonalInformationText(info: PersonalInformation): string {
  const nameParts: string[] = [];
  if (info.firstName?.trim()) nameParts.push(capitalizeWords(info.firstName.trim()));
  if (info.middleName?.trim()) {
    const mid = info.middleName.trim();
    // Support abbreviation if middle name is provided
    const formattedMid = mid.length === 1 ? `${mid}.` : mid;
    nameParts.push(capitalizeWords(formattedMid));
  }
  if (info.lastName?.trim()) nameParts.push(capitalizeWords(info.lastName.trim()));
  if (info.suffix?.trim()) nameParts.push(capitalizeWords(info.suffix.trim()));

  const fullName = nameParts.join(' ');
  const details: string[] = [];

  if (fullName) details.push(fullName);
  
  if (info.age !== null && info.age !== undefined && String(info.age).trim() !== '') {
    details.push(`${info.age} Years Old`);
  }
  
  if (info.birthday?.trim()) {
    details.push(`(DOB: ${formatHumanDate(info.birthday)})`);
  }
  
  if (info.sex?.trim()) {
    details.push(capitalizeWords(info.sex.trim()));
  }
  
  if (info.civilStatus?.trim()) {
    details.push(capitalizeWords(info.civilStatus.trim()));
  }
  
  if (info.occupation?.trim()) {
    details.push(capitalizeWords(info.occupation.trim()));
  }
  
  if (info.address?.trim()) {
    details.push(capitalizeWords(info.address.trim()));
  }
  
  if (info.contactNumber?.trim()) {
    details.push(info.contactNumber.trim());
  }

  return details.filter(Boolean).join(', ');
}

/**
 * Formats Vehicular Accident + Driver Personal Information into the official PNP blotter paragraph:
 * Example:
 * "Mitsubihi Expander 2026, colored graphite gray metallic, bearing plate number DCH 2797 and driven by Saturday Kenneth Aguila Legaspi, 38 years old, (DOB: August 22, 1987) male, married, marketing consultant and resident of Brgy. Manghinao 1, Bauan, Batangas. 09922381037"
 */
export function formatVehicularAccidentText(
  info: PersonalInformation,
  reportData: Record<string, any> = {}
): string {
  // 1. Vehicle Make + Model + Year
  const rawMake = (reportData.vehicleMake || '').trim();
  const rawModel = (reportData.vehicleModel || '').trim();
  const rawYear = String(reportData.vehicleYear || '').trim();
  const rawMakeModel = (reportData.vehicleMakeModel || '').trim();
  const rawMakeModelYear = (reportData.vehicleMakeModelYear || '').trim();

  let baseVehicle =
    [rawMake, rawModel].filter(Boolean).join(' ').trim() ||
    rawMakeModel ||
    rawMakeModelYear;
  if (rawYear && baseVehicle && !baseVehicle.endsWith(rawYear)) {
    baseVehicle = `${baseVehicle} ${rawYear}`;
  } else if (rawYear && !baseVehicle) {
    baseVehicle = rawYear;
  }

  // 2. Vehicle Color ("colored ...")
  const rawColor = String(reportData.vehicleColor || '')
    .trim()
    .replace(/^colored\s+/i, '');
  const colorClause = rawColor ? `colored ${rawColor.toLowerCase()}` : '';

  // 3. Plate Number ("bearing plate number ...")
  const rawPlate = String(reportData.plateNumber || '')
    .trim()
    .replace(/^bearing\s+plate\s+number\s+/i, '');
  const plateClause = rawPlate ? `bearing plate number ${rawPlate.toUpperCase()}` : '';

  const vehicleSegment = [baseVehicle, colorClause, plateClause].filter(Boolean).join(', ');

  // 4. Driver Full Name ("and driven by ...")
  const nameParts: string[] = [];
  if (info?.firstName?.trim()) nameParts.push(capitalizeWords(info.firstName.trim()));
  if (info?.middleName?.trim()) {
    const mid = info.middleName.trim();
    const formattedMid = mid.length === 1 ? `${mid}.` : mid;
    nameParts.push(capitalizeWords(formattedMid));
  }
  if (info?.lastName?.trim()) nameParts.push(capitalizeWords(info.lastName.trim()));
  if (info?.suffix?.trim() && info.suffix.trim().toLowerCase() !== 'none') {
    nameParts.push(capitalizeWords(info.suffix.trim()));
  }
  const fullName = nameParts.join(' ');

  // 5. Driver Age, DOB + Sex, Civil Status, Occupation + Resident Address
  const driverDetails: string[] = [];
  if (fullName) {
    driverDetails.push(fullName);
  }

  if (info?.age !== null && info?.age !== undefined && String(info.age).trim() !== '') {
    driverDetails.push(`${info.age} years old`);
  }

  const dobStr = info?.birthday?.trim() ? `(DOB: ${formatHumanDate(info.birthday)})` : '';
  const sexStr = info?.sex?.trim() ? info.sex.trim().toLowerCase() : '';
  if (dobStr && sexStr) {
    driverDetails.push(`${dobStr} ${sexStr}`);
  } else if (dobStr) {
    driverDetails.push(dobStr);
  } else if (sexStr) {
    driverDetails.push(sexStr);
  }

  if (info?.civilStatus?.trim()) {
    driverDetails.push(info.civilStatus.trim().toLowerCase());
  }

  const occStr = info?.occupation?.trim() ? info.occupation.trim().toLowerCase() : '';
  const addrStr = info?.address?.trim() ? info.address.trim().replace(/\.+$/, '') : '';

  if (occStr && addrStr) {
    driverDetails.push(`${occStr} and resident of ${addrStr}`);
  } else if (occStr) {
    driverDetails.push(occStr);
  } else if (addrStr) {
    driverDetails.push(`resident of ${addrStr}`);
  }

  const driverClause = driverDetails.join(', ');

  let combined = '';
  if (vehicleSegment && driverClause) {
    combined = `${vehicleSegment} and driven by ${driverClause}.`;
  } else if (vehicleSegment) {
    combined = `${vehicleSegment}.`;
  } else if (driverClause) {
    combined = `Driven by ${driverClause}.`;
  }

  const contactStr = info?.contactNumber?.trim() || '';
  if (contactStr) {
    combined = combined ? `${combined} ${contactStr}` : contactStr;
  }

  return combined.trim();
}

/**
 * Generic section formatter: transforms key-value pairs into clean plain text,
 * omitting empty or undefined values, and omitting labels as requested.
 */
export function formatSectionText(
  sectionTitle: string,
  fieldPairs: { label: string; value: any }[]
): string {
  const validLines: string[] = [];

  for (const pair of fieldPairs) {
    if (pair.value !== null && pair.value !== undefined) {
      const valStr = String(pair.value).trim();
      if (valStr.length > 0 && valStr !== 'N/A' && valStr !== 'undefined' && valStr !== 'null') {
        validLines.push(`${valStr}`);
      }
    }
  }

  if (validLines.length === 0) return '';
  return `${sectionTitle.toUpperCase()}\n\n${validLines.join('\n')}`;
}

/**
 * Robust clipboard copy function supporting Modern Clipboard API with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Modern navigator.clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback for older browsers or restricted iframe environments
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
