"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import Check from "@mui/icons-material/Check";
import CodeOutlined from "@mui/icons-material/CodeOutlined";
import DataObject from "@mui/icons-material/DataObject";
import FormatAlignCenter from "@mui/icons-material/FormatAlignCenter";
import FormatAlignJustify from "@mui/icons-material/FormatAlignJustify";
import FormatAlignLeft from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRight from "@mui/icons-material/FormatAlignRight";
import FormatBold from "@mui/icons-material/FormatBold";
import FormatItalic from "@mui/icons-material/FormatItalic";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import FormatQuote from "@mui/icons-material/FormatQuote";
import FormatStrikethrough from "@mui/icons-material/FormatStrikethrough";
import FormatUnderlined from "@mui/icons-material/FormatUnderlined";
import HorizontalRule from "@mui/icons-material/HorizontalRule";
import LinkOutlined from "@mui/icons-material/LinkOutlined";
import { Popover, Tooltip } from "@/components/common";
import { LinkDialog } from "./LinkDialog";

interface EditorToolbarProps {
  editor: Editor;
  /** 툴바 오른쪽 끝에 덧붙일 버튼. 앞의 구분선은 툴바가 넣는다. */
  extra?: ReactNode;
}

/** 0 은 일반 본문(문단). 나머지는 heading 레벨과 그대로 대응한다. */
const HEADING_OPTIONS = [
  { level: 0, label: "본문", previewClass: "text-sm", shortcut: "Ctrl+Alt+0" },
  {
    level: 1,
    label: "제목 1",
    previewClass: "text-xl font-semibold",
    shortcut: "Ctrl+Alt+1",
  },
  {
    level: 2,
    label: "제목 2",
    previewClass: "text-lg font-semibold",
    shortcut: "Ctrl+Alt+2",
  },
  {
    level: 3,
    label: "제목 3",
    previewClass: "text-base font-semibold",
    shortcut: "Ctrl+Alt+3",
  },
] as const;

type HeadingLevel = (typeof HEADING_OPTIONS)[number]["level"];

const ALIGNMENTS = [
  {
    value: "left",
    label: "왼쪽 정렬",
    description: "문단을 왼쪽 끝에 맞춥니다.",
    shortcut: "Ctrl+Shift+L",
    Icon: FormatAlignLeft,
  },
  {
    value: "center",
    label: "가운데 정렬",
    description: "문단을 가운데에 맞춥니다.",
    shortcut: "Ctrl+Shift+E",
    Icon: FormatAlignCenter,
  },
  {
    value: "right",
    label: "오른쪽 정렬",
    description: "문단을 오른쪽 끝에 맞춥니다.",
    shortcut: "Ctrl+Shift+R",
    Icon: FormatAlignRight,
  },
  {
    value: "justify",
    label: "양쪽 정렬",
    description: "줄 간격을 늘려 양쪽 끝을 맞춥니다.",
    shortcut: "Ctrl+Shift+J",
    Icon: FormatAlignJustify,
  },
] as const;

/** 본문은 수신자 메일함에서 그대로 렌더되므로 테마 토큰이 아닌 고정 색을 쓴다 */
const TEXT_COLORS = [
  { value: "#111827", label: "검정" },
  { value: "#6b7280", label: "회색" },
  { value: "#dc2626", label: "빨강" },
  { value: "#ea580c", label: "주황" },
  { value: "#ca8a04", label: "노랑" },
  { value: "#16a34a", label: "초록" },
  { value: "#2563eb", label: "파랑" },
  { value: "#7c3aed", label: "보라" },
] as const;

const HIGHLIGHT_COLORS = [
  { value: "#fef08a", label: "노랑 형광" },
  { value: "#fed7aa", label: "주황 형광" },
  { value: "#fecaca", label: "빨강 형광" },
  { value: "#bbf7d0", label: "초록 형광" },
  { value: "#bfdbfe", label: "파랑 형광" },
  { value: "#e9d5ff", label: "보라 형광" },
  { value: "#fbcfe8", label: "분홍 형광" },
  { value: "#e5e7eb", label: "회색 형광" },
] as const;

