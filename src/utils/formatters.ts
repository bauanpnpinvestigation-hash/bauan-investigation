import { PersonalInformation } from '../types/reports';
import { formatHumanDate } from './dateUtils';

/**
 * Format personal information into plain text key-value lines without empty fields.
 */
export function formatPersonalInformationText(info: PersonalInformation): string {
  const lines: string[] = [];

  if (info.firstName?.trim()) lines.push(`First Name: ${info.firstName.trim()}`);
  if (info.middleName?.trim()) lines.push(`Middle Name: ${info.middleName.trim()}`);
  if (info.lastName?.trim()) lines.push(`Last Name: ${info.lastName.trim()}`);
  if (info.suffix?.trim()) lines.push(`Suffix: ${info.suffix.trim()}`);
  if (info.birthday?.trim()) lines.push(`Birthday: ${formatHumanDate(info.birthday)}`);
  if (info.age !== null && info.age !== undefined) lines.push(`Age: ${info.age}`);
  if (info.sex?.trim()) lines.push(`Sex: ${info.sex.trim()}`);
  if (info.civilStatus?.trim()) lines.push(`Civil Status: ${info.civilStatus.trim()}`);
  if (info.occupation?.trim()) lines.push(`Occupation: ${info.occupation.trim()}`);
  if (info.nationality?.trim()) lines.push(`Nationality: ${info.nationality.trim()}`);
  if (info.address?.trim()) lines.push(`Address: ${info.address.trim()}`);
  if (info.contactNumber?.trim()) lines.push(`Contact Number: ${info.contactNumber.trim()}`);

  return lines.join('\n');
}

/**
 * Generic section formatter: transforms key-value pairs into clean plain text,
 * omitting empty or undefined values.
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
        validLines.push(`${pair.label}: ${valStr}`);
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
