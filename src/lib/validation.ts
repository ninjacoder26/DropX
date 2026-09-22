/** Shared input validation (mirrors the database CHECK constraints). */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const LIMITS = {
  brandName: { min: 2, max: 120 },
  reason: { min: 10, max: 2000 },
  imageUrl: { min: 10, max: 2000 },
  note: { min: 1, max: 2000 },
} as const;
