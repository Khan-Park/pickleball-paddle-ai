import type { Shape } from "../../../data/schema";
import type { MatchLabel } from "@/lib/recommend/recommend";
import { WEIGHT_BAND } from "@/lib/recommend/scoring-config";
import { ShapeIcon } from "@/components/ShapeIcon";
import { SHAPE_LABEL } from "@/lib/shared/shape-labels";

/**
 * 결과 미리보기 예시(T-043, docs/plan/m2.5-redesign.md 2장 홈 행·3.2).
 * 실제 제품이 추천처럼 보이지 않게 브랜드·모델 없이 형태 그림과 스펙 칩만 쓴다. 근거 없는 특성 태그(파워·스핀 등)와 점수 숫자는 넣지 않는다.
 * 무게대 경계는 추천 엔진의 기준(WEIGHT_BAND)에서 읽는다.
 */
const EXAMPLES: { shape: Shape; weight: string; core: string; label: MatchLabel }[] = [
  { shape: "hybrid", weight: `중간 무게(${WEIGHT_BAND.lightBelowOz}~${WEIGHT_BAND.heavyAboveOz}oz)`, core: "코어 16mm", label: "매우 잘 맞음" },
  { shape: "widebody", weight: `가벼운 편(${WEIGHT_BAND.lightBelowOz}oz 미만)`, core: "코어 16mm", label: "잘 맞음" },
  { shape: "elongated", weight: `무거운 편(${WEIGHT_BAND.heavyAboveOz}oz 초과)`, core: "코어 14mm", label: "잘 맞음" },
];

export function ExamplePreview() {
  return (
    <section aria-labelledby="example-preview-title" className="flex flex-col gap-4" data-testid="example-preview">
      <div className="flex items-center gap-2">
        <h2 id="example-preview-title" className="text-heading font-bold text-navy">
          이런 결과를 받아요
        </h2>
        <span className="rounded-control border border-line px-2 py-0.5 text-caption font-bold text-muted">예시</span>
      </div>
      <ol className="grid gap-3 lg:grid-cols-3">
        {EXAMPLES.map((ex, i) => (
          <li key={ex.shape} className="flex items-center gap-3 rounded-card border border-line bg-card p-4 shadow-card">
            <ShapeIcon shape={ex.shape} size="md" className="shrink-0 text-navy" />
            <span className="flex min-w-0 flex-col gap-2">
              <span className="flex items-center gap-2">
                <span className="text-small font-bold text-ink">{i + 1}순위</span>
                <span className="rounded-control bg-accent-soft px-2 py-0.5 text-caption font-bold text-accent-ink">{ex.label}</span>
              </span>
              <span className="flex flex-wrap gap-1">
                {[SHAPE_LABEL[ex.shape], ex.weight, ex.core].map((chip) => (
                  <span key={chip} className="rounded-control bg-surface px-2 py-0.5 text-caption text-muted">
                    {chip}
                  </span>
                ))}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-caption text-muted">실제 결과에는 제품 이름, 맞는 이유와 주의할 점, 판매처가 함께 나옵니다.</p>
    </section>
  );
}
