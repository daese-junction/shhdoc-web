import CloseOutlined from "@mui/icons-material/CloseOutlined";
import Dialog from "@mui/material/Dialog";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 캔버스나 표처럼 넓은 내용이 들어가면 `md`. 기본은 `sm`. */
  maxWidth?: "sm" | "md";
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  maxWidth = "sm",
  children,
}: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <div className="bg-surface-primary p-5 text-text-primary sm:p-6">
        <div
          className={`mb-4 flex items-center gap-2 ${
            title ? "justify-between" : "justify-end"
          }`}
        >
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-1.5 -mt-1.5 grid size-8 shrink-0 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          >
            <CloseOutlined fontSize="small" />
          </button>
        </div>
        {children}
      </div>
    </Dialog>
  );
}
