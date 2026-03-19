import { describe, it, expect } from '@jest/globals';
import { generateSlotIntervals, utcDayBoundsForSlot } from '../src/utils/dateSlots.js';

describe('dateSlots', () => {
  it('generates 30-min slots for 2h window', () => {
    const slots = generateSlotIntervals('2025-06-15', 'UTC', 14 * 60, 18 * 60, 30);
    expect(slots.length).toBe(8);
    expect(slots[0].startUtc).toBeInstanceOf(Date);
  });

  it('utcDayBoundsForSlot', () => {
    const d = new Date('2025-06-15T14:00:00.000Z');
    const { dayStart, dayEnd } = utcDayBoundsForSlot(d);
    expect(dayStart.toISOString().slice(0, 10)).toBe('2025-06-15');
    expect(dayEnd > dayStart).toBe(true);
  });
});
