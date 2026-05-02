// iCal 프록시 서버 - 공용 CORS 프록시 대체용
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'url이 필요합니다' });
    return;
  }

  // URL 유효성 검사
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    res.status(400).json({ error: '유효하지 않은 URL입니다' });
    return;
  }

  // iCal 관련 도메인만 허용 (보안)
  const allowedHosts = [
    'calendar.google.com',
    'outlook.office365.com',
    'outlook.live.com',
    'calendar.yahoo.com',
    'caldav.icloud.com',
    'ical.naver.com',
    'calendar.naver.com',
  ];

  const isAllowed = allowedHosts.some(host => parsedUrl.hostname.endsWith(host))
    || parsedUrl.pathname.endsWith('.ics')
    || parsedUrl.pathname.includes('ical');

  if (!isAllowed) {
    res.status(403).json({ error: '허용되지 않은 도메인입니다. iCal URL(.ics)만 지원됩니다.' });
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CalendarProxy/1.0',
        'Accept': 'text/calendar,text/plain,*/*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      res.status(response.status).json({
        error: `원본 서버 오류: ${response.status} ${response.statusText}`,
      });
      return;
    }

    const data = await response.text();

    // iCal 데이터 검증
    if (!data.includes('BEGIN:VCALENDAR') && !data.includes('BEGIN:VEVENT')) {
      res.status(422).json({ error: '유효하지 않은 iCal 데이터입니다' });
      return;
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.status(200).send(data);

  } catch (error) {
    if (error.name === 'AbortError') {
      res.status(504).json({ error: '원본 서버 응답 시간 초과' });
      return;
    }
    res.status(500).json({
      error: '서버 오류',
      message: error.message,
    });
  }
}
