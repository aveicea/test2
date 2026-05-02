import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "타임블록 구글캘린더 위젯",
  description: "구글 캘린더를 미니멀 타임블록 위젯으로 변환하세요",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
