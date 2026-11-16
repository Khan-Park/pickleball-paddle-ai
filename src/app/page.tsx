import { StartButton } from "@/components/StartButton";

const POINTS = [
  { title: "스펙을 근거로", body: "무게, 코어 두께, 형태 같은 공개된 스펙으로 맞는 정도를 계산합니다." },
  { title: "이유와 주의점을 함께", body: "왜 추천하는지, 어떤 점은 맞지 않을 수 있는지 같이 보여 줍니다." },
  { title: "수수료와 무관한 순위", body: "구매 링크나 수수료는 추천 순위에 영향을 주지 않습니다." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10 px-5 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-accent">피클볼 패들 추천</p>
        <h1 className="text-3xl font-bold leading-snug text-navy">질문 몇 개로 나에게 맞는 패들 찾기</h1>
        <p className="text-base leading-relaxed text-muted">
          경력, 플레이 성향, 예산을 알려 주시면 맞는 패들 3개를 이유와 함께 보여 드립니다. 1분이면 됩니다.
        </p>
      </header>

      <StartButton />

      <ul className="flex flex-col gap-3">
        {POINTS.map((p) => (
          <li key={p.title} className="rounded-lg border border-line bg-card p-4">
            <h2 className="text-base font-semibold text-ink">{p.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{p.body}</p>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-muted">
        제조사와 판매처가 공개한 스펙을 기준으로 한 추천입니다. 실제 타구감은 사람마다 다를 수 있습니다.
      </p>
    </main>
  );
}
