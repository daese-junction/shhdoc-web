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
  /** 처리 중. 확인 버튼을 잠그고, 실수로 닫아 결과를 놓치지 않게 닫기도 막는다. */
  loading?: boolean;
  /** 입력이 아직 유효하지 않을 때. 닫기는 그대로 두고 확인만 막는다. */
  confirmDisabled?: boolean;
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
  loading = false,
  confirmDisabled = false,
}: ConfirmModalProps) {
  const close = () => {
    if (!loading) onClose();
  };

  return (
    <Modal open={open} onClose={close} title={title}>
      {typeof description === "string" ? (
        <p className="text-sm text-text-secondary">{description}</p>
      ) : (
        description
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={close} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? "outline" : "primary"}
          className={danger ? "border-error text-error" : ""}
          onClick={onConfirm}
          loading={loading}
          disabled={confirmDisabled}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
