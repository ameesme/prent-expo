const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * The prototype's `todayStr()`: `toLocaleDateString('en-GB', {day:'2-digit', month:'short',
 * year:'numeric'})` → "11 Aug 2026". Written out by hand so the print metadata renders
 * identically regardless of device locale or Intl availability.
 */
export function todayStr(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  return `${day} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
