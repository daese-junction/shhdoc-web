"use client";

import { useEffect, useState, type FormEvent } from "react";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import GavelOutlined from "@mui/icons-material/GavelOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";
import SwapHorizOutlined from "@mui/icons-material/SwapHorizOutlined";
import { Button, ConfirmModal, Input, Loading, Modal, Toggle } from "@/components/common";
import { getErrorMessage } from "@/api/axios";
import { useToastStore } from "@/stores/useToastStore";
import {
  policyRuleSchema,
  getFieldErrors,
  type FieldErrors,
} from "@/utils/validation";
import type {
  DocumentType,
  PolicyCategory,
  PolicyRule,
  PolicyRuleRequest,
  RuleAction,
  RuleClassification,
  RuleDirection,
  RuleRecipientScope,
} from "@/types/policy";
import type { SensitiveType } from "@/types/sensitiveType";
import {
  createRule,
  deleteRule,
  listCategories,
  listDocumentTypes,
  listRules,
  listSensitiveTypes,
  setRuleEnabled,
  updateRule,
} from "./api";

/** 폼 입력은 select/input 이 다루기 쉽게 전부 문자열로 받고, 제출할 때 정리한다. */
interface RuleForm {
  name: string;
  categoryId: string;
  documentTypeId: string;
  sensitiveTypeId: string;
  classification: RuleClassification | "";
  direction: RuleDirection;
  recipientScope: RuleRecipientScope | "";
  action: RuleAction | "";
}

const makeInitialForm = (direction: RuleDirection): RuleForm => ({
  name: "",
  categoryId: "",
  documentTypeId: "",
  sensitiveTypeId: "",
  classification: "",
  direction,
  recipientScope: "",
  action: "",
});

// 발송 방향의 INTERNAL(내부발송)과 보안등급의 INTERNAL(사내용)은 이름은 같지만 다른 필드라
// 라벨을 서로 다르게 잡아 헷갈리지 않게 한다.
const ACTION_LABEL: Record<RuleAction, string> = {
  ALLOW: "허용",
  REVIEW: "검토",
  BLOCK: "차단",
};

const ACTION_BADGE_CLASS: Record<RuleAction, string> = {
  ALLOW: "bg-success/10 text-success",
  REVIEW: "bg-warning/10 text-warning",
  BLOCK: "bg-error/10 text-error",
};

const DIRECTION_LABEL: Record<RuleDirection, string> = {
  ALL: "전체",
  INTERNAL: "내부발송",
  OUTBOUND: "외부발송",
};

const CLASSIFICATION_LABEL: Record<RuleClassification, string> = {
  PUBLIC: "공개",
  INTERNAL: "사내용",
  CONFIDENTIAL: "대외비",
  SECRET: "극비",
};

const RECIPIENT_SCOPE_LABEL: Record<RuleRecipientScope, string> = {
  PARTNER: "협력사",
  PERSONAL_EMAIL: "개인 메일",
  EXTERNAL: "기타 외부",
};

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-border-tertiary bg-surface-primary px-3 text-base text-text-primary transition-colors focus-visible:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:bg-surface-tertiary disabled:text-text-tertiary sm:h-10 sm:text-sm";

// 방향·판정 select 는 양옆에 아이콘을 겹쳐 보여줘서 네이티브 화살표를 지우고 자리를 만든다.
const SELECT_CLASS_WITH_ICON = SELECT_CLASS.replace("px-3", "appearance-none pl-9 pr-9");

/** 규칙 목록을 보여줄 발송 방향 탭. ALL 규칙은 양쪽에 다 뜬다. */
type DirectionTab = "OUTBOUND" | "INTERNAL";

const DIRECTION_TABS: { key: DirectionTab; label: string }[] = [
  { key: "OUTBOUND", label: "외부발송" },
  { key: "INTERNAL", label: "내부발송" },
];

function toRequest(form: RuleForm): PolicyRuleRequest {
  return {
    name: form.name.trim(),
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    documentTypeId: form.documentTypeId ? Number(form.documentTypeId) : null,
    sensitiveTypeId: form.sensitiveTypeId ? Number(form.sensitiveTypeId) : null,
    classification: form.classification || null,
    direction: form.direction,
    // OUTBOUND 가 아니면 UI 에서 이미 비워두지만, 제출 시점에도 한 번 더 정리해 400 을 막는다.
    recipientScope: form.direction === "OUTBOUND" ? form.recipientScope || null : null,
    action: form.action as RuleAction,
  };
}

