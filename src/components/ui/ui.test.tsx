// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { Badge } from "./Badge";
import { BottomSheet } from "./BottomSheet";
import { Button, buttonClass } from "./Button";
import { CardSkeleton, Skeleton } from "./Skeleton";

/**
 * jsdom 31은 <dialog>의 showModal()·close()가 없다. 브라우저 동작 중 이 컴포넌트가 기대는 부분만 흉내 낸다:
 * showModal은 open 속성을 켜고, close는 끄면서 close 이벤트를 한 번 보낸다.
 * Esc 키 처리(cancel → close)는 브라우저가 하므로 테스트에서는 "브라우저가 close()를 부른 경우"로 확인한다.
 */
beforeAll(() => {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { showModal?: () => void; close?: () => void };
  if (typeof proto.showModal !== "function") {
    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (typeof proto.close !== "function") {
    proto.close = function (this: HTMLDialogElement) {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
});
afterEach(cleanup);

describe("Button", () => {
  it("type 기본값은 button이고, 주 버튼은 청록 바탕 클래스를 쓴다", () => {
    render(<Button>다음</Button>);
    const button = screen.getByRole("button", { name: "다음" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.className).toContain("bg-accent");
  });

  it("buttonClass로 링크에도 같은 모양을 입힐 수 있다", () => {
    expect(buttonClass({ variant: "secondary", fullWidth: true })).toContain("w-full");
    expect(buttonClass({ variant: "secondary" })).toContain("border-line");
    expect(buttonClass({ variant: "text" })).toContain("underline");
  });
});

describe("Badge", () => {
  it("상태 아이콘과 글자를 함께 보여 주고, 아이콘은 화면 낭독기에 숨긴다", () => {
    render(<Badge tone="confirm">대회 승인</Badge>);
    const badge = screen.getByText("대회 승인").parentElement!;
    expect(badge.dataset.tone).toBe("confirm");
    const icon = badge.querySelector("[aria-hidden='true']");
    expect(icon?.textContent).toBe("✓");
  });

  it("중립·광고 배지는 기본 아이콘이 없다", () => {
    render(<Badge tone="ad">광고</Badge>);
    expect(screen.getByText("광고").parentElement!.querySelector("[aria-hidden='true']")).toBeNull();
  });
});

describe("Skeleton", () => {
  it("화면 낭독기에 숨긴다", () => {
    const { container } = render(
      <>
        <Skeleton className="h-4" />
        <CardSkeleton />
      </>,
    );
    for (const el of container.children) expect(el.getAttribute("aria-hidden")).toBe("true");
  });
});

function SheetHarness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        비교하기
      </button>
      <BottomSheet
        open={open}
        title="3개 비교"
        onClose={() => {
          setOpen(false);
          onClose();
        }}
      >
        <p>비교 내용</p>
      </BottomSheet>
    </>
  );
}

const dialog = () => document.querySelector("dialog")!;

describe("BottomSheet", () => {
  it("열면 모달로 열리고 제목이 시트의 이름이 된다. 뒤 페이지 스크롤을 잠근다", () => {
    render(<SheetHarness />);
    expect(dialog().open).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "비교하기" }));
    expect(dialog().open).toBe(true);
    const labelId = dialog().getAttribute("aria-labelledby")!;
    expect(document.getElementById(labelId)?.textContent).toBe("3개 비교");
    expect(document.documentElement.style.overflow).toBe("hidden");
  });

  it("닫기 버튼으로 닫으면 onClose를 부르고, 연 버튼으로 포커스를 돌려주며, 스크롤 잠금을 푼다", () => {
    const onClose = vi.fn();
    render(<SheetHarness onClose={onClose} />);
    const opener = screen.getByRole("button", { name: "비교하기" });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", { name: "닫기", hidden: true }));
    expect(dialog().open).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("바깥(배경)을 누르면 닫히고, 시트 안을 누르면 닫히지 않는다", () => {
    render(<SheetHarness />);
    fireEvent.click(screen.getByRole("button", { name: "비교하기" }));
    fireEvent.click(screen.getByText("비교 내용"));
    expect(dialog().open).toBe(true);
    fireEvent.click(dialog());
    expect(dialog().open).toBe(false);
  });

  it("브라우저가 닫은 경우(Esc 키 등)에도 onClose가 불려 부모 상태가 맞춰진다", () => {
    const onClose = vi.fn();
    render(<SheetHarness onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "비교하기" }));
    // 실제 브라우저에서는 close 이벤트 뒤 React가 상태를 반영한 다음 사용자가 다시 누른다. 테스트에서는 act로 그 반영을 기다린다
    act(() => dialog().close());
    expect(onClose).toHaveBeenCalledTimes(1);
    // 다시 열 수 있다(부모의 open이 false로 돌아왔다)
    fireEvent.click(screen.getByRole("button", { name: "비교하기" }));
    expect(dialog().open).toBe(true);
  });
});
