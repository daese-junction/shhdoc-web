export interface Role {
  id: number;
  name: string;
  /** 숫자가 작을수록 상위 직책이다. */
  priority: number;
}

/** API 연동 전까지 쓰는 임시 데이터. */
export const INITIAL_ROLES: Role[] = [
  { id: 1, name: "대표", priority: 1 },
  { id: 2, name: "이사", priority: 2 },
  { id: 3, name: "팀장", priority: 3 },
  { id: 4, name: "팀원", priority: 4 },
];
