/**
 * 내용이 오기 전 자리를 잡아 두는 회색 상자. 은은하게 깜빡인다(동작 줄이기면 globals.css 전역 규칙으로 멈춘다).
 * 장식이므로 화면 낭독기에는 숨긴다. 읽는 중이라는 안내가 필요하면 부모가 aria-busy나 별도 문구로 알린다.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" data-skeleton="" className={`animate-shimmer rounded-control bg-line ${className}`.trim()} />;
}

/** 결과 카드 모양 스켈레톤(제목, 막대, 줄 세 개, 버튼 자리) */
export function CardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 rounded-card border border-line bg-card p-4 shadow-card">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="mt-2 h-12 w-full" />
    </div>
  );
}
