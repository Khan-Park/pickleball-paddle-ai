import type { Metadata, Viewport } from "next";
import { OG_IMAGE, openGraphFor, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/shared/site";
import { ToastHost } from "@/components/ui/Toast";
import "./globals.css";

/**
 * 사이트 전체의 제목·설명·공유 미리보기(T-027). 페이지는 title만 적으면 "○○ | 패들핏"이 된다.
 * 미리보기 그림은 src/app/og.png/route.tsx가 만들고(out/og.png), metadataBase로 절대 주소가 된다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  // og:url은 넣지 않는다. 하위 페이지가 시작 화면 주소를 물려받지 않게, 고정 주소가 있는 페이지만 openGraphFor(경로)로 적는다(T-038)
  openGraph: openGraphFor(),
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION, images: [OG_IMAGE] },
};

/** 밝은·어두운 화면 모두 지원한다(T-028). 화면 위(주소창 등) 색은 바탕색(surface)과 맞춘다 */
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1520" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        {/* 짧은 안내(판매처 이동 등, T-037) */}
        <ToastHost />
      </body>
    </html>
  );
}
