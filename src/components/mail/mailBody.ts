import DOMPurify from "dompurify";

/**
 * 본문에 남겨 두는 태그. 에디터(Tiptap StarterKit + TextAlign + TextStyle)가
 * 실제로 만들어 내는 것들이다. 여기 없는 태그는 통째로 걷어낸다.
 */
const ALLOWED_TAGS = [
  "p", "br", "span", "div",
  "strong", "b", "em", "i", "u", "s", "strike", "del",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "hr", "code", "pre",
  "a",
];

const ALLOWED_ATTR = ["href", "target", "rel", "style", "class", "start"];

/**
 * style 로 남겨 두는 CSS 속성. 에디터의 정렬·글자색·형광펜이 쓰는 것뿐이다.
 * DOMPurify 는 style 속성 안의 CSS 까지 깊게 걸러 주지는 않으므로
 * (임의 CSS 는 화면을 덮는 클릭재킹이나 외부 요청 추적에 쓰일 수 있다)
 * 여기서 직접 화이트리스트로 다시 쓴다.
 */
const ALLOWED_STYLE_PROPS = ["text-align", "color", "background-color"];

let hooksAdded = false;

function addHooks() {
  if (hooksAdded) return;
  hooksAdded = true;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (!(node instanceof Element)) return;

    // 새 창으로 열리는 링크가 opener 를 넘겨주지 않도록 못 박는다
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }

    if (!node.hasAttribute("style")) return;

    // 브라우저 CSS 파서가 읽어 준 값만 다시 조립한다 — 나머지는 통째로 사라진다
    const { style } = node as HTMLElement;
    const kept = ALLOWED_STYLE_PROPS.map((prop) => {
      const value = style.getPropertyValue(prop);
      return value ? `${prop}: ${value}` : "";
    })
      .filter(Boolean)
      .join("; ");

    if (kept) node.setAttribute("style", kept);
    else node.removeAttribute("style");
  });
}

/**
 * 메일 본문 HTML 을 그리기 전에 반드시 통과시킨다.
 * 본문은 다른 사람이 API 로 직접 밀어 넣을 수 있는 값이라 그대로 믿으면 안 된다.
 * URI 스킴은 DOMPurify 기본 정책에 맡긴다 (javascript: 등은 기본으로 막힌다).
 */
export function sanitizeMailBody(html: string): string {
  // DOM 이 없는 곳에서는 정제할 수 없으므로 아무것도 그리지 않는다
  if (typeof window === "undefined") return "";

  addHooks();

  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

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
