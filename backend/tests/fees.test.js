import { describe, it, expect } from '@jest/globals';
import { platformFeeFromTotal, splitPayment } from '../src/utils/fees.js';

describe('fees', () => {
  it('splits 10% platform fee', () => {
    const { platformFee, creatorAmount, amountTotal } = splitPayment(10000, 1000);
    expect(amountTotal).toBe(10000);
    expect(platformFee).toBe(1000);
    expect(creatorAmount).toBe(9000);
  });

  it('platformFeeFromTotal', () => {
    expect(platformFeeFromTotal(9999, 1000)).toBe(999);
  });
});
