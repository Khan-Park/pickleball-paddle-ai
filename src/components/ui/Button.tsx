import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "text";
export type ButtonSize = "md" | "lg";

type ButtonStyle = { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string };

const BASE =
  "inline-flex items-center justify-center gap-2 text-center font-bold outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent " +
  "transition-transform duration-[var(--duration-fast)] ease-[var(--ease-enter)] active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100";

const VARIANT: Record<ButtonVariant, string> = {
  // 한 화면에 주 버튼은 하나만 둔다(docs/plan/phase2.md 7.2)
  primary: "rounded-control bg-accent text-white hover:brightness-110",
  secondary: "rounded-control border border-line bg-card text-ink hover:border-accent",
  text: "rounded-control text-muted underline underline-offset-4 hover:text-ink",
};

// 터치 영역: md 44px, lg 52px 이상(엄지로 누르기 쉽게)
const SIZE: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-small",
  lg: "min-h-13 px-5 text-body",
};

/**
 * 버튼 모양 클래스. `<button>`뿐 아니라 `next/link`의 `<Link>`에도 같은 모양을 입힐 때 쓴다.
 * 텍스트 버튼은 높이만 확보하고 좌우 여백을 줄인다.
 */
export function buttonClass({ variant = "primary", size = "lg", fullWidth = false, className = "" }: ButtonStyle = {}): string {
  const sizing = variant === "text" ? `${size === "lg" ? "min-h-13" : "min-h-11"} px-2 text-small` : SIZE[size];
  return [BASE, VARIANT[variant], sizing, fullWidth ? "w-full" : "", className].filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & Omit<ButtonStyle, "className">;

/** 기본 버튼. type의 기본값은 "button"이다(폼 안에서 실수로 제출되지 않게) */
export function Button({ variant, size, fullWidth, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, fullWidth, className })} {...rest} />;
}
