export function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export function isE164Phone(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length >= 8 && digits.length <= 15 && /^\+/.test(value.trim());
}

export function normalizeInternational(value: string): string {
  const digits = digitsOnly(value);
  if (!digits) return '';
  return `+${digits}`;
}

export function formatPhoneDisplay(value: string): string {
  const digits = digitsOnly(value);
  if (!digits) return '';

  if (digits.length <= 10) {
    return digits.replace(/(\d{1,3})(?=(\d{3})+(?!\d))/g, '$1 ');
  }
  return digits.replace(/(\d{1,4})(?=(\d{3})+(?!\d))/g, '$1 ');
}

export function lastFour(value: string): string {
  const digits = digitsOnly(value);
  return digits.slice(-4);
}
