const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthYear(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

type Period = { date: Date; label?: string };

// Returns the date used for sorting/positioning on the timeline.
export function effectiveDate(periods: Period[]): Date {
  return periods[periods.length - 1].date;
}

// Returns the compact date range shown on cards and timeline rows.
// "Since Jan 2023" if ongoing. "Jan 2023" if single period. "Jan 2023–May 2024" otherwise.
export function formatDateRange(periods: Period[], ongoing = false): string {
  const start = monthYear(periods[0].date);
  if (ongoing) return `Since ${start}`;
  if (periods.length === 1) return start;
  const end = monthYear(periods[periods.length - 1].date);
  return start === end ? start : `${start}–${end}`;
}