const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthYear(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// "Since Jan 2023" if ongoing (endDate ignored — ongoing projects don't have one).
// "Jan 2023" if only start, or start == end month.
// "Jan 2023–May 2024" otherwise (en-dash, no spaces).
export function formatDateRange(start: Date, end?: Date, ongoing = false): string {
  const startLabel = monthYear(start);
  if (ongoing) return `Since ${startLabel}`;
  if (!end) return startLabel;
  const endLabel = monthYear(end);
  if (startLabel === endLabel) return startLabel;
  return `${startLabel}–${endLabel}`;
}