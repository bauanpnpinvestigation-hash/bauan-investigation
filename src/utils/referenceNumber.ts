/**
 * Generates a standard formatted reference number: REQ-YYYY-XXXXXX
 * (e.g. REQ-2026-000142)
 */
export function generateReferenceNumber(counter?: number): string {
  const year = new Date().getFullYear();
  if (typeof counter === 'number') {
    const padded = String(counter).padStart(6, '0');
    return `REQ-${year}-${padded}`;
  }
  // Generate random 6-digit number if counter not provided
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `REQ-${year}-${randomNum}`;
}
