import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "피클볼 패들 추천",
  description: "몇 가지 질문에 답하면 스펙을 근거로 맞는 피클볼 패들을 추천합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
