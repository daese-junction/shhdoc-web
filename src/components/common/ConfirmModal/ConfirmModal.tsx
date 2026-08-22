import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import { Modal } from "../Modal/Modal";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** 본문. 문자열이면 그대로 한 문단으로 그린다. */
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 되돌릴 수 없는 동작이면 확인 버튼을 경고색으로 */
  danger?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {typeof description === "string" ? (
        <p className="text-sm text-text-secondary">{description}</p>
      ) : (
        description
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? "outline" : "primary"}
          className={danger ? "border-error text-error" : ""}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
