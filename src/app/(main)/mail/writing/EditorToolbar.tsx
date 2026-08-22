"use client";

import { useState, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import CodeOutlined from "@mui/icons-material/CodeOutlined";
import DataObject from "@mui/icons-material/DataObject";
import FormatAlignCenter from "@mui/icons-material/FormatAlignCenter";
import FormatAlignJustify from "@mui/icons-material/FormatAlignJustify";
import FormatAlignLeft from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRight from "@mui/icons-material/FormatAlignRight";
import FormatBold from "@mui/icons-material/FormatBold";
import FormatClear from "@mui/icons-material/FormatClear";
import FormatItalic from "@mui/icons-material/FormatItalic";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import FormatQuote from "@mui/icons-material/FormatQuote";
import FormatStrikethrough from "@mui/icons-material/FormatStrikethrough";
import FormatUnderlined from "@mui/icons-material/FormatUnderlined";
import HorizontalRule from "@mui/icons-material/HorizontalRule";
import LinkOff from "@mui/icons-material/LinkOff";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import Redo from "@mui/icons-material/Redo";
import Undo from "@mui/icons-material/Undo";
import { LinkDialog } from "./LinkDialog";

interface EditorToolbarProps {
  editor: Editor;
}

const HEADING_LEVELS = [1, 2, 3] as const;

const ALIGNMENTS = [
  { value: "left", label: "왼쪽 정렬", Icon: FormatAlignLeft },
  { value: "center", label: "가운데 정렬", Icon: FormatAlignCenter },
  { value: "right", label: "오른쪽 정렬", Icon: FormatAlignRight },
  { value: "justify", label: "양쪽 정렬", Icon: FormatAlignJustify },
] as const;

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // 트랜잭션마다 툴바 전체를 다시 그리지 않도록 필요한 상태만 골라 구독한다
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      canUndo: instance.can().undo(),
      canRedo: instance.can().redo(),
      bold: instance.isActive("bold"),
      italic: instance.isActive("italic"),
      underline: instance.isActive("underline"),
      strike: instance.isActive("strike"),
      code: instance.isActive("code"),
      codeBlock: instance.isActive("codeBlock"),
      bulletList: instance.isActive("bulletList"),
      orderedList: instance.isActive("orderedList"),
      blockquote: instance.isActive("blockquote"),
      link: instance.isActive("link"),
      linkHref: (instance.getAttributes("link").href as string) ?? "",
      headings: HEADING_LEVELS.map((level) =>
        instance.isActive("heading", { level }),
      ),
      alignments: ALIGNMENTS.map(({ value }) =>
        instance.isActive({ textAlign: value }),
      ),
    }),
  });

  const applyLink = (href: string) => {
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) {
      chain.setLink({ href }).run();
    } else {
      chain.unsetLink().run();
    }
    setLinkDialogOpen(false);
  };

  return (
    <>
      <div
        role="toolbar"
        aria-label="본문 서식"
        className="flex flex-wrap items-center gap-0.5 border-b border-border-tertiary bg-surface-secondary px-2 py-1.5"
      >
        <ToolbarButton
          label="실행 취소"
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="다시 실행"
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo fontSize="small" />
        </ToolbarButton>

        <Divider />

        {HEADING_LEVELS.map((level, index) => (
          <ToolbarButton
            key={level}
            label={`제목 ${level}`}
            active={state.headings[index]}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          >
            <span className="text-xs font-semibold">H{level}</span>
          </ToolbarButton>
        ))}

        <Divider />

        <ToolbarButton
          label="굵게"
          active={state.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FormatBold fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="기울임"
          active={state.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FormatItalic fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="밑줄"
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <FormatUnderlined fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="취소선"
          active={state.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <FormatStrikethrough fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="인라인 코드"
          active={state.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <CodeOutlined fontSize="small" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="글머리 기호 목록"
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FormatListBulleted fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="번호 매기기 목록"
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FormatListNumbered fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="인용구"
          active={state.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <FormatQuote fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="코드 블록"
          active={state.codeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <DataObject fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="구분선"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <HorizontalRule fontSize="small" />
        </ToolbarButton>

        <Divider />

        {ALIGNMENTS.map(({ value, label, Icon }, index) => (
          <ToolbarButton
            key={value}
            label={label}
            active={state.alignments[index]}
            onClick={() => editor.chain().focus().setTextAlign(value).run()}
          >
            <Icon fontSize="small" />
          </ToolbarButton>
        ))}

        <Divider />

        <ToolbarButton
          label="링크"
          active={state.link}
          onClick={() => setLinkDialogOpen(true)}
        >
          <LinkOutlined fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="링크 해제"
          disabled={!state.link}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <LinkOff fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="서식 지우기"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <FormatClear fontSize="small" />
        </ToolbarButton>
      </div>

      <LinkDialog
        open={linkDialogOpen}
        defaultUrl={state.linkHref}
        onClose={() => setLinkDialogOpen(false)}
        onSubmit={applyLink}
      />
    </>
  );
}

interface ToolbarButtonProps {
  label: string;
  /** 토글 버튼일 때만 넘긴다. 넘기지 않으면 aria-pressed 를 붙이지 않는다. */
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ToolbarButton({
  label,
  active,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // 버튼을 누를 때 본문 선택 영역이 풀리지 않도록 기본 동작을 막는다
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-brand-50 text-brand-500"
          : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border-primary" />;
}
