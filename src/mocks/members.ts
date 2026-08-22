import type { ApiUser } from "@/types/auth";

/** 구성원 목데이터는 소속 조직도 함께 들고 있다 — 아직 실제 API 에는 없는 필드. */
export interface Member extends ApiUser {
  departmentId: number | null;
}

/** 목록 조회 API 가 붙기 전까지 쓰는 임시 데이터. GET /companies/members 연동 시 교체한다. */
export const INITIAL_MEMBERS: Member[] = [
  { id: 1, email: "admin@shhdoc.com", name: "김대세", role: "ADMIN", departmentId: 1 },
  { id: 2, email: "bob@shhdoc.com", name: "박직원", role: "USER", departmentId: 2 },
  { id: 3, email: "haneul@shhdoc.com", name: "정하늘", role: "USER", departmentId: 2 },
];
