"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 짧은 안내(토스트, T-037). 화면 어디서든 showToast(글자)로 띄우고, 레이아웃의 ToastHost 하나가 그린다.
 * 한 번에 하나만, TOAST_MS 동안 보였다가 사라진다. 화면 낭독기에는 role="status"로 읽힌다.
 * 링크 이동을 막지 않는다(안내만 한다).
 * 바텀시트(모달 <dialog>)는 브라우저의 맨 위 층에 그려져 보통 고정 요소를 덮는다. 시트 안 구매 버튼에서도 안내가 보이도록
 * popover로 맨 위 층에 올린다(popover를 못 쓰는 브라우저에서는 보통 고정 요소로 보인다).
 */
export const TOAST_MS = 1000;
const EVENT = "pb:toast";

export function showToast(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }));
}

/**
 * 안내를 받아 보는 함수(T-038). 모달 시트가 열려 있으면 시트 밖 요소는 화면 낭독기에서 빠질 수 있어,
 * 시트(BottomSheet)가 이것으로 같은 글자를 시트 안 상태 영역에도 넣는다. 돌려준 함수로 해제한다.
 */
export function subscribeToast(listener: (message: string) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<string>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

type PopoverElement = HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void };

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  // 같은 글자를 연달아 띄워도 다시 나타나게 번호를 붙인다
  const [seq, setSeq] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<PopoverElement>(null);

  useEffect(() => {
    const onToast = (event: Event) => {
      const text = (event as CustomEvent<string>).detail;
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      setSeq((n) => n + 1);
      timer.current = setTimeout(() => setMessage(null), TOAST_MS);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // 새 안내마다 맨 위 층으로 다시 올린다(그 사이 열린 시트보다 위에 오게)
  useEffect(() => {
    const el = ref.current;
    if (!el?.showPopover || !el.hidePopover) return;
    try {
      if (el.matches(":popover-open")) el.hidePopover();
      if (message) el.showPopover();
    } catch {
      // popover를 지원하지 않거나 상태가 맞지 않으면 보통 고정 요소로 둔다
    }
  }, [message, seq]);

  return (
    <div
      ref={ref}
      popover="manual"
      // popover 기본 모양(가운데 상자·테두리·배경)을 지우고 하단 고정 바 위에 띄운다. 누르기를 가로채지 않는다
      className="pointer-events-none fixed inset-x-0 top-auto bottom-28 z-50 m-0 flex w-full justify-center border-0 bg-transparent p-0 px-5 [&:not(:popover-open)]:block"
      role="status"
      aria-live="polite"
      data-testid="toast"
    >
      {message ? (
        <p key={seq} className="mx-auto w-fit animate-reveal rounded-full bg-ink px-4 py-2 text-small font-bold text-surface shadow-sheet">
          {message}
        </p>
      ) : null}
    </div>
  );
}
