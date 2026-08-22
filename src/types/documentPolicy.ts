/** 메일이 어느 방향으로 나갈 때 이 정책을 적용할지. */
export type PolicyScope = "internal" | "external";

/**
 * 키워드 기반 검토 정책.
 * 본문·첨부에 keywords 중 하나라도 걸리면 발송 전 결재(review) 대상으로 강제 전환된다.
 */
export interface DocumentPolicy {
  id: number;
  scope: PolicyScope;
  name: string;
  keywords: string[];
  enabled: boolean;
}
