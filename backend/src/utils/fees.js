import { config } from '../config/index.js';

/** amountMinor * bps / 10000 */
export function platformFeeFromTotal(amountMinor, bps = config.platformFeeBps) {
  const a = BigInt(Math.floor(Number(amountMinor)));
  const fee = (a * BigInt(bps)) / 10000n;
  return Number(fee);
}

export function splitPayment(amountMinor, bps = config.platformFeeBps) {
  const total = BigInt(Math.floor(Number(amountMinor)));
  const fee = BigInt(platformFeeFromTotal(amountMinor, bps));
  const creator = total - fee;
  return {
    platformFee: Number(fee),
    creatorAmount: Number(creator),
    amountTotal: Number(total),
  };
}
