/** 회사별 민감정보 유형. description 은 AI 탐지 힌트로 쓰인다. */
export interface SensitiveType {
  id: number;
  code: string;
  name: string;
  description: string;
}

/** POST/PUT /admin/policy/sensitive-types 요청 본문 */
export interface SensitiveTypeRequest {
  code: string;
  name: string;
  description: string;
}
