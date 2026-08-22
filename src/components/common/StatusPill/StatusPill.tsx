import type { ReactNode } from "react";

interface StatusPillProps {
  label: string;
  /** 라벨 앞에 붙는 아이콘. busy 면 무시되고 스피너가 대신 들어간다. */
  icon?: ReactNode;
  /** 진행 중인 상태인지. 스피너를 돌리고 aria-busy 를 켠다. */
  busy?: boolean;
  /** 배경·글자색. 예: "bg-warning/10 text-warning" */
  tone: string;
  /** 마우스를 올렸을 때 뜨는 사유 */
  title?: string;
}

/** 알약 자체의 모양. 색만 tone 으로 갈아 끼운다. */
const PILL_CLASS =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

/**
 * 상태를 한 칸으로 알리는 알약.
 *
 * 진행 중이면 스피너가 돌지만 라벨이 언제나 주 신호다 —
 * `prefers-reduced-motion` 에서는 전역 규칙(globals.css)이 애니메이션을 세워버려
 * 스피너가 멈춘 반쪽 링으로 보이기 때문이다.
 */
export function StatusPill({
  label,
  icon,
  busy = false,
  tone,
  title,
}: StatusPillProps) {
  return (
    <span
      title={title}
      aria-busy={busy || undefined}
      className={`${PILL_CLASS} ${tone}`}
    >
      {busy ? (
        // border-current 라 알약 글자색을 그대로 따라간다
        <span
          aria-hidden
          className="size-3 shrink-0 animate-spin rounded-full border border-current border-t-transparent"
        />
      ) : (
        icon
      )}
      {label}
    </span>
  );
}
