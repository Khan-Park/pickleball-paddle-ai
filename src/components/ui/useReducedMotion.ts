"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

function read(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(QUERY).matches;
}

/**
 * 운영체제의 "동작 줄이기" 설정을 읽는다. 켜져 있으면 일부러 기다리는 연출(선택 후 지연, 분석 중 화면)을 건너뛴다.
 * 애니메이션 자체는 globals.css의 전역 규칙이 끈다. 미리 그리는 단계(서버)에서는 false로 본다.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
