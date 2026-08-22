import type { DocumentPolicy } from "@/types/documentPolicy";

/** API 연동 전까지 쓰는 임시 데이터. */
export const INITIAL_DOCUMENT_POLICIES: DocumentPolicy[] = [
  {
    id: 1,
    scope: "external",
    name: "고객 개인정보",
    keywords: ["주민등록번호", "여권번호", "계좌번호", "전화번호"],
    enabled: true,
  },
  {
    id: 2,
    scope: "external",
    name: "기밀 표시 문서",
    keywords: ["대외비", "기밀", "내부용"],
    enabled: true,
  },
  {
    id: 3,
    scope: "external",
    name: "계약·법무",
    keywords: ["계약서", "비밀유지계약", "위약금"],
    enabled: true,
  },
  {
    id: 4,
    scope: "external",
    name: "지식재산",
    keywords: ["특허", "설계도", "소스코드"],
    enabled: false,
  },
  {
    id: 5,
    scope: "internal",
    name: "인사 정보",
    keywords: ["연봉", "징계", "퇴사", "평가등급"],
    enabled: true,
  },
  {
    id: 6,
    scope: "internal",
    name: "재무 정보",
    keywords: ["매출원가", "영업이익", "손익계산서"],
    enabled: false,
  },
  {
    id: 7,
    scope: "internal",
    name: "조직 개편",
    keywords: ["구조조정", "인수합병", "조직개편"],
    enabled: true,
  },
  {
    id: 8,
    scope: "internal",
    name: "보안 사고",
    keywords: ["유출", "해킹", "장애"],
    enabled: true,
  },
];
