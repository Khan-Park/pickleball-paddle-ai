/**
 * 피클볼 공 그림(T-041). 라임은 꾸밈에만 쓴다는 규칙(docs/plan/m2.5-redesign.md 3.7)의 "공 그림"에 해당한다.
 * 라임은 밝은 바탕과 대비가 낮아(약 1.3:1) 테두리를 currentColor로 그어 경계를 보이게 한다. 장식용이라 화면 낭독기에는 숨긴다.
 */
export const BALL_ICON_SIZE = { sm: 16, md: 24, lg: 40 } as const;

/** 구멍 자리(24×24 그림 기준). 가운데 하나와 둘레 여섯 개 */
const HOLES: [number, number][] = [
  [12, 12],
  [12, 5.5],
  [17.6, 8.8],
  [17.6, 15.2],
  [12, 18.5],
  [6.4, 15.2],
  [6.4, 8.8],
];

export function BallIcon({ className, size = "md" }: { className?: string; size?: keyof typeof BALL_ICON_SIZE }) {
  const px = BALL_ICON_SIZE[size];
  return (
    <svg viewBox="0 0 24 24" width={px} height={px} className={className} aria-hidden="true" focusable="false" data-testid="ball-icon">
      <circle cx="12" cy="12" r="10.75" fill="var(--lime)" stroke="currentColor" strokeWidth="1.5" />
      {HOLES.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill="var(--on-lime)" fillOpacity="0.55" />
      ))}
    </svg>
  );
}