export function EditorToolbar({ editor, extra }: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // 트랜잭션마다 툴바 전체를 다시 그리지 않도록 필요한 상태만 골라 구독한다
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
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
      headingLevel: (HEADING_OPTIONS.find(
        ({ level }) => level !== 0 && instance.isActive("heading", { level }),
      )?.level ?? 0) as HeadingLevel,
      textColor:
        (instance.getAttributes("textStyle").color as string | undefined) ??
        null,
      highlightColor:
        (instance.getAttributes("textStyle").backgroundColor as
          string | undefined) ?? null,
      alignments: ALIGNMENTS.map(({ value }) =>
        instance.isActive({ textAlign: value }),
      ),
    }),
  });

  const applyHeading = (level: HeadingLevel) => {
    const chain = editor.chain().focus();
    if (level === 0) {
      chain.setParagraph().run();
    } else {
      chain.setHeading({ level }).run();
    }
  };

  const applyLink = (href: string) => {
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) {
      chain.setLink({ href }).run();
    } else {
      chain.unsetLink().run();
    }
    setLinkDialogOpen(false);
  };

  // 이미 링크 위라면 같은 버튼을 한 번 더 눌러 링크를 해제한다
  const toggleLink = () => {
    if (state.link) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    setLinkDialogOpen(true);
  };

  // 기본값(왼쪽)일 때도 isActive 가 true 라 첫 항목으로 떨어진다
  const alignIndex = Math.max(state.alignments.findIndex(Boolean), 0);
  const CurrentAlignIcon = ALIGNMENTS[alignIndex].Icon;

  const headingLabel =
    HEADING_OPTIONS.find(({ level }) => level === state.headingLevel)?.label ??
    "본문";

  return (
    <>
      <div
        role="toolbar"
        aria-label="본문 서식"
        className="flex flex-wrap items-center gap-0.5 border-b border-border-tertiary bg-surface-secondary px-2 py-1.5"
      >
        <ToolbarMenu
          label="문단 스타일"
          description="본문과 제목 단계를 고릅니다."
          active={state.headingLevel !== 0}
          triggerClassName="h-8 gap-0.5 px-2"
          trigger={
            <>
              <span className="text-xs font-medium">{headingLabel}</span>
              <ArrowDropDown fontSize="small" />
            </>
          }
        >
          {(close) => (
            <div role="menu" className="min-w-36 py-1">
              {HEADING_OPTIONS.map(
                ({ level, label, previewClass, shortcut }) => (
                  <MenuRow
                    key={level}
                    label={label}
                    shortcut={shortcut}
                    selected={state.headingLevel === level}
                    onClick={() => {
                      applyHeading(level);
                      close();
                    }}
                  >
                    <span className={previewClass}>{label}</span>
                  </MenuRow>
                ),
              )}
            </div>
          )}
        </ToolbarMenu>

        <Divider />

        <ToolbarButton
          label="굵게"
          description="선택한 글자를 굵게 씁니다."
          shortcut="Ctrl+B"
          active={state.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FormatBold fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="기울임"
          description="선택한 글자를 기울여 씁니다."
          shortcut="Ctrl+I"
          active={state.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FormatItalic fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="밑줄"
          description="선택한 글자에 밑줄을 긋습니다."
          shortcut="Ctrl+U"
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <FormatUnderlined fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="취소선"
          description="선택한 글자에 가로줄을 그어 지운 표시를 합니다."
          shortcut="Ctrl+Shift+S"
          active={state.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <FormatStrikethrough fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="인라인 코드"
          description="문장 속 짧은 코드를 코드체로 표시합니다."
          shortcut="Ctrl+E"
          active={state.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <CodeOutlined fontSize="small" />
        </ToolbarButton>

        <Divider />

        <ToolbarMenu
          label="글자 색"
          description="선택한 글자의 색을 바꿉니다."
          active={Boolean(state.textColor)}
          trigger={<TextColorTrigger color={state.textColor} />}
        >
          {(close) => (
            <ColorPalette
              colors={TEXT_COLORS}
              current={state.textColor}
              resetLabel="기본 색"
              onSelect={(color) => {
                editor.chain().focus().setColor(color).run();
                close();
              }}
              onReset={() => {
                editor.chain().focus().unsetColor().run();
                close();
              }}
            />
          )}
        </ToolbarMenu>
        <ToolbarMenu
          label="형광펜"
          description="선택한 글자에 배경색을 칠합니다."
          active={Boolean(state.highlightColor)}
          trigger={<HighlightTrigger color={state.highlightColor} />}
        >
          {(close) => (
            <ColorPalette
              colors={HIGHLIGHT_COLORS}
              current={state.highlightColor}
              resetLabel="형광펜 지우기"
              onSelect={(color) => {
                editor.chain().focus().setBackgroundColor(color).run();
                close();
              }}
              onReset={() => {
                editor.chain().focus().unsetBackgroundColor().run();
                close();
              }}
            />
          )}
        </ToolbarMenu>

        <Divider />

        <ToolbarButton
          label="글머리 기호 목록"
          description="점으로 시작하는 목록을 만듭니다."
          shortcut="Ctrl+Shift+8"
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FormatListBulleted fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="번호 매기기 목록"
          description="1, 2, 3 순서가 붙는 목록을 만듭니다."
          shortcut="Ctrl+Shift+7"
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FormatListNumbered fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="인용구"
          description="왼쪽에 세로선이 붙는 인용 문단으로 바꿉니다."
          shortcut="Ctrl+Shift+B"
          active={state.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <FormatQuote fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="코드 블록"
          description="여러 줄 코드를 그대로 보여주는 블록을 만듭니다."
          shortcut="Ctrl+Alt+C"
          active={state.codeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <DataObject fontSize="small" />
        </ToolbarButton>
        <ToolbarButton
          label="구분선"
          description="내용을 나누는 가로선을 넣습니다."
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <HorizontalRule fontSize="small" />
        </ToolbarButton>

        <Divider />

        {/* lg 이상에서는 4개를 그대로 펼치고, md 이하에서는 드롭다운 하나로 접는다 */}
        <span className="hidden items-center gap-0.5 lg:flex">
          {ALIGNMENTS.map(
            ({ value, label, description, shortcut, Icon }, index) => (
              <ToolbarButton
                key={value}
                label={label}
                description={description}
                shortcut={shortcut}
                active={state.alignments[index]}
                onClick={() => editor.chain().focus().setTextAlign(value).run()}
              >
                <Icon fontSize="small" />
              </ToolbarButton>
            ),
          )}
        </span>

        <span className="inline-flex lg:hidden">
          <ToolbarMenu
            label="본문 정렬"
            description="문단을 어느 쪽에 맞출지 고릅니다."
            active={alignIndex !== 0}
            triggerClassName="h-8 gap-0.5 px-1.5"
            trigger={
              <>
                <CurrentAlignIcon fontSize="small" />
                <ArrowDropDown fontSize="small" />
              </>
            }
          >
            {(close) => (
              <div role="menu" className="min-w-36 py-1">
                {ALIGNMENTS.map(({ value, label, shortcut, Icon }, index) => (
                  <MenuRow
                    key={value}
                    label={label}
                    shortcut={shortcut}
                    selected={state.alignments[index]}
                    onClick={() => {
                      editor.chain().focus().setTextAlign(value).run();
                      close();
                    }}
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Icon fontSize="small" />
                      {label}
                    </span>
                  </MenuRow>
                ))}
              </div>
            )}
          </ToolbarMenu>
        </span>

        <Divider />

        <ToolbarButton
          label={state.link ? "링크 해제" : "링크"}
          description={
            state.link
              ? "이 글자에 걸린 링크를 지웁니다."
              : "선택한 글자에 링크를 겁니다."
          }
          active={state.link}
          onClick={toggleLink}
        >
          <LinkOutlined fontSize="small" />
        </ToolbarButton>

        {extra && (
          <>
            <Divider />
            {extra}
          </>
        )}
      </div>

      <LinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onSubmit={applyLink}
      />
    </>
  );
}

const TRIGGER_BASE =
  "flex items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const TRIGGER_ACTIVE = "bg-brand-50 text-brand-500";
const TRIGGER_IDLE =
  "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary";

function triggerClass(active: boolean | undefined, size: string) {
  return `${TRIGGER_BASE} ${size} ${active ? TRIGGER_ACTIVE : TRIGGER_IDLE}`;
}

interface ToolbarHint {
  /** 툴팁 첫 줄이자 스크린리더가 읽는 이름 */
  label: string;
  /** 툴팁에서 기능을 한 줄로 설명한다 */
  description?: string;
  /** 툴팁 오른쪽에 회색으로 붙는 단축키 */
  shortcut?: string;
}

/** 이름 + 설명 + 단축키를 한 덩어리로 보여주는 툴팁 내용 */
function HintContent({ label, description, shortcut }: ToolbarHint) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        {shortcut && (
          <span className="shrink-0 text-text-tertiary">{shortcut}</span>
        )}
      </span>
      {description && (
        <span className="text-text-secondary">{description}</span>
      )}
    </span>
  );
}

export interface ToolbarButtonProps extends ToolbarHint {
  /** 토글 버튼일 때만 넘긴다. 넘기지 않으면 aria-pressed 를 붙이지 않는다. */
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function ToolbarButton({
  label,
  description,
  shortcut,
  active,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip
      title={
        <HintContent
          label={label}
          description={description}
          shortcut={shortcut}
        />
      }
    >
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        // 버튼을 누를 때 본문 선택 영역이 풀리지 않도록 기본 동작을 막는다
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        className={triggerClass(active, "h-8 w-8")}
      >
        {children}
      </button>
    </Tooltip>
  );
}

interface ToolbarMenuProps extends ToolbarHint {
  active?: boolean;
  trigger: ReactNode;
  /** 팝오버 내용. 항목을 고른 뒤 닫을 수 있도록 close 를 받는다. */
  children: (close: () => void) => ReactNode;
  /** 트리거 버튼의 크기/여백 클래스 */
  triggerClassName?: string;
}

/** 툴바 안에서 팝오버를 여는 드롭다운 버튼 */
function ToolbarMenu({
  label,
  description,
  shortcut,
  active,
  trigger,
  children,
  triggerClassName = "h-8 w-8",
}: ToolbarMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const close = () => setAnchorEl(null);

  return (
    <>
      <Tooltip
        title={
          <HintContent
            label={label}
            description={description}
            shortcut={shortcut}
          />
        }
      >
        <button
          type="button"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl)}
          // 팝오버를 여는 동안에도 본문 선택 영역을 유지한다
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event: MouseEvent<HTMLButtonElement>) =>
            setAnchorEl(event.currentTarget)
          }
          className={triggerClass(active, triggerClassName)}
        >
          {trigger}
        </button>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={close}
        ariaLabel={label}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {children(close)}
      </Popover>
    </>
  );
}

