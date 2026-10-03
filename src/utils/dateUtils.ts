/**
 * Accurately calculate age from birthday (YYYY-MM-DD).
 * Checks month and day against the reference date, ensuring age only increments
 * after the exact birth date has occurred in the current year.
 */
export function calculateAge(birthdayStr: string, referenceDate: Date = new Date()): number | null {
  if (!birthdayStr) return null;
  const birthDate = new Date(birthdayStr);
  if (isNaN(birthDate.getTime())) return null;

  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();

  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  let age = currentYear - birthYear;

  // If birth month is after current month, or if it's the same month but birth day is after current day,
  // the birthday has not yet occurred this year.
  if (
    currentMonth < birthMonth ||
    (currentMonth === birthMonth && currentDay < birthDay)
  ) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Format ISO date string or YYYY-MM-DD into readable English format: "January 5, 1995"
 */
export function formatHumanDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format ISO or datetime string into readable Date & Time format: "October 3, 2026, 10:30 AM"
 */
export function formatHumanDateTime(dateTimeStr?: string | null): string {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
