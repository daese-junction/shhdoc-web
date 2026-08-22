import { api } from "@/api/axios";
import type { CreateCompanyRequest, CreateCompanyResponse } from "@/types/auth";

/**
 * POST /companies — 회사와 대표자(ADMIN) 계정을 한 번에 만든다.
 * 인증이 필요 없는 유일한 계정 생성 API 다.
 *
 * emailDomain 은 회사의 고정 도메인이며 첨부파일의 사내/사외 발송 판단 기준이 된다.
 * 대표자 email 도 반드시 이 도메인이어야 한다.
 *
 * 400: 대표자 이메일이 회사 도메인과 다름
 * 409: 이미 등록된 도메인이거나 이미 가입된 이메일
 */
export const createCompany = (payload: CreateCompanyRequest) =>
  api
    .post<CreateCompanyResponse>("/companies", payload)
    .then((res) => res.data);
