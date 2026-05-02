import { NextRequest, NextResponse } from 'next/server';

// Google Calendar color ID -> [colorLight, colorFilled]
const GCAL_COLORS: Record<string, [string, string]> = {
  '1':  ['#c5cae9', '#7986cb'], // Lavender
  '2':  ['#a8d5b5', '#33b679'], // Sage
  '3':  ['#ce93d8', '#8e24aa'], // Grape
  '4':  ['#ef9a9a', '#e67c73'], // Flamingo
  '5':  ['#fff59d', '#f6c026'], // Banana
  '6':  ['#ffab91', '#f5511d'], // Tangerine
  '7':  ['#b3e5fc', '#039be5'], // Peacock
  '8':  ['#9fa8da', '#3f51b5'], // Blueberry
  '9':  ['#a5d6a7', '#0b8043'], // Basil
  '10': ['#ef9a9a', '#d50000'], // Tomato
  '11': ['#f48fb1', '#e91e63'], // Flamingo (pink)
  default: ['#d7d7d7', '#9e9e9e'],
};

function toHourFloat(dateStr: string, timezone: string): number {
  const d = new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: timezone }));
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

function getDayOfWeek(timezone: string): string {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
}

function getTodayRange(timezone: string): { timeMin: string; timeMax: string } {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  if (now.getHours() < 4) now.setDate(now.getDate() - 1);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, calendarId, propertyMapping, timezone = 'Asia/Seoul' } = body;

    if (!apiKey || !calendarId) {
      return NextResponse.json({ error: 'apiKey와 calendarId가 필요합니다' }, { status: 400 });
    }

    const { timeMin, timeMax } = getTodayRange(timezone);
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
    const items: any[] = data.items || [];

    // colorField: propertyMapping에서 색상 필드명 지정 가능 (기본: colorId)
    const colorField: string = propertyMapping?.color || '';

    const blocks = items
      .filter(e => e.start?.dateTime) // 종일 이벤트 제외
      .map(e => {
        const start = toHourFloat(e.start.dateTime, timezone);
        const end = toHourFloat(e.end.dateTime, timezone);
        const colorId: string = e.colorId || 'default';
        const [colorLight, colorFilled] = GCAL_COLORS[colorId] ?? GCAL_COLORS.default;

        return {
          label: e.summary || '제목 없음',
          start,
          end,
          colorLight,
          colorFilled,
          textColor: '#666666',
          url: e.htmlLink || '',
        };
      });

    return NextResponse.json({ blocks, day: getDayOfWeek(timezone) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '서버 오류' }, { status: 500 });
  }
}
