/**
 * Convert minutes-from-midnight (0–1439) to 12-hour parts.
 * @param {number} minutes
 * @returns {{ hour: number, minute: number, pm: boolean }} hour 1–12, minute 0–59
 */
export function minutesTo12hParts(minutes) {
  const m = Math.max(0, Math.min(1439, Math.round(Number(minutes))));
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const pm = h24 >= 12;
  const hour = h24 === 0 ? 12 : h24 === 12 ? 12 : h24 % 12;
  return { hour, minute: min, pm };
}

/**
 * Convert 12-hour parts to minutes-from-midnight.
 * @param {{ hour: number, minute: number, pm: boolean }} hour 1–12, minute 0–59
 * @returns {number} 0–1439
 */
export function parts12hToMinutes({ hour, minute, pm }) {
  const h = Number(hour);
  const min = Math.max(0, Math.min(59, Math.round(Number(minute))));
  let h24 = h;
  if (pm && h !== 12) h24 = h + 12;
  if (!pm && h === 12) h24 = 0;
  return h24 * 60 + min;
}

/**
 * Format minutes-from-midnight as "2:00 PM" style string.
 */
export function format12h(minutes) {
  const { hour, minute, pm } = minutesTo12hParts(minutes);
  const mm = String(minute).padStart(2, '0');
  return `${hour}:${mm} ${pm ? 'PM' : 'AM'}`;
}
