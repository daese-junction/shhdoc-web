"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Suspense, useEffect, useId, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Checkbox, Input, Loading, Tooltip } from "@/components/common";
import { ApiError } from "@/api/client";
import { saveDraft } from "@/api/mail";
import { fetchMailDetail } from "@/mocks/mail";
import { useToastStore } from "@/stores/useToastStore";
import type { MailDetail } from "@/types/mail";
import { formatMailDateTime } from "@/utils/formatDate";
import { ROUTES, type ComposeMode } from "@/utils/routes";
import { AttachmentButton } from "./AttachmentButton";
import { AttachmentList } from "./AttachmentList";
import { RecipientInput } from "./RecipientInput";
import { TextEditor } from "./TextEditor";
import { useAttachmentReview } from "./useAttachmentReview";
import { useAttachments } from "./useAttachments";

/** Tiptap 은 내용을 모두 지워도 빈 문단(`<p></p>`)을 남기므로 태그를 걷어내고 판단한다 */
function isBlank(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}

interface ComposeDraft {
  recipients: string[];
  subject: string;
  body: string;
}

const EMPTY_DRAFT: ComposeDraft = { recipients: [], subject: "", body: "" };

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** 이미 `Re:` 가 붙은 제목에 또 붙이지 않는다 */
const withPrefix = (prefix: string, title: string) =>
  title.toLowerCase().startsWith(prefix.toLowerCase())
    ? title
    : `${prefix} ${title}`;

const addressText = ({ name, email }: { name: string; email: string }) =>
  `${name} <${email}>`;

function buildDraft(mode: ComposeMode, mail: MailDetail): ComposeDraft {
  // 본문은 이미 에디터가 만든 HTML 이라 그대로 인용한다
  if (mode === "reply") {
    return {
      recipients: [mail.sender.email],
      subject: withPrefix("Re:", mail.title),
      body: [
        "<p></p>",
        "<blockquote>",
        `<p>${escapeHtml(
          `${formatMailDateTime(mail.receivedAt)} ${addressText(mail.sender)} 님이 작성:`,
        )}</p>`,
        mail.body,
        "</blockquote>",
      ].join(""),
    };
  }

  return {
    recipients: [],
    subject: withPrefix("Fwd:", mail.title),
    body: [
      "<p></p>",
      "<hr>",
      "<p>---------- 전달된 메일 ----------</p>",
      `<p>${escapeHtml(`보낸사람: ${addressText(mail.sender)}`)}</p>`,
      `<p>${escapeHtml(
        `받는사람: ${mail.recipients.map(addressText).join(", ")}`,
      )}</p>`,
      `<p>${escapeHtml(`날짜: ${formatMailDateTime(mail.receivedAt)}`)}</p>`,
      `<p>${escapeHtml(`제목: ${mail.title}`)}</p>`,
      mail.body,
    ].join(""),
  };
}

export default function MailWritingPage() {
  // useSearchParams 는 프리렌더 시 경계가 필요하다
  return (
    <Suspense fallback={<Loading />}>
      <MailWriting />
    </Suspense>
  );
}

