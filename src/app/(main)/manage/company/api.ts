import { api } from "@/api/axios";
import type { Company } from "@/types/auth";

/** GET /companies/me — 토큰의 소속 회사 정보를 그대로 읽는다. 남의 회사는 조회할 수 없다. */
export const getMyCompany = () =>
  api.get<Company>("/companies/me").then((res) => res.data);
