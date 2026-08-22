/**
 * 메일 본문 HTML 의 자식 요소 서식.
 * 작성 화면(에디터)과 상세 화면(읽기)이 같은 모양을 내도록 한 곳에서 관리한다.
 */
export const MAIL_BODY_CLASS = [
  // 문단·제목
  "[&_p]:my-2",
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-semibold",
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold",
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-semibold",
  // 목록
  "[&_ul]:my-2 [&_ul]:pl-6",
  // Tab 으로 들여쓸 때마다 채운 원 → 빈 원 → 채운 네모 순으로 돌아간다
  "[&_ul]:list-disc [&_ul_ul]:list-[circle] [&_ul_ul_ul]:list-[square]",
  "[&_ul_ul_ul_ul]:list-disc [&_ul_ul_ul_ul_ul]:list-[circle] [&_ul_ul_ul_ul_ul_ul]:list-[square]",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-0.5 [&_li>p]:my-0",
  "[&_li>ul]:my-0 [&_li>ol]:my-0",
  // 인용·구분선
  "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border-secondary [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary",
  "[&_hr]:my-4 [&_hr]:border-t [&_hr]:border-border-tertiary",
  // 코드
  "[&_code]:rounded [&_code]:bg-surface-tertiary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface-tertiary [&_pre]:p-3 [&_pre]:text-[0.85em]",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
  // 링크
  "[&_a]:text-brand-500 [&_a]:underline [&_a]:underline-offset-2",
].join(" ");
