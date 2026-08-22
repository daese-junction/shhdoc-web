"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Modal } from "@/components/common";

interface LinkDialogProps {
  open: boolean;
  /** 이미 링크 위에 커서가 있을 때의 기존 주소 */
  defaultUrl?: string;
  onClose: () => void;
  /** 빈 문자열이면 링크를 해제한다 */
  onSubmit: (url: string) => void;
}

/** `example.com` 처럼 스킴 없이 입력해도 링크가 동작하도록 보정한다 */
function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^(https?:\/\/|mailto:|tel:)/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

export function LinkDialog({
  open,
  defaultUrl = "",
  onClose,
  onSubmit,
}: LinkDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="링크 추가">
      {/* Modal 이 닫히면 내부가 언마운트되므로 열 때마다 기존 주소로 초기화된다 */}
      <LinkForm defaultUrl={defaultUrl} onClose={onClose} onSubmit={onSubmit} />
    </Modal>
  );
}

interface LinkFormProps {
  defaultUrl: string;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

function LinkForm({ defaultUrl, onClose, onSubmit }: LinkFormProps) {
  const [url, setUrl] = useState(defaultUrl);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(normalizeUrl(url));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="주소"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://example.com"
        hint="비워두고 저장하면 링크가 해제됩니다."
        autoFocus
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
