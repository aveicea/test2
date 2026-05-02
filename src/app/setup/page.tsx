'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [icalUrl, setIcalUrl] = useState('');
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(26);
  const [bgColor, setBgColor] = useState('rgba(252,252,252,1)');
  const [timerColor, setTimerColor] = useState('#737373');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [allowScroll, setAllowScroll] = useState(false);
  const [result, setResult] = useState('');

  const generate = () => {
    if (!icalUrl.trim()) { alert('iCal URL을 입력하세요'); return; }
    const config = {
      icalUrl: icalUrl.trim(),
      timeRange: { startHour: Number(startHour), endHour: Number(endHour) },
      containerStyle: { backgroundColor: bgColor },
      miniTimerColor: timerColor,
      timezone,
      allowScroll,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
    const origin = window.location.origin;
    setResult(`${origin}/widget?config=${encoded}`);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>타임블록 위젯 설정</h2>

      <div style={fieldStyle}>
        <label style={labelStyle}>구글 캘린더 iCal URL *</label>
        <textarea
          value={icalUrl}
          onChange={e => setIcalUrl(e.target.value)}
          placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
          rows={3}
          style={inputStyle}
        />
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
