"use client";

import type { ReactNode } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { TextAlign } from "@tiptap/extension-text-align";
import {
  BackgroundColor,
  Color,
  TextStyle,
} from "@tiptap/extension-text-style";
import { EditorToolbar } from "./EditorToolbar";

export interface TextEditorProps {
  /** 본문이 바뀔 때마다 HTML 문자열을 넘겨준다. */
  onChange?: (html: string) => void;
  /** 본문이 비었을 때 보여줄 안내문 */
  placeholder?: string;
  /** 글자 수 상한. 지정하면 하단에 현재 글자 수를 함께 표시한다. */
  characterLimit?: number;
  /** 본문 영역 최소 높이 (Tailwind 클래스) */
  minHeightClass?: string;
  /** 툴바 오른쪽 끝에 덧붙일 버튼 (첨부 버튼 등) */
  toolbarExtra?: ReactNode;
  /** 툴바와 본문 사이에 끼워 넣을 영역 (첨부파일 목록 등) */
  belowToolbar?: ReactNode;
}

/**
 * 편집 영역(contenteditable)에 직접 입히는 클래스.
 * 본문은 사용자가 만드는 HTML이라 자식 요소 서식도 임의 변형자로 함께 지정한다.
 */
const CONTENT_CLASS = [
  "w-full px-4 py-3 text-sm leading-relaxed text-text-primary focus:outline-none",
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
  // Placeholder 확장이 붙여주는 data-placeholder 를 안내문으로 띄운다
  "[&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0",
  "[&_.is-empty::before]:text-text-tertiary [&_.is-empty::before]:[content:attr(data-placeholder)]",
].join(" ");

export function TextEditor({
  onChange,
  placeholder = "내용을 입력하세요",
  characterLimit,
  minHeightClass = "min-h-64",
  toolbarExtra,
  belowToolbar,
}: TextEditorProps) {
  const editor = useEditor({
    // 서버에서 미리 그리면 하이드레이션이 어긋난다 (Next.js 에서는 필수)
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // 편집 중에 링크를 눌러 페이지가 이동해버리는 것을 막는다
        link: { openOnClick: false },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      // 글자 색 / 형광펜은 textStyle 마크의 인라인 style 로 저장된다
      TextStyle,
      Color,
      BackgroundColor,
      Placeholder.configure({
        placeholder,
        showOnlyCurrent: false,
        // 문서 전체가 비었을 때만 표시 — 중간 빈 줄마다 안내문이 뜨는 것을 막는다
        emptyNodeClass: ({ editor: instance }) =>
          instance.isEmpty ? "is-empty" : "",
      }),
      CharacterCount.configure({ limit: characterLimit }),
    ],
    editorProps: {
      attributes: {
        class: `${CONTENT_CLASS} ${minHeightClass}`,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "메일 본문",
      },
    },
    onUpdate: ({ editor: instance }) => onChange?.(instance.getHTML()),
  });

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border-tertiary bg-surface-primary focus-within:border-brand-500">
      {editor && <EditorToolbar editor={editor} extra={toolbarExtra} />}

      {belowToolbar}

      <EditorContent editor={editor} className="min-w-0 flex-1 overflow-auto" />

      {editor && characterLimit !== undefined && (
        <CharacterCounter editor={editor} limit={characterLimit} />
      )}
    </div>
  );
}

interface CharacterCounterProps {
  editor: Editor;
  limit: number;
}

function CharacterCounter({ editor, limit }: CharacterCounterProps) {
  const characters = useEditorState({
    editor,
    selector: ({ editor: instance }) =>
      instance.storage.characterCount.characters(),
  });

  return (
    <div className="border-t border-border-tertiary px-4 py-1.5 text-right text-xs text-text-tertiary">
      {characters.toLocaleString()} / {limit.toLocaleString()}
    </div>
  );
}
