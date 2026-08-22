"use client";

import { useEffect, useState } from "react";
import { Loading } from "@/components/common";
import { getErrorMessage } from "@/api/axios";
import { useToastStore } from "@/stores/useToastStore";
import type { Company } from "@/types/auth";
import { getMyCompany } from "./api";

/** 읽기 전용 정보 한 줄. 라벨은 폭을 고정해 여러 줄이 나란히 정렬되게 한다. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="w-24 shrink-0 text-text-secondary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}

export default function ManageCompanyPage() {
  const showToast = useToastStore((state) => state.show);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // GET /companies/me — 토큰의 소속 회사를 그대로 읽는다. 남의 회사는 조회할 수 없다.
    getMyCompany()
      .then((result) => {
        if (cancelled) return;
        setCompany(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // 응답 자체가 없는 네트워크 오류는 인터셉터가 이미 토스트로 안내했다.
        const message = getErrorMessage(error, {}, "회사 정보를 불러오지 못했어요.");
        if (message) showToast(message, "error");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  if (isLoading) {
    return <Loading />;
  }

  if (!company) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-text-secondary">
          회사 정보를 불러오지 못했어요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold text-text-primary">회사 정보</h1>
        <div className="flex flex-col gap-2 rounded-lg border border-border-tertiary p-4">
          <InfoRow label="회사명" value={company.name} />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-tertiary pt-6">
        <h2 className="text-lg font-semibold text-text-primary">도메인</h2>
        <div className="flex flex-col gap-2 rounded-lg border border-border-tertiary p-4">
          <InfoRow label="메일 도메인" value={`@${company.emailDomain}`} />
          <p className="text-xs text-text-tertiary">
            이 도메인으로 보내는 메일이 사내 발송으로 판정됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
