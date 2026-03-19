import { DateTime } from 'luxon';

/**
 * Generate slot start/end in UTC from a calendar date and minute window in sessionTz.
 */
export function generateSlotIntervals(sessionDate, sessionTz, windowStartMinute, windowEndMinute, slotDurationMinutes) {
  const day = DateTime.fromISO(String(sessionDate), { zone: sessionTz });
  if (!day.isValid) {
    throw new Error(`Invalid session date or timezone: ${sessionDate} / ${sessionTz}`);
  }
  const startOfDay = day.startOf('day');
  const slots = [];
  for (let m = windowStartMinute; m + slotDurationMinutes <= windowEndMinute; m += slotDurationMinutes) {
    const startLocal = startOfDay.plus({ minutes: m });
    const endLocal = startOfDay.plus({ minutes: m + slotDurationMinutes });
    slots.push({
      startUtc: startLocal.toUTC().toJSDate(),
      endUtc: endLocal.toUTC().toJSDate(),
    });
  }
  return slots;
}

export function utcDayBoundsForSlot(startUtc) {
  const d = DateTime.fromJSDate(new Date(startUtc), { zone: 'utc' }).startOf('day');
  return { dayStart: d.toJSDate(), dayEnd: d.endOf('day').toJSDate() };
}
