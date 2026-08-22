export interface Department {
  id: number;
  name: string;
}

/** API 연동 전까지 쓰는 임시 데이터. */
export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 1, name: "경영지원팀" },
  { id: 2, name: "개발팀" },
  { id: 3, name: "영업팀" },
];