function toForm(rule: PolicyRule): RuleForm {
  return {
    name: rule.name,
    categoryId: rule.categoryId !== null ? String(rule.categoryId) : "",
    documentTypeId: rule.documentTypeId !== null ? String(rule.documentTypeId) : "",
    sensitiveTypeId: rule.sensitiveTypeId !== null ? String(rule.sensitiveTypeId) : "",
    classification: rule.classification ?? "",
    direction: rule.direction,
    recipientScope: rule.recipientScope ?? "",
    action: rule.action,
  };
}

export function RulesTab() {
  const showToast = useToastStore((state) => state.show);

  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [sensitiveTypes, setSensitiveTypes] = useState<SensitiveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [directionTab, setDirectionTab] = useState<DirectionTab>("OUTBOUND");

  const [editing, setEditing] = useState<PolicyRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<RuleForm>(makeInitialForm("OUTBOUND"));
  const [errors, setErrors] = useState<
    FieldErrors<{ name: string; direction: string; action: string }>
  >({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<PolicyRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      listRules(),
      listCategories(),
      listDocumentTypes(),
      listSensitiveTypes(),
    ])
      .then(([ruleList, categoryList, documentTypeList, sensitiveTypeList]) => {
        if (cancelled) return;
        setRules(ruleList);
        setCategories(categoryList);
        setDocumentTypes(documentTypeList);
        setSensitiveTypes(sensitiveTypeList);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = getErrorMessage(error, {}, "규칙을 불러오지 못했어요.");
        if (message) showToast(message, "error");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const visibleRules = rules.filter(
    (rule) => rule.direction === "ALL" || rule.direction === directionTab
  );

  /** 카드 아래쪽에 칩으로 늘어놓을 조건 목록. 방향은 항상 있으니 맨 앞에 둔다. */
  const conditionChips = (rule: PolicyRule): string[] => {
    const chips: string[] = [DIRECTION_LABEL[rule.direction]];

    if (rule.categoryId !== null) {
      chips.push(categories.find((c) => c.id === rule.categoryId)?.name ?? "카테고리");
    }
    if (rule.documentTypeId !== null) {
      chips.push(
        documentTypes.find((d) => d.id === rule.documentTypeId)?.name ?? "문서 유형"
      );
    }
    if (rule.sensitiveTypeId !== null) {
      chips.push(
        sensitiveTypes.find((s) => s.id === rule.sensitiveTypeId)?.name ?? "민감정보"
      );
    }
    if (rule.classification) chips.push(CLASSIFICATION_LABEL[rule.classification]);
    if (rule.recipientScope) chips.push(RECIPIENT_SCOPE_LABEL[rule.recipientScope]);

    return chips;
  };

  const openAddModal = () => {
    setEditing(null);
    // 지금 보고 있는 탭에 맞춰 방향 기본값을 미리 채워준다.
    setForm(makeInitialForm(directionTab));
    setErrors({});
    setFormError(undefined);
    setStep(1);
    setIsModalOpen(true);
  };

  const openEditModal = (rule: PolicyRule) => {
    setEditing(rule);
    setForm(toForm(rule));
    setErrors({});
    setFormError(undefined);
    setStep(1);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const update = <K extends keyof RuleForm>(key: K, value: RuleForm[K]) =>
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // 수신 범위는 외부발송일 때만 의미가 있다 — 그 외엔 서버가 400 을 준다.
      if (key === "direction" && value !== "OUTBOUND") next.recipientScope = "";
      return next;
    });

  const goToConditions = () => {
    const result = policyRuleSchema.safeParse({
      name: form.name,
      direction: form.direction,
      action: form.action,
    });
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = policyRuleSchema.safeParse({
      name: form.name,
      direction: form.direction,
      action: form.action,
    });
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      setStep(1);
      return;
    }

    setErrors({});
    setFormError(undefined);
    setIsSubmitting(true);

    const payload = toRequest(form);

    try {
      if (editing) {
        // PUT /admin/policy/rules/{id} — 조건 전체를 덮어쓴다 (부분 수정 아님)
        const updated = await updateRule(editing.id, payload);
        setRules((prev) => prev.map((rule) => (rule.id === updated.id ? updated : rule)));
        showToast(`${updated.name} 수정했어요.`, "success");
      } else {
        const created = await createRule(payload);
        setRules((prev) => [...prev, created]);
        showToast(`${created.name} 추가했어요.`, "success");
      }
      closeModal();
    } catch (error) {
      setFormError(
        getErrorMessage(error, {
          400: "조건 조합이 올바르지 않아요. (외부발송이 아니면 수신 범위를 지정할 수 없어요)",
          404: "조건으로 지정한 카테고리·문서 유형·민감정보를 찾을 수 없어요.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEnabled = async (rule: PolicyRule, enabled: boolean) => {
    // 먼저 화면에 반영하고, 실패하면 되돌린다.
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled } : r)));

    try {
      await setRuleEnabled(rule.id, enabled);
    } catch (error) {
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: rule.enabled } : r))
      );
      const message = getErrorMessage(error, {}, "변경하지 못했어요.");
      if (message) showToast(message, "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    setIsDeleting(true);
    try {
      await deleteRule(deleting.id);
      setRules((prev) => prev.filter((rule) => rule.id !== deleting.id));
      showToast(`${deleting.name} 삭제했어요.`, "success");
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
        <nav
          aria-label="발송 방향"
          className="flex items-center gap-0.5 rounded-full border border-border-tertiary bg-surface-secondary p-0.5"
        >
          {DIRECTION_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setDirectionTab(item.key)}
              aria-current={directionTab === item.key ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                directionTab === item.key
                  ? "bg-brand-500 text-white"
                  : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <Button size="sm" onClick={openAddModal}>
          <AddOutlined fontSize="small" />
          규칙 추가
        </Button>
      </div>

      <p className="text-sm text-text-secondary">
        채운 조건은 전부 동시에 만족해야 규칙이 발동해요. 비운 조건은
        &ldquo;무관&rdquo;이에요.
      </p>

      {isLoading ? (
        <Loading />
      ) : visibleRules.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visibleRules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-col gap-3 rounded-xl border border-border-tertiary p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-[15px] font-semibold text-text-primary">
                    {rule.name}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BADGE_CLASS[rule.action]}`}
                  >
                    {ACTION_LABEL[rule.action]}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Toggle
                    checked={rule.enabled}
                    onChange={(checked) => toggleEnabled(rule, checked)}
                    label={rule.enabled ? "ON" : "OFF"}
                  />
                  <button
                    type="button"
                    onClick={() => openEditModal(rule)}
                    aria-label={`${rule.name} 수정`}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
                  >
                    <EditOutlined fontSize="small" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(rule)}
                    aria-label={`${rule.name} 삭제`}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-text-tertiary transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <DeleteOutlineOutlined fontSize="small" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 border-t border-border-tertiary pt-3">
                {conditionChips(rule).map((chip, index) => (
                  <span
                    key={`${rule.id}-${chip}-${index}`}
                    className="inline-flex items-center rounded-md bg-surface-secondary px-2 py-1 text-xs text-text-secondary"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border-tertiary p-8 text-center text-sm text-text-tertiary">
          등록된 규칙이 없어요.
        </p>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editing ? "규칙 수정" : "규칙 추가"}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          {/* 단계 표시 */}
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <span
              className={step === 1 ? "font-medium text-brand-500" : ""}
            >
              1. 기본 정보
            </span>
            <span>→</span>
            <span
              className={step === 2 ? "font-medium text-brand-500" : ""}
            >
              2. 조건 (선택)
            </span>
          </div>

          {step === 1 ? (
            <div className="flex flex-col gap-2">
              <Input
                label="규칙 이름"
                placeholder="급여명세서 사외 반출 차단"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                error={errors.name}
              />

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="rule-direction" className="text-sm font-medium text-text-primary">
                  발송 방향
                </label>
                <div className="relative">
                  <SwapHorizOutlined
                    fontSize="small"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                  />
                  <select
                    id="rule-direction"
                    value={form.direction}
                    onChange={(event) =>
                      update("direction", event.target.value as RuleDirection)
                    }
                    className={SELECT_CLASS_WITH_ICON}
                  >
                    <option value="ALL">{DIRECTION_LABEL.ALL} — 누구에게든 적용</option>
                    <option value="INTERNAL">
                      {DIRECTION_LABEL.INTERNAL} — 사내 직원에게 보낼 때만
                    </option>
                    <option value="OUTBOUND">
                      {DIRECTION_LABEL.OUTBOUND} — 회사 밖으로 보낼 때만
                    </option>
                  </select>
                  <KeyboardArrowDownOutlined
                    fontSize="small"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                  />
                </div>
                <p className="min-h-4 text-xs leading-4 text-error">
                  {errors.direction}
                </p>
              </div>

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="rule-action" className="text-sm font-medium text-text-primary">
                  판정
                </label>
                <div className="relative">
                  <GavelOutlined
                    fontSize="small"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                  />
                  <select
                    id="rule-action"
                    value={form.action}
                    onChange={(event) => update("action", event.target.value as RuleAction | "")}
                    className={SELECT_CLASS_WITH_ICON}
                  >
                    <option value="">선택하세요</option>
                    <option value="ALLOW">허용 — 그냥 발송됨</option>
                    <option value="REVIEW">검토 — 관리자 승인 후 발송</option>
                    <option value="BLOCK">차단 — 발송 불가</option>
                  </select>
                  <KeyboardArrowDownOutlined
                    fontSize="small"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                  />
                </div>
                <p className="min-h-4 text-xs leading-4 text-error">
                  {errors.action}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-text-tertiary">
                아래 조건은 전부 선택이에요. 비워두면 &ldquo;무관&rdquo;으로
                취급돼요.
              </p>

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="rule-category" className="text-sm font-medium text-text-primary">
                  카테고리
                </label>
                <select
                  id="rule-category"
                  value={form.categoryId}
                  onChange={(event) => update("categoryId", event.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">무관</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="rule-document-type" className="text-sm font-medium text-text-primary">
                  문서 유형
                </label>
                <select
                  id="rule-document-type"
                  value={form.documentTypeId}
                  onChange={(event) => update("documentTypeId", event.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">무관</option>
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="rule-sensitive-type" className="text-sm font-medium text-text-primary">
                  민감정보
                </label>
                <select
                  id="rule-sensitive-type"
                  value={form.sensitiveTypeId}
                  onChange={(event) => update("sensitiveTypeId", event.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">무관</option>
                  {sensitiveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="rule-classification" className="text-sm font-medium text-text-primary">
                  보안등급
                </label>
                <select
                  id="rule-classification"
                  value={form.classification}
                  onChange={(event) =>
                    update("classification", event.target.value as RuleClassification | "")
                  }
                  className={SELECT_CLASS}
                >
                  <option value="">무관</option>
                  <option value="PUBLIC">공개</option>
                  <option value="INTERNAL">사내용</option>
                  <option value="CONFIDENTIAL">대외비</option>
                  <option value="SECRET">극비</option>
                </select>
              </div>

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="rule-recipient-scope" className="text-sm font-medium text-text-primary">
                  수신 범위
                </label>
                <select
                  id="rule-recipient-scope"
                  value={form.recipientScope}
                  onChange={(event) =>
                    update("recipientScope", event.target.value as RuleRecipientScope | "")
                  }
                  disabled={form.direction !== "OUTBOUND"}
                  className={SELECT_CLASS}
                >
                  <option value="">무관 (외부발송 전체)</option>
                  <option value="PARTNER">협력사</option>
                  <option value="PERSONAL_EMAIL">개인 메일</option>
                  <option value="EXTERNAL">기타 외부</option>
                </select>
                <p className="min-h-4 text-xs leading-4 text-text-tertiary">
                  {form.direction === "OUTBOUND"
                    ? "외부발송을 더 좁힐 때만 골라요."
                    : "외부발송일 때만 고를 수 있어요."}
                </p>
              </div>
            </div>
          )}

          {formError && (
            <p role="alert" className="text-xs text-error">
              {formError}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              취소
            </Button>
            {step === 1 ? (
              <Button type="button" onClick={goToConditions}>
                다음
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  이전
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "저장 중…" : "저장"}
                </Button>
              </>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="규칙 삭제"
        description={deleting ? `'${deleting.name}' 규칙을 삭제할까요?` : ""}
        danger
        loading={isDeleting}
      />
    </div>
  );
}
