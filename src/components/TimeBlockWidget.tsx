'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getBrowserTimezone, getCurrentTimeInTimezone, getHourFromDate,
  getHourDifference, getHourRange, getTotalHours,
  isBlockCompleted, isBlockOngoing,
} from '@/lib/timeUtils';

interface Block {
  label: string;
  start: number;
  end: number;
  colorLight: string;
  colorFilled: string;
  textColor?: string;
  url?: string;
}

interface ContainerStyle {
  backgroundColor?: string;
}

interface Props {
  day?: string;
  blocks: Block[];
  onDayChange?: () => void;
  onRefresh?: () => void;
  startHour?: number;
  endHour?: number;
  containerStyle?: ContainerStyle;
  timezone?: string;
  allowScroll?: boolean;
}

function getDayInfo(timezone = 'Asia/Seoul') {
  const t = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  if (t.getHours() < 4) t.setDate(t.getDate() - 1);
  const n = t.getDay();
  return {
    korean: ['일', '월', '화', '수', '목', '금', '토'][n],
    english: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][n],
    date: t,
  };
}

export default function TimeBlockWidget({
  day, blocks, onDayChange, onRefresh,
  startHour = 6, endHour = 26,
  containerStyle, timezone, allowScroll = false,
}: Props) {
  const tz = timezone || getBrowserTimezone();
  const [now, setNow] = useState(() => getHourFromDate(getCurrentTimeInTimezone(tz)));
  const [currentTime, setCurrentTime] = useState(() => new Date(new Date().toLocaleString('en-US', { timeZone: tz })));
  const [tooltip, setTooltip] = useState<Block | null>(null);
  const [dayInfo, setDayInfo] = useState(() => getDayInfo(tz));

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTime(new Date(new Date().toLocaleString('en-US', { timeZone: tz })));
      const h = getHourFromDate(getCurrentTimeInTimezone(tz));
      setNow(h);
      const info = getDayInfo(tz);
      if (info.english !== dayInfo.english) {
        setDayInfo(info);
        onDayChange?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [tz, dayInfo.english, onDayChange]);

  const totalHours = getTotalHours(startHour, endHour);
  const hourRange = getHourRange(startHour, endHour);
  const timelineHeight = 40 * totalHours;

  const visibleBlocks = useMemo(() => blocks.filter(b => {
    if (!b.colorLight || !b.colorFilled || !b.label) return false;
    if (typeof b.start !== 'number' || typeof b.end !== 'number') return false;
    let s = b.start, e = b.end;
    if (e < s) e += 24;
    if (endHour > 24 && s < startHour) { s += 24; e += 24; }
    if (e <= s) return false;
    return e > startHour && s < endHour;
  }), [blocks, startHour, endHour]);

  const nowLineOffset = (() => {
    let h = now - startHour;
    if (h < 0) h += 24;
    return h >= 0 && h < totalHours ? h : null;
  })();

  const fmtClock = (d: Date) => {
    let h = d.getHours() % 12 || 12;
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const widgetId = useMemo(() => `tw-${Math.random().toString(36).slice(2, 9)}`, []);

  return (
    <div
      id={widgetId}
      style={{
        width: allowScroll ? '94px' : '88px',
        minWidth: allowScroll ? '94px' : '88px',
        maxWidth: allowScroll ? '94px' : '88px',
        flexShrink: 0,
        backgroundColor: containerStyle?.backgroundColor || '#FFFFFF',
        borderRadius: '20px',
        padding: '18px 8px 40px 8px',
        boxShadow: 'none',
        fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        position: 'relative',
      }}
    >
      {/* Day label */}
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#666666', marginBottom: '16px', textAlign: 'center', letterSpacing: '0.5px' }}>
        {day || dayInfo.english}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', marginBottom: '28px', overflowY: 'visible', overflowX: 'hidden', paddingRight: 0 }}>
        <div style={{ position: 'relative', height: `${timelineHeight}px` }}>
          {/* Hour labels */}
          {hourRange.map((h, i) => (
            <div key={`h-${h}-${i}`} style={{ position: 'absolute', top: `${40 * i + 2}px`, left: '2px', fontSize: '8px', color: '#AAAAAA', fontWeight: 400, pointerEvents: 'none', zIndex: 1 }}>
              {h === 0 ? '12' : h > 12 ? h - 12 : h}
            </div>
          ))}

          {/* Blocks */}
          {visibleBlocks.map((b, i) => {
            let s = b.start, e = b.end;
            let topOffset = s - startHour;
            if (topOffset < 0) topOffset += 24;
            const duration = getHourDifference(e, s);
            let clipped = duration;
            if (s < startHour && !(endHour > 24 && s < startHour)) {
              clipped = duration - (startHour - s);
            }
            const top = 40 * topOffset + 2;
            let height = 40 * clipped - 4;
            if (top >= timelineHeight) return null;
            if (top + height > timelineHeight) height = timelineHeight - top - 2;
            if (height <= 0) return null;

            const ongoing = isBlockOngoing(now, b.start, b.end);
            let fillPct = 0;
            if (ongoing) {
              const dur = getHourDifference(b.end, b.start);
              const elapsed = b.end < b.start
                ? (now >= b.start ? now - b.start : now + 24 - b.start)
                : now - b.start;
              fillPct = Math.min((elapsed / dur) * 100, 100);
            } else {
              fillPct = isBlockCompleted(now, b.end, b.start) ? 100 : 0;
            }

            const tol = 5 / 60;
            const diff = now - b.end;
            const ending = Math.abs(diff) <= tol && (isBlockOngoing(now, b.start, b.end) || diff >= 0 && diff <= tol);

            return (
              <div
                key={i}
                onClick={() => {
                  if (b.url) {
                    try {
                      const u = new URL(b.url);
                      if (u.protocol === 'http:' || u.protocol === 'https:') window.open(b.url, '_blank', 'noopener,noreferrer');
                    } catch {}
                  }
                }}
                onMouseEnter={e2 => { setTooltip(b); if (b.url) (e2.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                onMouseLeave={e2 => { setTooltip(null); (e2.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                className={ending ? 'block-ending' : ''}
                style={{
                  position: 'absolute', top: `${top}px`, left: 0, right: 0,
                  height: `${height}px`, borderRadius: '10px',
                  backgroundColor: b.colorLight, overflow: 'hidden',
                  cursor: b.url ? 'pointer' : 'default', zIndex: 2,
                  transition: 'transform 0.15s ease-out',
                }}
              >
                {/* Fill */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${fillPct}%`, backgroundColor: b.colorFilled, transition: 'height 0.3s ease', zIndex: 1 }} />
                {/* Label */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', zIndex: 3, pointerEvents: 'none' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: b.textColor || '#666666', letterSpacing: '-0.2px', textAlign: 'center', wordBreak: 'keep-all', lineHeight: 1.3 }}>
                    {b.label}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tooltip */}
          {tooltip && (() => {
            let topOffset = tooltip.start - startHour;
            if (topOffset < 0) topOffset += 24;
            const dur = getHourDifference(tooltip.end, tooltip.start);
            const top = 40 * topOffset + 2 + (40 * dur - 4) / 2;
            return (
              <div style={{ position: 'absolute', top: `${top}px`, left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: tooltip.colorFilled, color: '#4A4A4A', fontSize: '9px', fontWeight: 600, padding: '6px 10px', borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 30, boxShadow: '0 2px 12px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
                {`${Math.floor(tooltip.start)}:${Math.round(tooltip.start % 1 * 60).toString().padStart(2, '0')} - ${Math.floor(tooltip.end)}:${Math.round(tooltip.end % 1 * 60).toString().padStart(2, '0')}`}
              </div>
            );
          })()}

          {/* Current time line */}
          {nowLineOffset !== null && (
            <div style={{ position: 'absolute', top: `${40 * nowLineOffset}px`, left: 0, right: 0, height: '2px', backgroundColor: '#FF6B9D', zIndex: 5 }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF6B9D', position: 'absolute', left: '-3px', top: '-2px' }} />
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF6B9D', position: 'absolute', right: '-3px', top: '-2px' }} />
              <div style={{ position: 'absolute', top: '6px', right: '2px', fontSize: '10px', fontWeight: 600, color: '#FF6B9D', whiteSpace: 'nowrap', lineHeight: 1 }}>
                {fmtClock(currentTime)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refresh button */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          style={{ position: 'absolute', bottom: '36px', right: '8px', width: '16px', height: '16px', border: 'none', backgroundColor: 'transparent', color: '#CCCCCC', fontSize: '12px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, outline: 'none', zIndex: 5 }}
        >
          ⟳
        </button>
      )}

      </div>
    </div>
  );
}
