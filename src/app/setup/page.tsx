'use client';

import { useState } from 'react';

const PRESET_COLORS = ['#4285F4', '#0B8043', '#8E24AA', '#E67C73', '#F6BF26', '#F4511E', '#039BE5', '#3F51B5', '#33B679', '#D50000'];

export default function SetupPage() {
  const [calendars, setCalendars] = useState([{ url: '', color: '#4285F4' }]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(26);
  const [bgColor, setBgColor] = useState('rgba(252,252,252,1)');
  const [timerColor, setTimerColor] = useState('#737373');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [allowScroll, setAllowScroll] = useState(false);
  const [result, setResult] = useState('');

  const updateCalendar = (i: number, field: 'url' | 'color', val: string) => {
    const next = [...calendars];
    next[i] = { ...next[i], [field]: val };
    setCalendars(next);
  };

  const generate = () => {
    const filtered = calendars.filter(c => c.url.trim());
    if (filtered.length === 0) { alert('iCal URL을 하나 이상 입력하세요'); return; }
    const config = {
      icalUrls: filtered.map(c => c.url.trim()),
      calendarColors: filtered.map(c => c.color),
      timeRange: { startHour: Number(startHour), endHour: Number(endHour) },
      containerStyle: { backgroundColor: bgColor },
      miniTimerColor: timerColor,
      timezone,
      allowScroll,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
    setResult(`${window.location.origin}/widget?config=${encoded}`);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>타임블록 위젯 설정</h2>

      <div style={fieldStyle}>
        <label style={labelStyle}>구글 캘린더 iCal URL * (여러 개 추가 가능)</label>
        {calendars.map((cal, i) => (
          <div key={i} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={cal.url}
                onChange={e => updateCalendar(i, 'url', e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              {calendars.length > 1 && (
                <button
                  onClick={() => setCalendars(calendars.filter((_, j) => j !== i))}
                  style={{ flexShrink: 0, padding: '6px 10px', background: 'none', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#999' }}
                >✕</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#999' }}>색상:</span>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => updateCalendar(i, 'color', c)}
                  style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: c, border: cal.color === c ? '2px solid #333' : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                />
              ))}
              <input
                type="color"
                value={cal.color}
                onChange={e => updateCalendar(i, 'color', e.target.value)}
                style={{ width: '28px', height: '28px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', padding: '1px' }}
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => setCalendars([...calendars, { url: '', color: PRESET_COLORS[calendars.length % PRESET_COLORS.length] }])}
          style={{ padding: '6px 12px', background: 'none', border: '1px dashed #bbb', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#666', marginTop: '2px' }}
        >+ 캘린더 추가</button>
        <div style={helpStyle}>구글 캘린더 → 설정 → 캘린더 설정 → "비공개 주소(iCal)" 복사</div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ ...fieldStyle, flex: 1 }}>
          <label style={labelStyle}>시작 시간</label>
          <input type="number" value={startHour} onChange={e => setStartHour(+e.target.value)} min={0} max={23} style={inputStyle} />
        </div>
        <div style={{ ...fieldStyle, flex: 1 }}>
          <label style={labelStyle}>종료 시간 (26 = 다음날 2시)</label>
          <input type="number" value={endHour} onChange={e => setEndHour(+e.target.value)} min={1} max={30} style={inputStyle} />
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>배경색</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="color" value={bgColor.startsWith('rgba') ? '#fcfcfc' : bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: '40px', height: '32px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }} />
          <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>타이머 색상</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="color" value={timerColor} onChange={e => setTimerColor(e.target.value)} style={{ width: '40px', height: '32px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }} />
          <input type="text" value={timerColor} onChange={e => setTimerColor(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>타임존</label>
        <select value={timezone} onChange={e => setTimezone(e.target.value)} style={inputStyle}>
          <option value="Asia/Seoul">Asia/Seoul (한국)</option>
          <option value="America/New_York">America/New_York</option>
          <option value="America/Los_Angeles">America/Los_Angeles</option>
          <option value="Europe/London">Europe/London</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="checkbox" id="scroll" checked={allowScroll} onChange={e => setAllowScroll(e.target.checked)} />
        <label htmlFor="scroll" style={{ fontSize: '13px', color: '#333', cursor: 'pointer' }}>스크롤 허용</label>
      </div>

      <button
        onClick={generate}
        style={{ width: '100%', padding: '12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
      >
        위젯 URL 생성
      </button>

      {result && (
        <div style={{ marginTop: '24px' }}>
          <label style={labelStyle}>위젯 URL (노션에 붙여넣기)</label>
          <textarea
            readOnly
            value={result}
            rows={4}
            style={{ ...inputStyle, backgroundColor: '#f8f8f8', cursor: 'text' }}
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
          <button
            onClick={() => navigator.clipboard.writeText(result)}
            style={{ marginTop: '8px', padding: '8px 16px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            복사
          </button>
        </div>
      )}
    </div>
  );
}

const fieldStyle: React.CSSProperties = { marginBottom: '16px' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' };
const helpStyle: React.CSSProperties = { fontSize: '11px', color: '#999', marginTop: '4px', lineHeight: 1.5 };
