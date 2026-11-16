"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { buildShareUrl, SHARE_TEXT } from "@/lib/shared/share";
import { Button } from "@/components/ui/Button";

const subscribe = () => () => {};
/** 휴대폰 기본 공유 창(Web Share)을 쓸 수 있는가. 미리 그리는 단계(서버)에서는 false */
const readCanShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

type Status = { kind: "idle" } | { kind: "copied" } | { kind: "manual" };

/**
 * 결과 공유(T-025, D6). "공유하기"(기본 공유 창이 있을 때만) + "링크 복사".
 * 주소에는 제품 id만 들어간다(buildShareUrl). 공유 글에 제품 이름·답변·조건을 넣지 않는다.
 * 복사 기능을 쓸 수 없으면(앱 안 브라우저 등) 주소를 읽기 전용 칸에 보여 직접 복사하게 한다.
 */
export function ShareButtons({ paddleIds }: { paddleIds: readonly string[] }) {
  const canShare = useSyncExternalStore(subscribe, readCanShare, () => false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputId = useId();
  const url = buildShareUrl(paddleIds);

  async function share() {
    try {
      await navigator.share({ title: SHARE_TEXT.title, text: SHARE_TEXT.text, url });
    } catch {
      // 사용자가 공유 창을 닫은 경우(AbortError) 등. 오류로 보이지 않는다
    }
  }

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setStatus({ kind: "copied" });
    } catch {
      setStatus({ kind: "manual" });
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-card p-4" data-testid="share" aria-labelledby={`${inputId}-title`}>
      <h2 id={`${inputId}-title`} className="text-small font-bold text-ink">
        이 결과 공유하기
      </h2>
      <p className="text-caption text-muted">추천된 제품만 담깁니다. 답변은 공유되지 않습니다.</p>
      <div className="flex flex-wrap gap-2">
        {canShare ? (
          <Button variant="primary" size="md" onClick={share}>
            공유하기
          </Button>
        ) : null}
        <Button variant="secondary" size="md" onClick={copy}>
          링크 복사
        </Button>
      </div>
      <p role="status" className="text-small text-confirm">
        {status.kind === "copied" ? "링크를 복사했습니다." : ""}
      </p>
      {status.kind === "manual" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={inputId} className="text-caption text-muted">
            복사 기능을 쓸 수 없어 주소를 보여 드립니다. 길게 눌러 복사해 주세요.
          </label>
          <input
            id={inputId}
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-h-11 w-full rounded-control border border-line bg-surface px-3 text-small text-ink"
            data-testid="share-url"
          />
        </div>
      ) : null}
    </section>
  );
}
