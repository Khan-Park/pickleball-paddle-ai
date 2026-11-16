import Link from "next/link";
import { StartButton } from "@/components/StartButton";
import { ShapeShowcase } from "@/components/home/ShapeShowcase";

/** 신뢰 요소 3개(docs/plan/phase2.md 5.1). 과장 문구와 느낌표를 쓰지 않는다 */
const TRUST_POINTS = [
  { title: "스펙 근거", body: "무게·코어 두께·형태 같은 공개된 스펙으로 맞는 정도를 계산하고, 이유와 주의점을 함께 보여 드립니다." },
  { title: "수수료와 무관한 순위", body: "구매 링크나 수수료는 추천 순위에 영향을 주지 않습니다." },
  { title: "대회 승인 확인", body: "USA Pickleball 승인 여부를 확인한 날짜와 함께 보여 드립니다." },
] as const;

/** 위에서부터 차례로 떠오르며 나타난다(80ms 간격, 동작 줄이기면 전역 규칙으로 꺼짐) */
const rise = (i: number, className = "") => ({ className: `animate-rise-in ${className}`.trim(), style: { animationDelay: `${i * 80}ms` } });

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-5 pt-4 pb-8">
      <div {...rise(0, "flex items-center gap-2")}>
        {/* 앱 아이콘(src/app/icon.svg)과 같은 그림. 서비스 이름이 정해지면 바꾼다 */}
        <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true" focusable="false">
          <rect width="64" height="64" rx="14" fill="var(--navy)" />
          <rect x="18" y="8" width="28" height="34" rx="9" fill="none" stroke="#ffffff" strokeWidth="4" />
          <rect x="28.5" y="42" width="7" height="15" rx="2" fill="#ffffff" />
          <circle cx="45" cy="47" r="5" fill="var(--accent-bright)" />
        </svg>
        <span className="text-small font-bold text-navy">패들 추천</span>
        {/* 질문 없이 전체 목록을 보는 보조 길(T-026). 하단 고정 바를 높이지 않도록 상단 바 오른쪽에 둔다(-my-2로 줄 높이 유지) */}
        <Link
          href="/browse"
          className="-my-2 ml-auto inline-flex min-h-11 items-center rounded-control px-2 text-small font-bold text-accent underline underline-offset-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          질문 없이 둘러보기
        </Link>
      </div>

      <header {...rise(1, "flex flex-col gap-2")}>
        <h1 className="text-display font-bold text-navy">질문 1분, 나에게 맞는 패들 3개</h1>
        <p className="text-body text-muted">경력·성향·예산을 알려 주시면 스펙 근거로 이유와 함께 보여 드립니다.</p>
      </header>

      <div {...rise(2)}>
        <ShapeShowcase />
      </div>

      <ul data-testid="trust-points" {...rise(3, "flex flex-col gap-3")}>
        {TRUST_POINTS.map((p) => (
          <li key={p.title} className="flex gap-3">
            <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-caption font-bold text-white">
              ✓
            </span>
            <span>
              <span className="block text-small font-bold text-ink">{p.title}</span>
              <span className="block text-caption text-muted">{p.body}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-caption text-muted">제조사와 판매처가 공개한 스펙을 기준으로 한 추천입니다. 실제 타구감은 사람마다 다를 수 있습니다.</p>

      {/* 하단 고정 시작 버튼(엄지 영역). 가리지 않도록 아래 여백을 둔다 */}
      <div aria-hidden="true" className="h-20" />
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur-sm">
        <div {...rise(4, "mx-auto w-full max-w-xl px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]")}>
          <StartButton />
        </div>
      </div>
    </main>
  );
}
