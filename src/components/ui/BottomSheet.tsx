"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { subscribeToast, TOAST_MS } from "./Toast";

/**
 * 아래에서 올라오는 시트. 비교표·용어 도움말·제품 상세가 같이 쓴다(docs/plan/phase2.md 5.5).
 * 브라우저 기본 모달 `<dialog>`를 써서 포커스 가두기, Esc 닫기, 배경 비활성화를 브라우저에 맡긴다.
 * - 열림 여부는 부모가 `open`으로 정하고, 닫혀야 할 때(Esc·닫기 버튼·바깥 누르기) `onClose`를 부른다.
 * - 닫히면 열기 직전에 포커스가 있던 요소(보통 연 버튼)로 포커스를 돌려준다.
 * - 열려 있는 동안 뒤 페이지가 스크롤되지 않게 한다.
 */
/**
 * 열린 시트 수. 시트 위에 시트가 열릴 수 있으므로(상세 → 도움말) 마지막 시트가 닫힐 때만 스크롤 잠금을 푼다(T-033).
 * 시트마다 잠금은 한 번만 걸고 한 번만 푼다(locked ref).
 */
let openSheets = 0;
function lockScroll() {
  openSheets += 1;
  document.documentElement.style.overflow = "hidden";
}
function unlockScroll() {
  openSheets = Math.max(0, openSheets - 1);
  if (openSheets === 0) document.documentElement.style.overflow = "";
}

/** 손잡이·제목 줄을 이만큼(px) 넘게 아래로 끌었다 놓으면 닫는다(T-037) */
export const DRAG_CLOSE_PX = 100;

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const locked = useRef(false);
  // 끌어 닫기(T-037): 누른 위치. 끄는 동안에는 상태를 바꾸지 않고 dialog의 transform만 바꿔 다시 그리지 않는다
  const drag = useRef<{ startY: number; dy: number; id: number } | null>(null);
  // 시트가 열린 동안 뜬 안내(판매처 이동 등)를 시트 안에서도 화면 낭독기에 알린다(T-038)
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    if (!open) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeToast((message) => {
      setAnnounce(message);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setAnnounce(""), TOAST_MS);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
      setAnnounce("");
    };
  }, [open]);
  // onClose가 렌더마다 새 함수여도 이벤트 연결을 다시 하지 않게 최신 값을 담아 둔다
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      if (!locked.current) {
        locked.current = true;
        lockScroll();
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Esc로 닫혔든 close()로 닫혔든 `close` 이벤트가 한 번 온다. 여기서 정리하고 부모에게 알린다
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      drag.current = null;
      dialog.style.transform = "";
      dialog.style.transition = "";
      if (locked.current) {
        locked.current = false;
        unlockScroll();
      }
      opener.current?.focus();
      opener.current = null;
      onCloseRef.current();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  // 화면에서 사라질 때 열려 있었다면 스크롤 잠금을 푼다
  useEffect(
    () => () => {
      if (locked.current) {
        locked.current = false;
        unlockScroll();
      }
    },
    [],
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // 바깥(배경)을 누르면 닫는다. 시트 안을 누르면 대상이 dialog가 아니라 안쪽 요소다
      onClick={(event) => {
        if (event.target === event.currentTarget) ref.current?.close();
      }}
      className="bottom-sheet mx-auto mt-auto mb-0 w-full max-w-xl rounded-t-sheet bg-card p-0 text-ink shadow-sheet open:animate-sheet-in"
    >
      <div className="flex max-h-[85dvh] flex-col">
        {/*
          손잡이·제목 줄을 잡고 아래로 끌면 시트가 따라 내려오고, DRAG_CLOSE_PX 넘게 내려간 채 놓으면 닫는다(phase2 5.5, T-037).
          내용 영역에서는 끌기를 받지 않는다(스크롤과 겹치지 않게). 닫기 버튼에서 시작한 누르기는 끌기로 보지 않는다.
          touch-none: 이 줄에서는 브라우저 기본 스크롤·당겨서 새로고침 대신 끌기를 받는다
        */}
        <div
          className="flex cursor-grab touch-none flex-col gap-2 px-5 pt-3 pb-2 active:cursor-grabbing"
          data-testid="sheet-drag-handle"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            drag.current = { startY: event.clientY, dy: 0, id: event.pointerId };
            event.currentTarget.setPointerCapture?.(event.pointerId);
            if (ref.current) ref.current.style.transition = "none";
          }}
          onPointerMove={(event) => {
            const d = drag.current;
            if (!d || d.id !== event.pointerId || !ref.current) return;
            d.dy = Math.max(0, event.clientY - d.startY);
            ref.current.style.transform = `translateY(${d.dy}px)`;
          }}
          onPointerUp={(event) => {
            const d = drag.current;
            const dialog = ref.current;
            drag.current = null;
            if (!d || d.id !== event.pointerId || !dialog) return;
            if (d.dy > DRAG_CLOSE_PX) {
              dialog.close();
              return;
            }
            // 덜 끌었으면 제자리로 돌아온다
            dialog.style.transition = "transform var(--duration-base) var(--ease-enter)";
            dialog.style.transform = "";
          }}
          onPointerCancel={() => {
            drag.current = null;
            if (ref.current) {
              ref.current.style.transition = "";
              ref.current.style.transform = "";
            }
          }}
        >
          <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-line" />
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-heading font-bold text-navy">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="min-h-11 rounded-control px-3 text-small font-bold text-muted outline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              닫기
            </button>
          </div>
        </div>
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
        <p role="status" className="sr-only" data-testid="sheet-announce">
          {announce}
        </p>
      </div>
    </dialog>
  );
}
