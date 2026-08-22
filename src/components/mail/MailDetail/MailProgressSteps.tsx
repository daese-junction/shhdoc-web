import type { ReactNode } from "react";
import CheckRounded from "@mui/icons-material/CheckRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import type { MailReviewStage } from "@/types/mail";

/**
 * 한 칸의 처리 상태.
 * - busy: 기계가 지금 돌고 있다 (스피너)
 * - current: 여기까지 왔고 사람 손을 기다린다 (채운 점)
 * 둘을 나누는 이유는 관리자 승인 칸에 스피너를 돌리면 곧 끝날 것처럼 보이기 때문이다.
 */
type StepState = "done" | "busy" | "current" | "failed" | "waiting";

interface Step {
  label: string;
  state: StepState;
}

interface MailProgressStepsProps {
  /** 반려된 메일이면 관리자 승인 칸이 실패로 찍힌다 */
  isRejected: boolean;
  /** 승인 대기 메일의 검토 단계. 못 받았으면 검토는 끝난 것으로 본다. */
  reviewStage?: MailReviewStage;
}

/**
 * 발송이 어느 국면에서 멈춰 있는지 한 줄로 답한다.
 * `문서 검토 → 관리자 승인 → 발송` 세 칸이고, 지금 칸만 강조한다.
 */
export function MailProgressSteps({
  isRejected,
  reviewStage,
}: MailProgressStepsProps) {
  const isScanning = reviewStage === "SCANNING";

  const steps: Step[] = [
    { label: "문서 검토", state: isScanning ? "busy" : "done" },
    {
      label: "관리자 승인",
      // 검토가 끝나야 승인 차례가 온다
      state: isRejected ? "failed" : isScanning ? "waiting" : "current",
    },
    { label: "발송", state: "waiting" },
  ];

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-md border border-border-tertiary bg-surface-primary px-3 py-2">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-1.5">
          {index > 0 && (
            <span
              aria-hidden
              className="mr-1 h-px w-4 shrink-0 bg-border-secondary sm:w-8"
            />
          )}
          <StepMark state={step.state} />
          <span className={`text-xs ${LABEL_CLASS[step.state]}`}>
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

const LABEL_CLASS: Record<StepState, string> = {
  done: "text-text-secondary",
  busy: "font-medium text-text-primary",
  current: "font-medium text-text-primary",
  failed: "font-medium text-error",
  waiting: "text-text-tertiary",
};

/** 칸 앞에 붙는 표시. 라벨이 주 신호이고 이것은 거들 뿐이다. */
function StepMark({ state }: { state: StepState }) {
  const mark: Record<StepState, ReactNode> = {
    done: (
      <span className="flex size-4 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckRounded fontSize="inherit" className="text-xs" />
      </span>
    ),
    // reduced-motion 에서는 이 링이 멈춘 채로 보인다 — 그래서 라벨을 함께 굵게 둔다
    busy: (
      <span className="size-4 shrink-0 animate-spin rounded-full border border-brand-500 border-t-transparent" />
    ),
    current: (
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-warning">
        <span className="size-1.5 rounded-full bg-warning" />
      </span>
    ),
    failed: (
      <span className="flex size-4 items-center justify-center rounded-full bg-error/15 text-error">
        <CloseRounded fontSize="inherit" className="text-xs" />
      </span>
    ),
    waiting: (
      <span className="size-4 shrink-0 rounded-full border border-border-secondary" />
    ),
  };

  return (
    <span aria-hidden className="flex shrink-0 items-center">
      {mark[state]}
    </span>
  );
}
