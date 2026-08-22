"use client";

import { useState } from "react";
import { CategoriesTab } from "./CategoriesTab";
import { DomainsTab } from "./DomainsTab";
import { RulesTab } from "./RulesTab";
import { SensitiveTypesTab } from "./SensitiveTypesTab";

type TabKey = "sensitiveTypes" | "categories" | "domains" | "rules";

const TABS: { key: TabKey; label: string }[] = [
  { key: "sensitiveTypes", label: "민감정보 유형" },
  { key: "categories", label: "문서 카테고리" },
  { key: "domains", label: "수신자 도메인" },
  { key: "rules", label: "반출 규칙" },
];

export default function DocumentPolicyPage() {
  const [tab, setTab] = useState<TabKey>("sensitiveTypes");

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold text-text-primary">정책</h1>

      <nav
        aria-label="정책 분류"
        className="flex w-fit flex-wrap items-center gap-0.5 rounded-full border border-border-tertiary bg-surface-secondary p-0.5"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            aria-current={tab === item.key ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === item.key
                ? "bg-brand-500 text-white"
                : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "sensitiveTypes" && <SensitiveTypesTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "domains" && <DomainsTab />}
      {tab === "rules" && <RulesTab />}
    </div>
  );
}
