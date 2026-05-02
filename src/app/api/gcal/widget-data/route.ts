import { NextRequest, NextResponse } from 'next/server';

// Google Calendar color ID -> [colorLight, colorFilled]
const GCAL_COLORS: Record<string, [string, string]> = {
  '1':  ['#c5cae9', '#7986cb'],
  '2':  ['#a8d5b5', '#33b679'],
  '3':  ['#ce93d8', '#8e24aa'],
  '4':  ['#ef9a9a', '#e67c73'],
  '5':  ['#fff59d', '#f6c026'],
  '6':  ['#ffab91', '#f5511d'],
  '7':  ['#b3e5fc', '#039be5'],
  '8':  ['#9fa8da', '#3f51b5'],
  '9':  ['#a5d6a7', '#0b8043'],
  '10': ['#ef9a9a', '#d50000'],
  '11': ['#f48fb1', '#e91e63'],
  default: ['#d7d7d7', '#9e9e9e'],
};

function getDayOfWeek(timezone: string): string {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
}

function getTodayString(timezone: string): string {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toHourFloat(dateStr: string, timezone: string): number {
  const d = new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: timezone }));
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

// ── iCal parser ──────────────────────────────────────────────

function decodeIcal(text: string): string {
  return text.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function parseIcalDate(value: string, timezone: string): { date: string; time: string | null } | null {
  // YYYYMMDD (all-day)
  if (/^\d{8}$/.test(value)) {
    const y = value.slice(0, 4), m = value.slice(4, 6), d = value.slice(6, 8);
    return { date: `${y}-${m}-${d}`, time: null };
  }
  // YYYYMMDDTHHMMSS[Z]
  if (/^\d{8}T\d{6}Z?$/.test(value)) {
    const y = +value.slice(0, 4), mo = +value.slice(4, 6) - 1,
          d = +value.slice(6, 8), h = +value.slice(9, 11), mi = +value.slice(11, 13);
    const dt = value.endsWith('Z')
      ? new Date(Date.UTC(y, mo, d, h, mi))
      : new Date(y, mo, d, h, mi);
    const local = new Date(dt.toLocaleString('en-US', { timeZone: timezone }));
    const date = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
    const time = `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`;
    return { date, time };
  }
  return null;
}

interface IcalEvent {
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
  colorHex?: string;
}

function parseIcal(text: string, timezone: string, todayStr: string): IcalEvent[] {
  const lines = text.replace(/\r\n /g, '').replace(/\r\n\t/g, '').split(/\r?\n/);
  const events: IcalEvent[] = [];
  let cur: Record<string, string> = {};
  let inEvent = false;
  let calendarColor: string | undefined;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; cur = {}; continue; }
    if (line === 'END:VEVENT') {
      inEvent = false;
      if (cur.SUMMARY && cur.DTSTART && cur.DTEND) {
        const start = parseIcalDate(cur.DTSTART, timezone);
        const end = parseIcalDate(cur.DTEND, timezone);
        if (start && end && start.date === todayStr && start.time && end.time) {
          events.push({
            summary: decodeIcal(cur.SUMMARY),
            date: start.date,
            startTime: start.time,
            endTime: end.time,
            colorHex: calendarColor,
          });
        }
      }
      continue;
    }
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const rawKey = line.slice(0, colon);
    const key = rawKey.split(';')[0];
    const val = line.slice(colon + 1);

    if (!inEvent) {
      // VCALENDAR 레벨에서 캘린더 전체 색상 읽기
      if (key === 'X-APPLE-CALENDAR-COLOR') calendarColor = val.trim();
      continue;
    }
    if (rawKey.startsWith('DTSTART')) cur['DTSTART'] = val;
    else if (rawKey.startsWith('DTEND')) cur['DTEND'] = val;
    else cur[key] = val;
  }
  return events;
}

function timeToHour(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

// ── handler ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { icalUrls, icalUrl, apiKey, calendarId, timezone = 'Asia/Seoul' } = body;
    const urls: string[] = icalUrls ?? (icalUrl ? [icalUrl] : []);

    const today = getTodayString(timezone);
    const day = getDayOfWeek(timezone);

    // ── iCal 방식 ──
    if (urls.length > 0) {
      const results = await Promise.all(urls.map(async (url) => {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'CalendarWidget/1.0', Accept: 'text/calendar' },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error(`iCal fetch 실패: ${res.status}`);
        const text = await res.text();
        if (!text.includes('BEGIN:VCALENDAR')) throw new Error('유효하지 않은 iCal 데이터');
        return parseIcal(text, timezone, today);
      }));

      const allEvents = results.flat();
      allEvents.sort((a, b) => timeToHour(a.startTime) - timeToHour(b.startTime));

      const blocks = allEvents.map(e => {
        const [colorLight, colorFilled] = GCAL_COLORS.default;
        return {
          label: e.summary,
          start: timeToHour(e.startTime),
          end: timeToHour(e.endTime),
          colorLight: e.colorHex ? e.colorHex + '55' : colorLight,
          colorFilled: e.colorHex || colorFilled,
          textColor: '#666666',
        };
      });
      return NextResponse.json({ blocks, day });
    }

    // ── Google Calendar API 방식 (공개 캘린더용) ──
    if (apiKey && calendarId) {
      const timeMin = new Date(`${today}T00:00:00`).toISOString();
      const timeMax = new Date(`${today}T23:59:59`).toISOString();
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('timeMin', timeMin);
      url.searchParams.set('timeMax', timeMax);
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('maxResults', '100');

      const res = await fetch(url.toString());
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json({ error: err.error?.message || 'Google Calendar API 오류' }, { status: res.status });
      }
      const data = await res.json();
      const blocks = (data.items || [])
        .filter((e: any) => e.start?.dateTime)
        .map((e: any) => {
          const [colorLight, colorFilled] = GCAL_COLORS[e.colorId] ?? GCAL_COLORS.default;
          return {
            label: e.summary || '제목 없음',
            start: toHourFloat(e.start.dateTime, timezone),
            end: toHourFloat(e.end.dateTime, timezone),
            colorLight, colorFilled,
            textColor: '#666666',
            url: e.htmlLink || '',
          };
        });
      return NextResponse.json({ blocks, day });
    }

    return NextResponse.json({ error: 'icalUrl 또는 apiKey+calendarId가 필요합니다' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
  }
}
