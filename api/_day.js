// Shared day-key helpers for the photo API.
// Trip calendar: m=5 → June 2026, m=6 → July 2026. Keys look like "5-19".

export function isValidDay(key) {
  if (typeof key !== 'string') return false;
  const m = key.match(/^([56])-(\d{1,2})$/);
  if (!m) return false;
  const month = +m[1], day = +m[2];
  if (month === 5) return day >= 1 && day <= 30;   // June
  return day >= 1 && day <= 31;                     // July
}

// A trip day-key → a UTC Date at midnight.
export function dayToDate(key) {
  const [m, d] = key.split('-').map(Number);
  // m=5 → JS month index 5 (June); m=6 → index 6 (July)
  return new Date(Date.UTC(2026, m, d));
}

// True only for days strictly before today (UTC). Upload is past-days only.
export function isPastDay(key) {
  const day = dayToDate(key);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return day.getTime() < today.getTime();
}
