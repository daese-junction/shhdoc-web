import { MOCK_COMPANY } from "@/mocks/company";

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
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold text-text-primary">회사 정보</h1>
        <div className="flex flex-col gap-2 rounded-lg border border-border-tertiary p-4">
          <InfoRow label="회사명" value={MOCK_COMPANY.name} />
          <InfoRow label="회사 ID" value={String(MOCK_COMPANY.id)} />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-tertiary pt-6">
        <h2 className="text-lg font-semibold text-text-primary">도메인</h2>
        <div className="flex flex-col gap-2 rounded-lg border border-border-tertiary p-4">
          <InfoRow label="메일 도메인" value={`@${MOCK_COMPANY.emailDomain}`} />
          <p className="text-xs text-text-tertiary">
            이 도메인으로 보내는 메일이 사내 발송으로 판정됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
