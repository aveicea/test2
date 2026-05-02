'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TimeBlockWidget from '@/components/TimeBlockWidget';
import MiniTimer from '@/components/MiniTimer';
import { getBrowserTimezone } from '@/lib/timeUtils';

interface Block {
  label: string;
  start: number;
  end: number;
  colorLight: string;
  colorFilled: string;
  textColor?: string;
  url?: string;
}

interface WidgetConfig {
  icalUrl?: string;
  apiKey?: string;
  calendarId?: string;
  timeRange?: { startHour: number; endHour: number };
  containerStyle?: { backgroundColor?: string };
  miniTimerColor?: string;
  timezone?: string;
  allowScroll?: boolean;
}

const safeStorage = {
  getItem: (key: string) => {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, val: string) => {
    try { window.localStorage.setItem(key, val); } catch {}
  },
};

function getDefaultTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul'; } catch { return 'Asia/Seoul'; }
}

function WidgetInner() {
  const searchParams = useSearchParams();
  const configParam = searchParams.get('config');

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [day, setDay] = useState('MON');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [containerStyle, setContainerStyle] = useState<{ backgroundColor?: string }>({ backgroundColor: '#F8F7FA' });
  const [timeRange, setTimeRange] = useState({ startHour: 6, endHour: 26 });
  const [miniTimerColor, setMiniTimerColor] = useState('#2B2B2B');
  const [timezone, setTimezone] = useState(getDefaultTimezone());
  const [allowScroll, setAllowScroll] = useState(false);

  const fetchData = async (config: WidgetConfig, tz: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/gcal/widget-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          icalUrl: config.icalUrl,
          apiKey: config.apiKey,
          calendarId: config.calendarId,
          timezone: tz,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '데이터를 불러오는데 실패했습니다.');
      setBlocks(json.blocks || []);
      setDay(json.day || 'MON');
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadFromStorage = () => {
    const saved = safeStorage.getItem('gcal-widget-config');
    if (!saved) return;
    try {
      const cfg: WidgetConfig = JSON.parse(saved);
      const tz = cfg.timezone || getDefaultTimezone();
      if (cfg.containerStyle) setContainerStyle(cfg.containerStyle);
      if (cfg.timeRange) setTimeRange(cfg.timeRange);
      if (cfg.miniTimerColor) setMiniTimerColor(cfg.miniTimerColor);
      setTimezone(tz);
      setAllowScroll(!!cfg.allowScroll);
      fetchData(cfg, tz);
    } catch {}
  };

  useEffect(() => {
    if (configParam) {
      try {
        const b64 = configParam.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(escape(atob(b64)));
        const cfg: WidgetConfig = JSON.parse(json);
        const tz = cfg.timezone || getDefaultTimezone();
        if (cfg.containerStyle) setContainerStyle(cfg.containerStyle);
        if (cfg.timeRange) setTimeRange(cfg.timeRange);
        if (cfg.miniTimerColor) setMiniTimerColor(cfg.miniTimerColor);
        setTimezone(tz);
        setAllowScroll(!!cfg.allowScroll);
        safeStorage.setItem('gcal-widget-config', JSON.stringify({ ...cfg, timezone: tz }));
        fetchData(cfg, tz);
      } catch {
        setError('잘못된 설정입니다.');
        setLoading(false);
      }
    } else {
      const saved = safeStorage.getItem('gcal-widget-config');
      if (saved) {
        loadFromStorage();
      } else {
        setLoading(false);
      }
    }
  }, [configParam]);

  if (loading) {
    return (
      <div className="widget-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#666', fontSize: '14px' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#FF6B9D', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="widget-container">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <MiniTimer blocks={blocks} width={88} timerColor={miniTimerColor} timezone={timezone} />
        <TimeBlockWidget
          day={day}
          blocks={blocks}
          onDayChange={() => loadFromStorage()}
          onRefresh={() => loadFromStorage()}
          startHour={timeRange.startHour}
          endHour={timeRange.endHour}
          containerStyle={containerStyle}
          timezone={timezone}
          allowScroll={allowScroll}
        />
      </div>
    </div>
  );
}

export default function WidgetClient() {
  return (
    <Suspense fallback={
      <div className="widget-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#666', fontSize: '14px' }}>
          로딩 중...
        </div>
      </div>
    }>
      <WidgetInner />
    </Suspense>
  );
}
