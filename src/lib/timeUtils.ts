export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul';
  } catch {
    return 'Asia/Seoul';
  }
}

export function getCurrentTimeInTimezone(timezone?: string): Date {
  const tz = timezone || getBrowserTimezone();
  return new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
}

export function getHourFromDate(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

export function getTotalHours(start: number, end: number): number {
  return end > 24 ? end - start : end <= start ? 24 - start + end : end - start;
}

export function getHourRange(start: number, end: number): number[] {
  const total = getTotalHours(start, end);
  return Array.from({ length: total }, (_, i) => (start + i) % 24);
}

export function getHourDifference(a: number, b: number): number {
  let diff = a - b;
  if (diff < 0) diff += 24;
  return diff;
}

export function isBlockOngoing(now: number, start: number, end: number): boolean {
  if (start <= end) return now >= start && now < end;
  return now >= start || now < end;
}

export function isBlockCompleted(now: number, end: number, start: number): boolean {
  if (end <= start) return now >= end && now < start;
  return now >= end;
}

export function formatHour(h: number): string {
  const hh = Math.floor(h % 24).toString().padStart(2, '0');
  const mm = Math.floor(h % 1 * 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}
