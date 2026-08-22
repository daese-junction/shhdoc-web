import { api } from "@/api/axios";
import type { SensitiveType, SensitiveTypeRequest } from "@/types/sensitiveType";
import type {
  DocumentType,
  DocumentTypeRequest,
  PolicyCategory,
  PolicyCategoryRequest,
  PolicyDomain,
  PolicyDomainRequest,
  PolicyRule,
  PolicyRuleRequest,
} from "@/types/policy";

const SENSITIVE_TYPES_URL = "/admin/policy/sensitive-types";
const CATEGORIES_URL = "/admin/policy/categories";
const DOCUMENT_TYPES_URL = "/admin/policy/document-types";
const DOMAINS_URL = "/admin/policy/domains";
const RULES_URL = "/admin/policy/rules";

/** GET /admin/policy/sensitive-types — 회사별 민감정보 유형 목록 (ADMIN 전용) */
export const listSensitiveTypes = () =>
  api.get<SensitiveType[]>(SENSITIVE_TYPES_URL).then((res) => res.data);

/** POST /admin/policy/sensitive-types — 민감정보 유형 추가. 409: 코드 중복 */
export const createSensitiveType = (payload: SensitiveTypeRequest) =>
  api.post<SensitiveType>(SENSITIVE_TYPES_URL, payload).then((res) => res.data);

/** PUT /admin/policy/sensitive-types/{id} — 수정. 404: 대상 없음, 409: 코드 중복 */
export const updateSensitiveType = (id: number, payload: SensitiveTypeRequest) =>
  api
    .put<SensitiveType>(`${SENSITIVE_TYPES_URL}/${id}`, payload)
    .then((res) => res.data);

/**
 * DELETE /admin/policy/sensitive-types/{id} — 삭제.
 * 404: 대상 없음, 409: 이 유형을 조건으로 쓰는 규칙이 있어 거부됨
 */
export const deleteSensitiveType = (id: number) =>
  api.delete<void>(`${SENSITIVE_TYPES_URL}/${id}`).then(() => undefined);

/** GET /admin/policy/categories — 문서 카테고리 목록 */
export const listCategories = () =>
  api.get<PolicyCategory[]>(CATEGORIES_URL).then((res) => res.data);

/** POST /admin/policy/categories — 카테고리 추가. 409: 코드 중복 */
export const createCategory = (payload: PolicyCategoryRequest) =>
  api.post<PolicyCategory>(CATEGORIES_URL, payload).then((res) => res.data);

/** PUT /admin/policy/categories/{id} — 수정. 404: 대상 없음, 409: 코드 중복 */
export const updateCategory = (id: number, payload: PolicyCategoryRequest) =>
  api.put<PolicyCategory>(`${CATEGORIES_URL}/${id}`, payload).then((res) => res.data);

/**
 * DELETE /admin/policy/categories/{id} — 삭제.
 * 404: 대상 없음, 409: 하위 문서 유형 또는 참조 규칙이 있어 거부됨
 */
export const deleteCategory = (id: number) =>
  api.delete<void>(`${CATEGORIES_URL}/${id}`).then(() => undefined);

/** GET /admin/policy/document-types — 문서 유형 목록 */
export const listDocumentTypes = () =>
  api.get<DocumentType[]>(DOCUMENT_TYPES_URL).then((res) => res.data);

/** POST /admin/policy/document-types — 문서 유형 추가. 404: 카테고리 없음, 409: 코드 중복 */
export const createDocumentType = (payload: DocumentTypeRequest) =>
  api.post<DocumentType>(DOCUMENT_TYPES_URL, payload).then((res) => res.data);

/**
 * PUT /admin/policy/document-types/{id} — 수정 (카테고리 이동도 여기서 처리).
 * 404: 대상 또는 카테고리 없음, 409: 코드 중복
 */
export const updateDocumentType = (id: number, payload: DocumentTypeRequest) =>
  api
    .put<DocumentType>(`${DOCUMENT_TYPES_URL}/${id}`, payload)
    .then((res) => res.data);

/** DELETE /admin/policy/document-types/{id} — 삭제. 409: 참조 규칙 존재 */
export const deleteDocumentType = (id: number) =>
  api.delete<void>(`${DOCUMENT_TYPES_URL}/${id}`).then(() => undefined);

/** GET /admin/policy/domains — 협력사·개인 메일 도메인 명단 (INTERNAL·EXTERNAL 은 자동 판정이라 여기 없다) */
export const listDomains = () =>
  api.get<PolicyDomain[]>(DOMAINS_URL).then((res) => res.data);

/** POST /admin/policy/domains — 도메인 추가. 409: 이미 등록된 도메인 */
export const createDomain = (payload: PolicyDomainRequest) =>
  api.post<PolicyDomain>(DOMAINS_URL, payload).then((res) => res.data);

/** PUT /admin/policy/domains/{id} — 수정. 404: 대상 없음, 409: 이미 등록된 도메인 */
export const updateDomain = (id: number, payload: PolicyDomainRequest) =>
  api.put<PolicyDomain>(`${DOMAINS_URL}/${id}`, payload).then((res) => res.data);

/** DELETE /admin/policy/domains/{id} — 삭제 */
export const deleteDomain = (id: number) =>
  api.delete<void>(`${DOMAINS_URL}/${id}`).then(() => undefined);

/** GET /admin/policy/rules — 문서 반출 규칙 목록 */
export const listRules = () =>
  api.get<PolicyRule[]>(RULES_URL).then((res) => res.data);

/**
 * POST /admin/policy/rules — 규칙 추가.
 * 400: direction 없이 recipientScope 지정 등 잘못된 조합, 404: 조건으로 지정한 분류·유형 없음
 */
export const createRule = (payload: PolicyRuleRequest) =>
  api.post<PolicyRule>(RULES_URL, payload).then((res) => res.data);

/**
 * PUT /admin/policy/rules/{id} — 조건 전체를 덮어쓴다 (부분 수정 아님).
 * 400: 잘못된 조건 조합, 404: 대상 또는 조건 대상 없음
 */
export const updateRule = (id: number, payload: PolicyRuleRequest) =>
  api.put<PolicyRule>(`${RULES_URL}/${id}`, payload).then((res) => res.data);

/** DELETE /admin/policy/rules/{id} — 삭제 */
export const deleteRule = (id: number) =>
  api.delete<void>(`${RULES_URL}/${id}`).then(() => undefined);

/** PATCH /admin/policy/rules/{id}/enabled — 규칙 사용/중지 */
export const setRuleEnabled = (id: number, enabled: boolean) =>
  api
    .patch<PolicyRule>(`${RULES_URL}/${id}/enabled`, { enabled })
    .then((res) => res.data);
