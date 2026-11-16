// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { BottomSheet, DRAG_CLOSE_PX } from "./BottomSheet";
import { showToast, TOAST_MS, ToastHost } from "./Toast";
import { FitBar } from "@/components/result/parts";
import { PurchaseLink, TOAST_TEXT } from "@/components/result/ResultCard";

// jsdom 31에는 <dialog>의 showModal·close가 없다(ui.test.tsx와 같은 최소 대체)
beforeAll(() => {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; close?: () => void };
  if (typeof proto.showModal !== "function") proto.showModal = function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
  if (typeof proto.close !== "function")
    proto.close = function (this: HTMLDialogElement) {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** jsdom에는 PointerEvent가 없을 수 있어 clientY·pointerId를 직접 붙인 이벤트를 보낸다 */
function pointer(el: Element, type: "pointerdown" | "pointermove" | "pointerup", clientY: number) {
  const event = new MouseEvent(type, { bubbles: true, clientY });
  Object.defineProperty(event, "pointerId", { value: 1 });
  act(() => {
    el.dispatchEvent(event);
  });
}

function Sheet() {
  const [open, setOpen] = useState(true);
  return (
    <BottomSheet open={open} onClose={() => setOpen(false)} title="시트">
      <p>내용</p>
    </BottomSheet>
  );
}

describe("연출(T-037)", () => {
  it("적합도 막대는 왼쪽 기준 scaleX로 채워지는 연출을 쓴다(폭 연출 아님)", () => {
    render(<FitBar score={70} label="잘 맞음" />);
    const bar = screen.getByTestId("fit-bar");
    expect(bar.className).toContain("animate-bar-fill");
    expect(bar.className).toContain("origin-left");
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const keyframes = css.slice(css.indexOf("@keyframes bar-fill"), css.indexOf("}", css.indexOf("to {", css.indexOf("@keyframes bar-fill"))));
    expect(keyframes).toContain("scaleX");
    expect(keyframes).not.toMatch(/width|height/);
  });
});

describe("판매처 이동 안내(T-037)", () => {
  it("판매처 링크를 누르면 안내가 1초 동안 보였다 사라지고, 링크 주소·새 창은 그대로다", () => {
    vi.useFakeTimers();
    render(
      <>
        <PurchaseLink purchase={{ url: "https://shop.example.com/p", is_affiliate: false }} name="가짜 패들" />
        <ToastHost />
      </>,
    );
    const link = screen.getByRole("link", { name: /판매처에서 보기/ });
    expect(link.getAttribute("href")).toBe("https://shop.example.com/p");
    expect(link.getAttribute("target")).toBe("_blank");
    fireEvent.click(link);
    expect(screen.getByTestId("toast").textContent).toBe(TOAST_TEXT.purchase);
    act(() => {
      vi.advanceTimersByTime(TOAST_MS);
    });
    expect(screen.getByTestId("toast").textContent).toBe("");
  });

  it("안내는 화면 낭독기에 읽히는 영역이고, 연달아 띄우면 마지막 글자만 보인다", () => {
    render(<ToastHost />);
    expect(screen.getByTestId("toast").getAttribute("role")).toBe("status");
    act(() => {
      showToast("첫째");
      showToast("둘째");
    });
    expect(screen.getByTestId("toast").textContent).toBe("둘째");
  });
});

describe("시트 끌어 닫기(T-037)", () => {
  it(`손잡이 줄을 ${DRAG_CLOSE_PX}px 넘게 끌었다 놓으면 닫힌다`, () => {
    render(<Sheet />);
    const handle = screen.getByTestId("sheet-drag-handle");
    pointer(handle, "pointerdown", 100);
    pointer(handle, "pointermove", 100 + DRAG_CLOSE_PX + 20);
    expect((document.querySelector("dialog") as HTMLElement).style.transform).toBe(`translateY(${DRAG_CLOSE_PX + 20}px)`);
    pointer(handle, "pointerup", 100 + DRAG_CLOSE_PX + 20);
    expect(document.querySelector("dialog")!.open).toBe(false);
  });

  it("덜 끌면 제자리로 돌아오고, 위로 끌어도 올라가지 않는다", () => {
    render(<Sheet />);
    const handle = screen.getByTestId("sheet-drag-handle");
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    pointer(handle, "pointerdown", 100);
    pointer(handle, "pointermove", 40);
    expect(dialog.style.transform).toBe("translateY(0px)");
    pointer(handle, "pointermove", 150);
    pointer(handle, "pointerup", 150);
    expect(dialog.open).toBe(true);
    expect(dialog.style.transform).toBe("");
  });

  it("내용 영역이나 닫기 버튼에서 시작한 끌기는 받지 않는다", () => {
    render(<Sheet />);
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    const content = screen.getByText("내용");
    pointer(content, "pointerdown", 100);
    pointer(content, "pointermove", 400);
    pointer(content, "pointerup", 400);
    expect(dialog.open).toBe(true);
    const close = screen.getByRole("button", { name: "닫기", hidden: true });
    pointer(close, "pointerdown", 100);
    pointer(screen.getByTestId("sheet-drag-handle"), "pointermove", 400);
    pointer(screen.getByTestId("sheet-drag-handle"), "pointerup", 400);
    expect(dialog.open).toBe(true);
  });
});
