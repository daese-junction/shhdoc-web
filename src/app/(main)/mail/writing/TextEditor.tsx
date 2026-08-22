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
import { MAIL_BODY_CLASS } from "@/components/mail";
import { EditorToolbar } from "./EditorToolbar";

export interface TextEditorProps {
  /** 초기 본문 HTML (답장·전달 인용문 등). 이후 값은 에디터가 직접 관리한다. */
  defaultValue?: string;
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
  // 서식은 상세 화면과 한 벌로 관리한다 (components/mail/mailBody.ts)
  MAIL_BODY_CLASS,
  // Placeholder 확장이 붙여주는 data-placeholder 를 안내문으로 띄운다
  "[&_.is-empty::before]:pointer-events-none [&_.is-empty::before]:float-left [&_.is-empty::before]:h-0",
  "[&_.is-empty::before]:text-text-tertiary [&_.is-empty::before]:[content:attr(data-placeholder)]",
].join(" ");

export function TextEditor({
  defaultValue = "",
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
    content: defaultValue,
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
