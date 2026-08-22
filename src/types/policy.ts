/** 회사 생성 시 기본값이 채워지고, 이후 자유롭게 수정하는 문서 카테고리. */
export interface PolicyCategory {
  id: number;
  code: string;
  name: string;
}

export interface PolicyCategoryRequest {
  code: string;
  name: string;
}

/** 문서 유형. description 은 AI 분류 힌트로 쓰인다. */
export interface DocumentType {
  id: number;
  categoryId: number;
  code: string;
  name: string;
  description: string;
}

export interface DocumentTypeRequest {
  categoryId: number;
  code: string;
  name: string;
  description: string;
}

/** 수신자를 도메인으로 분류하는 명단. INTERNAL·EXTERNAL 은 자동 판정이라 등록 대상이 아니다. */
export type DomainScope = "PARTNER" | "PERSONAL_EMAIL";

export interface PolicyDomain {
  id: number;
  domain: string;
  scope: DomainScope;
}

export interface PolicyDomainRequest {
  domain: string;
  scope: DomainScope;
}

/** 반출 규칙이 매치됐을 때의 판정 */
export type RuleAction = "ALLOW" | "REVIEW" | "BLOCK";

/** 보안등급 조건 */
export type RuleClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "SECRET";

/** 발송 방향. 규칙마다 항상 있어야 하는 필수 조건이다. */
export type RuleDirection = "ALL" | "INTERNAL" | "OUTBOUND";

/** 수신 범위. direction 이 OUTBOUND 일 때만 지정할 수 있다 (그 외엔 400). */
export type RuleRecipientScope = "PARTNER" | "PERSONAL_EMAIL" | "EXTERNAL";

/**
 * 문서 반출 규칙.
 * categoryId·documentTypeId·sensitiveTypeId·classification·recipientScope 는
 * 비우면(null) "무관" — 채운 조건은 전부 동시에(AND) 만족해야 규칙이 발동한다.
 * direction 만 필수 조건이다.
 */
export interface PolicyRule {
  id: number;
  name: string;
  enabled: boolean;
  categoryId: number | null;
  documentTypeId: number | null;
  sensitiveTypeId: number | null;
  classification: RuleClassification | null;
  direction: RuleDirection;
  recipientScope: RuleRecipientScope | null;
  action: RuleAction;
}

export interface PolicyRuleRequest {
  name: string;
  categoryId: number | null;
  documentTypeId: number | null;
  sensitiveTypeId: number | null;
  classification: RuleClassification | null;
  direction: RuleDirection;
  recipientScope: RuleRecipientScope | null;
  action: RuleAction;
}
