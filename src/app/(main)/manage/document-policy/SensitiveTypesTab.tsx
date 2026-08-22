"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Button, ConfirmModal, Input, Loading, Modal } from "@/components/common";
import { getErrorMessage } from "@/api/axios";
import { useToastStore } from "@/stores/useToastStore";
import {
  sensitiveTypeSchema,
  getFieldErrors,
  type SensitiveTypeInput,
  type FieldErrors,
} from "@/utils/validation";
import type { SensitiveType } from "@/types/sensitiveType";
import {
  createSensitiveType,
  deleteSensitiveType,
  listSensitiveTypes,
  updateSensitiveType,
} from "./api";

interface SensitiveTypeForm {
  name: string;
  description: string;
}

const initialForm: SensitiveTypeForm = { name: "", description: "" };

export function SensitiveTypesTab() {
  const showToast = useToastStore((state) => state.show);

  const [types, setTypes] = useState<SensitiveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editing, setEditing] = useState<SensitiveType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<SensitiveTypeForm>(initialForm);
  const [errors, setErrors] = useState<FieldErrors<SensitiveTypeInput>>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<SensitiveType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listSensitiveTypes()
      .then((result) => {
        if (cancelled) return;
        setTypes(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // 응답 자체가 없는 네트워크 오류는 인터셉터가 이미 토스트로 안내했다.
        const message = getErrorMessage(
          error,
          {},
          "민감정보 유형을 불러오지 못했어요."
        );
        if (message) showToast(message, "error");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const openAddModal = () => {
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setFormError(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (type: SensitiveType) => {
    setEditing(type);
    setForm({ name: type.name, description: type.description });
    setErrors({});
    setFormError(undefined);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const update = (key: keyof SensitiveTypeForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // code 는 화면에 노출하지 않고 이름과 동일하게 넣는다.
    const result = sensitiveTypeSchema.safeParse({
      code: form.name,
      name: form.name,
      description: form.description,
    });
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    setErrors({});
    setFormError(undefined);
    setIsSubmitting(true);

    try {
      if (editing) {
        // PUT /admin/policy/sensitive-types/{id}
        const updated = await updateSensitiveType(editing.id, result.data);
        setTypes((prev) =>
          prev.map((type) => (type.id === updated.id ? updated : type))
        );
        showToast(`${updated.name} 수정했어요.`, "success");
      } else {
        // POST /admin/policy/sensitive-types
        const created = await createSensitiveType(result.data);
        setTypes((prev) => [...prev, created]);
        showToast(`${created.name} 추가했어요.`, "success");
      }
      closeModal();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setErrors((prev) => ({
          ...prev,
          name: getErrorMessage(error, { 409: "이미 쓰이는 이름이에요." }),
        }));
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        setFormError("대상을 찾을 수 없어요. 목록을 새로고침해주세요.");
      } else {
        setFormError(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    setIsDeleting(true);
    try {
      // DELETE /admin/policy/sensitive-types/{id} — 참조하는 규칙이 있으면 409
      await deleteSensitiveType(deleting.id);
      setTypes((prev) => prev.filter((type) => type.id !== deleting.id));
      showToast(`${deleting.name} 삭제했어요.`, "success");
      setDeleting(null);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? "이 유형을 조건으로 쓰는 규칙이 있어 삭제할 수 없어요."
          : getErrorMessage(error, {}, "삭제하지 못했어요.");
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-text-secondary">
          등록한 설명은 AI 가 민감정보를 탐지할 때 힌트로 씁니다.
        </p>

        <Button size="sm" onClick={openAddModal}>
          <AddOutlined fontSize="small" />
          유형 추가
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-tertiary">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary text-text-secondary">
              <tr>
                <th className="px-4 py-2.5 font-medium">항목</th>
                <th className="px-4 py-2.5 font-medium">설명</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-tertiary">
              {types.length > 0 ? (
                types.map((type) => (
                  <tr key={type.id}>
                    <td className="px-4 py-2.5 text-text-primary">
                      {type.name}
                    </td>
                    <td className="max-w-md truncate px-4 py-2.5 text-text-secondary">
                      {type.description}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(type)}
                          aria-label={`${type.name} 수정`}
                          className="grid size-7 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
                        >
                          <EditOutlined fontSize="small" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(type)}
                          aria-label={`${type.name} 삭제`}
                          className="grid size-7 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-error/10 hover:text-error"
                        >
                          <DeleteOutlineOutlined fontSize="small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-text-tertiary"
                  >
                    등록된 유형이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editing ? "민감정보 유형 수정" : "민감정보 유형 추가"}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
          <Input
            label="항목"
            placeholder="개인정보"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            error={errors.name}
          />

          <Input
            label="설명"
            placeholder="주민등록번호, 연락처, 주소, 계좌번호 등 개인 식별 정보"
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            error={errors.description}
            hint="AI 가 이 유형을 탐지할 때 힌트로 사용해요."
          />

          {formError && (
            <p role="alert" className="text-xs text-error">
              {formError}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중…" : "저장"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="민감정보 유형 삭제"
        description={
          deleting
            ? `'${deleting.name}' 유형을 삭제할까요? 이 유형을 조건으로 쓰는 규칙이 있으면 삭제할 수 없어요.`
            : ""
        }
        danger
        loading={isDeleting}
      />
    </div>
  );
}
