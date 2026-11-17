"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * 화면 조건(미디어 쿼리)이 맞는지 읽는다. 미리 그리는 단계(서버)와 matchMedia가 없는 테스트 환경에서는 false.
 * 결과 화면이 1024px 이상에서 카드 3열 배치를 고를 때 쓴다(T-046). 두 배치를 함께 그려 CSS로 숨기지 않기 위해서다.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const read = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, read, () => false);
}

/** Tailwind lg(64rem)와 같은 기준 */
export const DESKTOP_QUERY = "(min-width: 64rem)";
