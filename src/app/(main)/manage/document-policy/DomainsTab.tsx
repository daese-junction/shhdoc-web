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
  policyDomainSchema,
  getFieldErrors,
  type PolicyDomainInput,
  type FieldErrors,
} from "@/utils/validation";
import type { DomainScope, PolicyDomain } from "@/types/policy";
import { createDomain, deleteDomain, listDomains, updateDomain } from "./api";

const initialForm: PolicyDomainInput = { domain: "", scope: "PARTNER" };

const SCOPE_LABEL: Record<DomainScope, string> = {
  PARTNER: "협력사",
  PERSONAL_EMAIL: "개인 메일",
};

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-border-tertiary bg-surface-primary px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 sm:h-10 sm:text-sm";

export function DomainsTab() {
  const showToast = useToastStore((state) => state.show);

  const [domains, setDomains] = useState<PolicyDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editing, setEditing] = useState<PolicyDomain | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<PolicyDomainInput>(initialForm);
  const [errors, setErrors] = useState<FieldErrors<PolicyDomainInput>>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<PolicyDomain | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listDomains()
      .then((result) => {
        if (cancelled) return;
        setDomains(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = getErrorMessage(error, {}, "도메인 명단을 불러오지 못했어요.");
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

  const openEditModal = (domain: PolicyDomain) => {
    setEditing(domain);
    setForm({ domain: domain.domain, scope: domain.scope });
    setErrors({});
    setFormError(undefined);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = policyDomainSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    setErrors({});
    setFormError(undefined);
    setIsSubmitting(true);

    try {
      if (editing) {
        // PUT /admin/policy/domains/{id}
        const updated = await updateDomain(editing.id, result.data);
        setDomains((prev) =>
          prev.map((domain) => (domain.id === updated.id ? updated : domain))
        );
        showToast(`${updated.domain} 수정했어요.`, "success");
      } else {
        // POST /admin/policy/domains
        const created = await createDomain(result.data);
        setDomains((prev) => [...prev, created]);
        showToast(`${created.domain} 추가했어요.`, "success");
      }
      closeModal();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setErrors((prev) => ({
          ...prev,
          domain: getErrorMessage(error, { 409: "이미 등록된 도메인이에요." }),
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
      await deleteDomain(deleting.id);
      setDomains((prev) => prev.filter((domain) => domain.id !== deleting.id));
      showToast(`${deleting.domain} 삭제했어요.`, "success");
      setDeleting(null);
    } catch (error) {
      showToast(getErrorMessage(error, {}, "삭제하지 못했어요."), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-text-secondary">
          협력사·개인 메일 도메인만 등록해요. 사내 도메인과 그 외 외부는
          자동으로 판정됩니다.
        </p>

        <Button size="sm" onClick={openAddModal}>
          <AddOutlined fontSize="small" />
          도메인 추가
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-tertiary">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary text-text-secondary">
              <tr>
                <th className="px-4 py-2.5 font-medium">도메인</th>
                <th className="px-4 py-2.5 font-medium">구분</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-tertiary">
              {domains.length > 0 ? (
                domains.map((domain) => (
                  <tr key={domain.id}>
                    <td className="px-4 py-2.5 text-text-primary">
                      {domain.domain}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {SCOPE_LABEL[domain.scope]}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(domain)}
                          aria-label={`${domain.domain} 수정`}
                          className="grid size-7 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
                        >
                          <EditOutlined fontSize="small" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(domain)}
                          aria-label={`${domain.domain} 삭제`}
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
                    등록된 도메인이 없어요.
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
        title={editing ? "도메인 수정" : "도메인 추가"}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
          <Input
            label="도메인"
            placeholder="partner-corp.co.kr"
            value={form.domain}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, domain: event.target.value }))
            }
            error={errors.domain}
            hint="@ 나 대소문자는 신경 쓰지 않아도 돼요."
          />

          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="domain-scope" className="text-sm font-medium text-text-primary">
              구분
            </label>
            <select
              id="domain-scope"
              value={form.scope}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  scope: event.target.value as PolicyDomainInput["scope"],
                }))
              }
              className={SELECT_CLASS}
            >
              <option value="PARTNER">협력사</option>
              <option value="PERSONAL_EMAIL">개인 메일</option>
            </select>
          </div>

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
        title="도메인 삭제"
        description={deleting ? `'${deleting.domain}' 도메인을 삭제할까요?` : ""}
        danger
        loading={isDeleting}
      />
    </div>
  );
}
