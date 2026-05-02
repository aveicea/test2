import { Suspense } from 'react';
import WidgetClient from './WidgetClient';

export const metadata = {
  title: '타임블록 구글캘린더 위젯',
  description: '구글 캘린더를 미니멀 타임블록 위젯으로 변환하세요',
};

export default function WidgetPage() {
  return (
    <Suspense fallback={
      <div className="widget-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#666', fontSize: '14px' }}>
          로딩 중...
        </div>
      </div>
    }>
      <WidgetClient />
    </Suspense>
  );
}