function MailWriting() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as ComposeMode | null;
  const sourceId = searchParams.get("id");
  const isPrefill =
    (mode === "reply" || mode === "forward") && Boolean(sourceId);

  const draftKey = `${mode ?? "new"}-${sourceId ?? ""}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    draft: ComposeDraft;
  } | null>(null);

  // 에디터가 비제어라 원문을 다 읽기 전에는 폼을 마운트하지 않는다.
  // 키가 다르면 이전 원문으로 만든 초안이므로 아직 없는 것으로 본다.
  const draft = isPrefill
    ? loaded?.key === draftKey
      ? loaded.draft
      : null
    : EMPTY_DRAFT;

  useEffect(() => {
    if (!isPrefill || !mode || !sourceId) return;

    let cancelled = false;
    void fetchMailDetail(sourceId).then((mail) => {
      if (cancelled) return;
      setLoaded({
        key: draftKey,
        draft: mail ? buildDraft(mode, mail) : EMPTY_DRAFT,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isPrefill, mode, sourceId, draftKey]);

  if (!draft) return <Loading />;

  // 원문이 바뀌면 폼과 에디터를 새로 마운트한다
  return <ComposeForm key={draftKey} draft={draft} />;
}

interface ComposeFormProps {
  draft: ComposeDraft;
}

function ComposeForm({ draft }: ComposeFormProps) {
  const router = useRouter();
  const showToast = useToastStore((state) => state.show);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [recipients, setRecipients] = useState<string[]>(draft.recipients);
  const [isIndividual, setIsIndividual] = useState(false);
  const [subject, setSubject] = useState(draft.subject);
  const [isImportant, setIsImportant] = useState(false);
  const [body, setBody] = useState(draft.body);
  const { attachments, totalSize, maxTotalSize, add, remove, clear } =
    useAttachments();
  const {
    status: reviewStatus,
    results: reviewResults,
    isReviewed,
    review,
  } = useAttachmentReview(attachments);

  const isReviewing = reviewStatus === "pending";
  // 검토를 마쳤는데 통과하지 못했다면 유출 불가 문서가 섞여 있다는 뜻이다
  const hasBlockedDocument = reviewStatus === "done" && !isReviewed;
  const hasAttachment = attachments.length > 0;
  const isEmptyBody = isBlank(body);
  const hasRequiredFields = recipients.length > 0 && Boolean(subject.trim());
  // 첨부가 없으면 검토할 문서도 없으므로 바로 보낼 수 있다
  const canSend =
    hasRequiredFields && !isEmptyBody && (!hasAttachment || isReviewed);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await saveDraft({
        recipients,
        individual: isIndividual,
        subject,
        important: isImportant,
        body,
        attachments: attachments.map(({ file }) => file),
      });

      showToast("임시보관함에 저장했습니다.", "success");
      // 임시보관함으로 넘어가면 이 화면은 언마운트되므로 로딩을 되돌리지 않는다
      router.push(ROUTES.mailDrafts);
    } catch (error) {
      // 서버가 사유를 내려줬다면 그대로 보여준다
      showToast(
        error instanceof ApiError
          ? error.message
          : "임시보관에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        "error",
      );
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">메일 쓰기</h1>

        <div className="flex items-center gap-2">
          <Tooltip title="첨부파일을 추가하는 경우 검토 후 메일 전송이 가능합니다">
            {/* 키보드 사용자도 볼 수 있게 버튼으로 둔다 — 포커스에도 말풍선이 뜬다 */}
            <button
              type="button"
              aria-label="검토 안내"
              className="flex size-6 items-center justify-center rounded-full text-text-tertiary transition-colors hover:text-text-primary"
            >
              <HelpOutlineRoundedIcon fontSize="small" />
            </button>
          </Tooltip>

          {/* 첨부 문서의 외부 유출 가능 여부를 서버에 물어본다 — 첨부가 있을 때만 필요하다 */}
          {hasAttachment && (
            <Button
              type="button"
              loading={isReviewing}
              disabled={isReviewed}
              onClick={review}
            >
              {isReviewing ? "검토 중…" : isReviewed ? "검토 완료" : "검토"}
            </Button>
          )}
        </div>
      </div>

      {hasBlockedDocument && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700"
        >
          <WarningAmberRoundedIcon fontSize="small" className="shrink-0" />
          <span>
            외부유출이 불가능한 문서가 포함되어있습니다. 문서 내용을 검토하거나
            관리자의 승인을 받아주세요
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg bg-surface-primary p-4">
        <ComposeField
          label="받는 사람"
          required
          optionLabel="개인별"
          optionChecked={isIndividual}
          onOptionChange={setIsIndividual}
        >
          {(inputId) => (
            <RecipientInput
              id={inputId}
              value={recipients}
              onChange={setRecipients}
              placeholder="이메일 주소를 입력하고 쉼표(,)를 누르세요"
              required
            />
          )}
        </ComposeField>

        <ComposeField
          label="제목"
          required
          optionLabel="중요"
          optionChecked={isImportant}
          onOptionChange={setIsImportant}
        >
          {(inputId) => (
            <Input
              id={inputId}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="제목을 입력하세요"
              required
              hideMessage
            />
          )}
        </ComposeField>
      </div>

      <TextEditor
        defaultValue={draft.body}
        placeholder="메일 내용을 입력하세요"
        characterLimit={10000}
        minHeightClass="min-h-96"
        onChange={setBody}
        toolbarExtra={<AttachmentButton onSelect={add} />}
        belowToolbar={
          <AttachmentList
            attachments={attachments}
            totalSize={totalSize}
            maxTotalSize={maxTotalSize}
            onRemove={remove}
            onClearAll={clear}
            reviewResults={reviewResults}
          />
        }
      />

      <div className="flex justify-end gap-2">
        {/* 발송 연동은 메일 API 작업에서 붙인다 (첨부파일도 함께 실어 보낸다) */}
        <Button
          type="button"
          variant="outline"
          loading={isSavingDraft}
          onClick={handleSaveDraft}
        >
          {isSavingDraft ? "저장 중…" : "임시저장"}
        </Button>
        <Button type="button" disabled={!canSend || isSavingDraft}>
          보내기
        </Button>
      </div>
    </div>
  );
}

interface ComposeFieldProps {
  label: string;
  /** 라벨에 빨간 * 를 붙인다 */
  required?: boolean;
  /** 라벨 옆에 붙는 옵션 체크박스 (개인별 / 중요) */
  optionLabel: string;
  optionChecked: boolean;
  onOptionChange: (checked: boolean) => void;
  /** 라벨이 가리킬 id 를 받아 입력 컨트롤을 그린다 */
  children: (inputId: string) => ReactNode;
}

/** 라벨 + 옵션 체크박스 + 입력창 한 줄. 좁은 화면에서는 위아래로 쌓인다. */
function ComposeField({
  label,
  required = false,
  optionLabel,
  optionChecked,
  onOptionChange,
  children,
}: ComposeFieldProps) {
  const inputId = useId();

  return (
    // 수신자 태그가 여러 줄로 늘어나도 라벨은 첫 줄에 맞춰 둔다
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3 sm:min-h-10 sm:w-44">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
          {required && (
            <span aria-hidden className="ml-0.5 text-red-500">
              *
            </span>
          )}
        </label>
        <Checkbox
          label={optionLabel}
          checked={optionChecked}
          onChange={(event) => onOptionChange(event.target.checked)}
        />
      </div>

      <div className="min-w-0 flex-1">{children(inputId)}</div>
    </div>
  );
}
