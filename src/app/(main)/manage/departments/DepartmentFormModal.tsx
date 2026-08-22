"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Modal } from "@/components/common";
import {
  createDepartmentSchema,
  getFieldErrors,
  type FieldErrors,
} from "@/utils/validation";

interface DepartmentFormModalProps {
  open: boolean;
  title: string;
  /** 있으면 수정(이름 채워서 시작), 없으면 추가 */
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

/** 조직 추가·수정에서 함께 쓰는 폼. 필드가 이름 하나뿐이라 모달만 공유한다. */
export function DepartmentFormModal({
  open,
  title,
  initialName = "",
  onClose,
  onSubmit,
}: DepartmentFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {/* 열릴 때마다 새로 마운트해 이전 입력·에러 없이 initialName 으로 시작한다 */}
      {open && (
        <DepartmentForm
          initialName={initialName}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      )}
    </Modal>
  );
}

function DepartmentForm({
  initialName,
  onClose,
  onSubmit,
}: {
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [errors, setErrors] = useState<FieldErrors<{ name: string }>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = createDepartmentSchema.safeParse({ name });
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    onSubmit(result.data.name);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <Input
        label="조직명"
        placeholder="개발팀"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button type="submit">확인</Button>
      </div>
    </form>
  );
}