interface MenuRowProps {
  label: string;
  /** 항목 오른쪽에 회색으로 붙는 단축키 */
  shortcut?: string;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

function MenuRow({
  label,
  shortcut,
  selected,
  onClick,
  children,
}: MenuRowProps) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left transition-colors hover:bg-surface-tertiary ${
        selected ? "text-brand-500" : "text-text-primary"
      }`}
    >
      {children}
      <span className="flex shrink-0 items-center gap-1.5">
        {shortcut && (
          <span className="text-xs text-text-tertiary">{shortcut}</span>
        )}
        {selected && <Check fontSize="small" />}
      </span>
    </button>
  );
}

interface SwatchTriggerProps {
  /** 현재 적용된 색. 없으면 버튼 글자색을 그대로 쓴다. */
  color: string | null;
}

/** 글자 아래에 현재 색 밑줄을 하나만 긋는 트리거 */
function TextColorTrigger({ color }: SwatchTriggerProps) {
  return (
    <span aria-hidden className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-semibold leading-none">A</span>
      <span
        className="h-[3px] w-4 rounded-full"
        style={{ backgroundColor: color ?? "currentColor" }}
      />
    </span>
  );
}

/** 현재 형광펜 색으로 글자를 테두리로 감싼 트리거 */
function HighlightTrigger({ color }: SwatchTriggerProps) {
  return (
    <span
      aria-hidden
      className="flex h-5 w-5 items-center justify-center rounded-sm border-2 text-[11px] font-semibold leading-none"
      style={{ borderColor: color ?? "currentColor" }}
    >
      A
    </span>
  );
}

interface ColorPaletteProps {
  colors: readonly { value: string; label: string }[];
  current: string | null;
  resetLabel: string;
  onSelect: (color: string) => void;
  onReset: () => void;
}

function ColorPalette({
  colors,
  current,
  resetLabel,
  onSelect,
  onReset,
}: ColorPaletteProps) {
  const normalized = current?.toLowerCase() ?? null;

  return (
    <div className="p-2">
      <div className="grid grid-cols-4 gap-1">
        {colors.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={normalized === value}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(value)}
            style={{ backgroundColor: value }}
            className={`h-6 w-6 rounded transition-transform hover:scale-110 ${
              normalized === value
                ? "outline-2 outline-offset-1 outline-brand-500"
                : "outline-1 outline-border-secondary"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onReset}
        className="mt-2 w-full rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
      >
        {resetLabel}
      </button>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border-primary" />;
}
