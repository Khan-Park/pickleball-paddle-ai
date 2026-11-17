import type { ReactNode } from "react";
import { HERO_PHOTOS, type HeroPhoto, type HeroSlot } from "@/lib/shared/hero-photos";
import { ShapeIcon } from "@/components/ShapeIcon";
import { BallIcon } from "@/components/BallIcon";

/**
 * 짙은 히어로 띠(T-042, docs/plan/m2.5-redesign.md 3.3·3.7). 홈(T-043)·결과(T-045)가 쓴다.
 * - 사진이 있으면 사진 + 덮개(--hero-scrim). 덮개 위 글자 대비는 tokens.test.ts가 계산하고, 실제 사진은 사람이 확인한다(docs/design/assets.md)
 * - 사진이 없으면 직접 그린 대체 배경(그라데이션·코트 선·패들·공). 사진이 늦어도 이대로 배포할 수 있다
 * 배경은 모두 장식이라 화면 낭독기에서 숨기고, children(제목·버튼)만 읽힌다.
 * 글자색은 --on-hero, 포커스 링은 --focus-on-hero로 정해 둔다(안쪽 요소가 따로 정하지 않아도 되게).
 */
export function HeroMedia({
  slot,
  photo = HERO_PHOTOS[slot],
  className = "",
  children,
}: {
  slot: HeroSlot;
  /** 기본은 사진 목록(hero-photos.ts)의 값. 테스트에서만 바꿔 넣는다 */
  photo?: HeroPhoto | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-testid="hero-media"
      data-slot={slot}
      data-photo={photo ? "yes" : "no"}
      className={`relative isolate overflow-hidden bg-hero text-on-hero [&_:focus-visible]:outline-focus-on-hero ${className}`.trim()}
    >
      {photo ? <PhotoLayer photo={photo} /> : <FallbackArt slot={slot} />}
      <div className="relative">{children}</div>
    </div>
  );
}

function PhotoLayer({ photo }: { photo: HeroPhoto }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10" data-testid="hero-photo-layer">
      {/* 첫 화면 그림이라 늦게 불러오지 않는다(LCP). 정적 내보내기라 next/image 최적화 대신 미리 만든 WebP를 쓴다 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        width={photo.width}
        height={photo.height}
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="size-full object-cover"
      />
      <div className="absolute inset-0 bg-hero-scrim" data-testid="hero-scrim" />
    </div>
  );
}

/**
 * 대체 배경 그라데이션 끝에서 틸을 덮는 불투명도. 어두운 화면의 틸은 밝아서 그대로 쓰면 글자 대비가 떨어진다.
 * 이 값으로 섞은 가장 밝은 곳에서도 히어로 글자가 4.5:1을 넘는지 tokens.test.ts가 계산한다.
 */
export const HERO_GRADIENT_ACCENT_OPACITY = 0.35;

/** 사진이 없을 때의 배경. 색은 토큰만 쓴다 */
function FallbackArt({ slot }: { slot: HeroSlot }) {
  const gradientId = `hero-gradient-${slot}`;
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10" data-testid="hero-fallback">
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0.35" style={{ stopColor: "var(--hero)" }} />
            <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: HERO_GRADIENT_ACCENT_OPACITY }} />
          </linearGradient>
        </defs>
        {/* 바탕(히어로 색) 위에 틸을 옅게 덮는 그라데이션 */}
        <rect width="400" height="240" fill={`url(#${gradientId})`} />
        {/* 코트 선: 바깥 선, 네트, 논발리 구역(키친) 선, 가운데 선을 비스듬히 본 모양 */}
        <g fill="none" stroke="var(--on-hero)" strokeOpacity="0.14" strokeWidth="1.5">
          <path d="M150 230 L250 40 L390 40 L400 230 Z" />
          <path d="M210 115 L395 115" strokeOpacity="0.22" strokeWidth="2" />
          <path d="M190 152 L397 152" />
          <path d="M228 80 L393 80" />
          <path d="M298 152 L275 230" />
          <path d="M311 80 L321 40" />
        </g>
      </svg>
      {/* 패들·공 그림(T-041). 글자와 겹치지 않게 오른쪽 아래에 옅게 둔다 */}
      <div className="absolute right-4 bottom-3 flex items-end gap-2 text-on-hero-muted opacity-60 lg:right-10 lg:bottom-6">
        <ShapeIcon shape="hybrid" size="lg" className="-rotate-12" />
        <BallIcon size="md" className="mb-1 text-hero" />
      </div>
    </div>
  );
}
