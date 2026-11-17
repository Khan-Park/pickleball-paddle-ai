import type { Shape } from "../../data/schema";

/**
 * 패들 형태 그림. 제품 사진이 아니라 직접 그린 도형이다(저작권 문제 없음, D-035 (1)).
 * 비율은 형태 차이가 눈에 보이도록 과장했고 실제 치수와 정확히 같지 않다. 장식용이라 화면 낭독기에는 숨긴다.
 * 제조사 로고·글자·무늬는 넣지 않는다(상표 오인 방지). 색은 currentColor와 토큰만 써서 부모 글자색(남색·틸)을 따른다.
 * 면 크기는 공유 미리보기(src/app/og.png/route.tsx)와 같은 비율이다. 바꾸면 그쪽도 함께 바꾼다.
 * 형태가 늘면 여기서 타입 오류가 난다.
 */
export const FACE: Record<Shape, { width: number; height: number; radius: number }> = {
  standard: { width: 30, height: 38, radius: 8 },
  widebody: { width: 36, height: 34, radius: 10 },
  hybrid: { width: 28, height: 42, radius: 8 },
  elongated: { width: 24, height: 46, radius: 7 },
};

/** 크기 단계. sm은 목록 줄·카드, md는 질문 선택지, lg는 시작 화면(T-023, T-041). 그림 비율은 같다 */
export const SHAPE_ICON_SIZE = { sm: { width: 24, height: 36 }, md: { width: 36, height: 54 }, lg: { width: 56, height: 84 } } as const;

const TOP = 4;
/** 손잡이 끝(끝 마개 아래 끝은 이보다 3 아래) */
const HANDLE_END = 66;

/** 모르는 형태 값이면 아무것도 그리지 않는다(선택지가 바뀌어도 화면이 깨지지 않게) */
export function ShapeIcon({ shape, className, size = "md" }: { shape: string; className?: string; size?: keyof typeof SHAPE_ICON_SIZE }) {
  if (!Object.hasOwn(FACE, shape)) return null;
  const { width, height, radius } = FACE[shape as Shape];
  const x = (48 - width) / 2;
  const faceBottom = TOP + height;
  const gripTop = faceBottom + 4;
  // 그립 감은 줄: 손잡이 위에서 아래로 4 간격의 비스듬한 선
  const wraps = Array.from({ length: Math.floor((HANDLE_END - gripTop - 2) / 4) }, (_, i) => gripTop + 3 + i * 4);
  return (
    <svg
      viewBox="0 0 48 72"
      width={SHAPE_ICON_SIZE[size].width}
      height={SHAPE_ICON_SIZE[size].height}
      className={className}
      aria-hidden="true"
      focusable="false"
      data-shape={shape}
    >
      {/* 목: 면 아래에서 손잡이로 좁아진다 */}
      <path d={`M${24 - 6} ${faceBottom - 1} L${24 + 6} ${faceBottom - 1} L${24 + 4} ${gripTop + 1} L${24 - 4} ${gripTop + 1} Z`} fill="currentColor" />
      {/* 손잡이와 그립 줄 */}
      <rect x="20" y={gripTop} width="8" height={HANDLE_END - gripTop} rx="2" fill="currentColor" />
      {wraps.map((y) => (
        <path key={y} d={`M20.5 ${y} L27.5 ${y - 2.5}`} stroke="var(--card)" strokeOpacity="0.5" strokeWidth="1" strokeLinecap="round" />
      ))}
      {/* 끝 마개 */}
      <rect x="19" y={HANDLE_END - 1} width="10" height="4" rx="2" fill="currentColor" />
      {/* 면: 옅은 바탕 + 가장자리 보호대(굵은 테두리) + 안쪽 가는 선 */}
      <rect x={x} y={TOP} width={width} height={height} rx={radius} fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2.5" />
      <rect
        x={x + 3}
        y={TOP + 3}
        width={width - 6}
        height={height - 6}
        rx={radius - 3}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
    </svg>
  );
}
