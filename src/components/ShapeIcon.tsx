import type { ShapeValue } from "@/lib/quiz/questions";

/**
 * 패들 형태를 보여 주는 단순한 선 그림. 제품 사진이 아니라 직접 그린 도형이다(저작권 문제 없음).
 * 비율은 형태 차이가 눈에 보이도록 과장했고 실제 치수와 정확히 같지 않다. 장식용이라 화면 낭독기에는 숨긴다.
 */
const FACE: Record<ShapeValue, { width: number; height: number }> = {
  standard: { width: 30, height: 38 },
  widebody: { width: 36, height: 34 },
  hybrid: { width: 28, height: 42 },
  elongated: { width: 24, height: 46 },
};

export function ShapeIcon({ shape, className }: { shape: ShapeValue; className?: string }) {
  const { width, height } = FACE[shape];
  const x = (48 - width) / 2;
  const top = 4;
  const handleTop = top + height;
  return (
    <svg viewBox="0 0 48 72" width="36" height="54" className={className} aria-hidden="true" focusable="false" data-shape={shape}>
      <rect x={x} y={top} width={width} height={height} rx="8" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <rect x="20" y={handleTop} width="8" height={68 - handleTop} rx="2" fill="currentColor" />
    </svg>
  );
}
