"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import FolderSpecialOutlined from "@mui/icons-material/FolderSpecialOutlined";
import GppMaybeOutlined from "@mui/icons-material/GppMaybeOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import VpnKeyOutlined from "@mui/icons-material/VpnKeyOutlined";
import { Button, Input, Modal, Toggle } from "@/components/common";
import { INITIAL_DOCUMENT_POLICIES } from "@/mocks/documentPolicies";
import { parseKeywords } from "@/utils/validation";
import type { DocumentPolicy, PolicyScope } from "@/types/documentPolicy";

const TABS: { scope: PolicyScope; label: string }[] = [
  { scope: "external", label: "외부 발송" },
  { scope: "internal", label: "내부 발송" },
];

/** 범위별로 키워드가 하는 역할이 달라서 탭마다 다른 설명을 보여준다. */
const SCOPE_DESCRIPTION: Record<PolicyScope, string> = {
  external: "본문·첨부에 키워드가 있으면 발송 전 결재 대기로 전환됩니다.",
  internal:
    "같은 회사 도메인 수신자에게는 허용되지만, 다른 도메인으로 나가면 키워드가 있는 메일은 무조건 차단됩니다.",
};

/** 카테고리마다 다른 아이콘을 돌려써서 카드가 밋밋해 보이지 않게 한다. */
const CATEGORY_ICONS = [
  ShieldOutlined,
  LockOutlined,
  VpnKeyOutlined,
  GppMaybeOutlined,
  FolderSpecialOutlined,
];

export default function DocumentPolicyPage() {
  // API 가 아직 없어 목데이터로 시작한다.
  const [policies, setPolicies] = useState<DocumentPolicy[]>(
    INITIAL_DOCUMENT_POLICIES
  );
  const [scope, setScope] = useState<PolicyScope>("external");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  const visiblePolicies = policies.filter((p) => p.scope === scope);
  const tabLabel = TABS.find((tab) => tab.scope === scope)?.label ?? "";

  const toggleEnabled = (id: number, enabled: boolean) =>
    setPolicies((prev) =>
      prev.map((policy) => (policy.id === id ? { ...policy, enabled } : policy))
    );

  const addKeyword = (id: number, keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    setPolicies((prev) =>
      prev.map((policy) =>
        policy.id === id && !policy.keywords.includes(trimmed)
          ? { ...policy, keywords: [...policy.keywords, trimmed] }
          : policy
      )
    );
  };

  const removeKeyword = (id: number, keyword: string) =>
    setPolicies((prev) =>
      prev.map((policy) =>
        policy.id === id
          ? { ...policy, keywords: policy.keywords.filter((k) => k !== keyword) }
          : policy
      )
    );

  const closeModal = () => {
    setIsModalOpen(false);
    setName("");
    setKeywordsInput("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const keywords = parseKeywords(keywordsInput);
    if (!name.trim() || keywords.length === 0) return;

    setPolicies((prev) => [
      ...prev,
      {
        id: Math.max(0, ...prev.map((p) => p.id)) + 1,
        scope,
        name: name.trim(),
        keywords,
        enabled: true,
      },
    ]);
    closeModal();
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-text-primary">문서 정책</h1>

      <div className="flex items-center justify-between gap-2">
        <nav
          aria-label="정책 범위"
          className="flex items-center gap-0.5 rounded-full border border-border-tertiary bg-surface-secondary p-0.5"
        >
          {TABS.map((tab) => (
            <button
              key={tab.scope}
              type="button"
              onClick={() => setScope(tab.scope)}
              aria-current={scope === tab.scope ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                scope === tab.scope
                  ? "bg-brand-500 text-white"
                  : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <AddOutlined fontSize="small" />
          카테고리 추가
        </Button>
      </div>

      <p className="text-sm text-text-secondary">{SCOPE_DESCRIPTION[scope]}</p>

      {visiblePolicies.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visiblePolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onToggle={toggleEnabled}
              onAddKeyword={addKeyword}
              onRemoveKeyword={removeKeyword}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border-tertiary p-8 text-center text-sm text-text-tertiary">
          등록된 카테고리가 없어요.
        </p>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={`${tabLabel} 카테고리 추가`}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
          <Input
            label="카테고리명"
            placeholder="고객 개인정보"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="키워드 (쉼표로 구분)"
            placeholder="주민등록번호, 계좌번호"
            value={keywordsInput}
            onChange={(event) => setKeywordsInput(event.target.value)}
          />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              취소
            </Button>
            <Button type="submit">추가</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PolicyCard({
  policy,
  onToggle,
  onAddKeyword,
  onRemoveKeyword,
}: {
  policy: DocumentPolicy;
  onToggle: (id: number, enabled: boolean) => void;
  onAddKeyword: (id: number, keyword: string) => void;
  onRemoveKeyword: (id: number, keyword: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = CATEGORY_ICONS[policy.id % CATEGORY_ICONS.length];

  const startAdding = () => {
    setIsAdding(true);
    // 아직 그려지지 않은 input 이라 다음 페인트에 포커스를 준다.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const commitAdd = () => {
    onAddKeyword(policy.id, newKeyword);
    setNewKeyword("");
    setIsAdding(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitAdd();
    }
    if (event.key === "Escape") {
      setNewKeyword("");
      setIsAdding(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
        policy.enabled ? "border-border-tertiary" : "border-border-tertiary opacity-60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-text-tertiary">
          <Icon fontSize="small" />
          <span className="truncate text-[15px] font-semibold text-text-primary">
            {policy.name}
          </span>
        </div>

        <Toggle
          checked={policy.enabled}
          onChange={(checked) => onToggle(policy.id, checked)}
          label={policy.enabled ? "ON" : "OFF"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border-tertiary pt-3">
        {policy.keywords.map((keyword) => (
          <span
            key={keyword}
            className="group inline-flex items-center gap-1 rounded-md bg-surface-secondary py-1 pl-2 pr-1 text-xs text-text-secondary"
          >
            {keyword}
            <button
              type="button"
              onClick={() => onRemoveKeyword(policy.id, keyword)}
              aria-label={`${keyword} 삭제`}
              className="grid size-3.5 place-items-center rounded-full text-text-tertiary opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
            >
              <CloseOutlined style={{ fontSize: 11 }} />
            </button>
          </span>
        ))}

        {isAdding ? (
          <input
            ref={inputRef}
            value={newKeyword}
            onChange={(event) => setNewKeyword(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitAdd}
            placeholder="키워드 입력 후 Enter"
            className="h-6 w-32 rounded-md bg-transparent px-1 text-xs text-text-primary placeholder:text-text-tertiary focus-visible:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={startAdding}
            className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-border-secondary py-1 pl-1.5 pr-2 text-xs text-text-tertiary transition-colors hover:border-brand-500 hover:text-brand-500"
          >
            <AddOutlined style={{ fontSize: 13 }} />
            키워드
          </button>
        )}
      </div>
    </div>
  );
}
