export function getTodayKey(): string {
  const now = new Date();
  return `day:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getDateYYYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function getTimestamp(): number {
  return Date.now();
}

export function getExpirySeconds(ttl: number): number {
  return Math.floor(ttl / 1000);
}

