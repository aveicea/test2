'use client';

import { useEffect, useState } from 'react';
import { getBrowserTimezone, getCurrentTimeInTimezone, getHourFromDate, getHourDifference, isBlockOngoing } from '@/lib/timeUtils';

interface Block {
  label: string;
  start: number;
  end: number;
  colorLight: string;
  colorFilled: string;
  textColor?: string;
  url?: string;
}

interface Props {
  blocks: Block[];
  width: number;
  timerColor?: string;
  timezone?: string;
}

export default function MiniTimer({ blocks, width, timerColor = '#2B2B2B', timezone }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = timezone || getBrowserTimezone();
  const now = getHourFromDate(getCurrentTimeInTimezone(tz));
  const sorted = [...blocks].sort((a, b) => a.start - b.start);

  const ongoing = sorted.find(b => isBlockOngoing(now, b.start, b.end));
  const next = (() => {
    const n = sorted.find(b => b.start > now);
    return n ?? (sorted.length > 0 ? sorted[0] : null);
  })();

  const fmt = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0
      ? { hourPart: h.toString(), minutePart: m.toString().padStart(2, '0'), hasHours: true }
      : { hourPart: null, minutePart: m.toString(), hasHours: false };
  };

  const info = (() => {
    if (ongoing) {
      const { hourPart, minutePart, hasHours } = fmt(getHourDifference(ongoing.end, now) * 3600);
      return { label: 'NOW', hourPart, minutePart, hasHours, type: 'now' };
    }
    if (next) {
      const diff = next.start > now ? next.start - now : next.start + 24 - now;
      const { hourPart, minutePart, hasHours } = fmt(diff * 3600);
      return { label: 'FREE', hourPart, minutePart, hasHours, type: 'free' };
    }
    return { label: 'FREE', hourPart: null, minutePart: null, hasHours: false, type: 'free' };
  })();

  return (
    <div style={{ width: `${width}px`, height: '80px', backgroundColor: 'transparent', position: 'relative', fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif", letterSpacing: '-0.1px' }}>
      <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: info.type === 'now' ? '11px' : '10px', fontWeight: 700, color: timerColor, opacity: info.type === 'now' ? 0.7 : 0.5, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
          {info.label}
        </div>
        {(info.hourPart || info.minutePart) ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: timerColor, opacity: 0.5, lineHeight: 1, paddingBottom: '2px' }}>-</span>
            {info.hasHours && (
              <>
                <span style={{ fontSize: info.type === 'now' ? '26px' : '24px', fontWeight: 800, color: timerColor, letterSpacing: '-1px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{info.hourPart}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: timerColor, opacity: 0.6, letterSpacing: '0.3px', paddingBottom: '3px' }}>H</span>
              </>
            )}
            <span style={{ fontSize: info.type === 'now' ? '26px' : '24px', fontWeight: 800, color: timerColor, letterSpacing: '-1px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{info.minutePart}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: timerColor, opacity: 0.6, letterSpacing: '0.3px', paddingBottom: '3px' }}>M</span>
          </div>
        ) : (
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#CCCCCC', marginTop: '4px' }}>All clear</div>
        )}
      </div>
    </div>
  );
}
