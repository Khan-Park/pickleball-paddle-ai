"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * 아래에서 올라오는 시트. 비교표·용어 도움말·제품 상세가 같이 쓴다(docs/plan/phase2.md 5.5).
 * 브라우저 기본 모달 `<dialog>`를 써서 포커스 가두기, Esc 닫기, 배경 비활성화를 브라우저에 맡긴다.
 * - 열림 여부는 부모가 `open`으로 정하고, 닫혀야 할 때(Esc·닫기 버튼·바깥 누르기) `onClose`를 부른다.
 * - 닫히면 열기 직전에 포커스가 있던 요소(보통 연 버튼)로 포커스를 돌려준다.
 * - 열려 있는 동안 뒤 페이지가 스크롤되지 않게 한다.
 */
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
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Esc로 닫혔든 close()로 닫혔든 `close` 이벤트가 한 번 온다. 여기서 정리하고 부모에게 알린다
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      document.documentElement.style.overflow = "";
      opener.current?.focus();
      opener.current = null;
      onCloseRef.current();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  // 화면에서 사라질 때 열려 있었다면 스크롤 잠금을 푼다
  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

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
        <div className="flex flex-col gap-2 px-5 pt-3 pb-2">
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
      </div>
    </dialog>
  );
}
