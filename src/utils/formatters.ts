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
