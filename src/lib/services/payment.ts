/**
 * Payment Service
 * Handles Venmo deep links and payment simulation for MVP.
 * Can be extended with Stripe Connect, PayPal, etc.
 */

export function generateVenmoLink(params: {
  venmoUsername: string;
  amountDollars: number;
  note: string;
}): string {
  const { venmoUsername, amountDollars, note } = params;
  // Venmo deep link format
  return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(venmoUsername)}&amount=${amountDollars.toFixed(2)}&note=${encodeURIComponent(note)}`;
}

export function generateVenmoWebLink(params: {
  venmoUsername: string;
  amountDollars: number;
  note: string;
}): string {
  const { venmoUsername, amountDollars, note } = params;
  return `https://venmo.com/${encodeURIComponent(venmoUsername)}?txn=pay&amount=${amountDollars.toFixed(2)}&note=${encodeURIComponent(note)}`;
}

export function calculatePlatformFee(amountCents: number): number {
  return Math.round(amountCents * 0.03); // 3% platform fee
}

export function calculateNetToOwner(amountCents: number): number {
  return amountCents - calculatePlatformFee(amountCents);
}
