export function isValidRwandaTin(value: string): boolean {
  return /^\d{9}$/.test(value);
}
