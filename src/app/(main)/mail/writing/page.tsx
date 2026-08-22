"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Suspense, useEffect, useId, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Checkbox, Input, Loading, Tooltip } from "@/components/common";
import { sanitizeMailBody } from "@/components/mail";
import { getErrorMessage } from "@/api/axios";
import {
  createDraft,
  fetchEmailDetail,
  isEmailId,
  sendEmail,
  toMailDetail,
  toRecipients,
  updateDraft,
} from "@/api/emails";
import { fetchMailDetail } from "@/mocks/mail";
import { useToastStore } from "@/stores/useToastStore";
import type { EmailPayload, MailDetail } from "@/types/mail";
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
  // 인용한 원문이 그대로 다시 서버로 올라가므로 여기서도 한 번 걸러 둔다
  const source = sanitizeMailBody(mail.body);

  // 이어서 고치는 초안은 인용 없이 원문 그대로를 채운다
  if (mode === "edit") {
    return {
      recipients: mail.recipients.map((recipient) => recipient.email),
      subject: mail.title,
      body: source,
    };
  }

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
        source,
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
      source,
    ].join(""),
  };
}

/** 원문 조회. 서버 메일이면 GET /emails/{id}, 아니면 목 데이터를 읽는다. */
function loadSource(id: string): Promise<MailDetail | null> {
  return isEmailId(id)
    ? fetchEmailDetail(Number(id)).then(toMailDetail)
    : fetchMailDetail(id);
}

export default function MailWritingPage() {
  // useSearchParams 는 프리렌더 시 경계가 필요하다
  return (
    <Suspense fallback={<Loading />}>
      <MailWriting />
    </Suspense>
  );
}

interface LoadedDraft {
  key: string;
  draft: ComposeDraft;
  /** 저장된 초안을 고치는 중이면 그 id. 원문을 못 읽었으면 비운다. */
  editingId?: number;
}

function MailWriting() {
  const searchParams = useSearchParams();
  const showToast = useToastStore((state) => state.show);
  const mode = searchParams.get("mode") as ComposeMode | null;
  const sourceId = searchParams.get("id");
  const isPrefill =
    (mode === "reply" || mode === "forward" || mode === "edit") &&
    Boolean(sourceId);

  const draftKey = `${mode ?? "new"}-${sourceId ?? ""}`;
  const [loaded, setLoaded] = useState<LoadedDraft | null>(null);

  // 에디터가 비제어라 원문을 다 읽기 전에는 폼을 마운트하지 않는다.
  // 키가 다르면 이전 원문으로 만든 초안이므로 아직 없는 것으로 본다.
  const current = loaded?.key === draftKey ? loaded : null;
  const draft = isPrefill ? (current?.draft ?? null) : EMPTY_DRAFT;

  useEffect(() => {
    if (!isPrefill || !mode || !sourceId) return;

    let cancelled = false;

    void loadSource(sourceId)
      .then((mail) => {
        if (cancelled) return;
        setLoaded({
          key: draftKey,
          draft: mail ? buildDraft(mode, mail) : EMPTY_DRAFT,
          // 원문을 못 읽었다면 수정 대상이 없으므로 새 메일로 취급한다
          editingId: mail && mode === "edit" ? Number(sourceId) : undefined,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        // 원문이 없어도 빈 화면에 갇히지 않도록 새 메일로 열어 준다
        setLoaded({ key: draftKey, draft: EMPTY_DRAFT });
        const message = getErrorMessage(error, {}, "원문을 불러오지 못했습니다.");
        if (message) showToast(message, "error");
      });

    return () => {
      cancelled = true;
    };
  }, [isPrefill, mode, sourceId, draftKey, showToast]);

  if (!draft) return <Loading />;

  // 원문이 바뀌면 폼과 에디터를 새로 마운트한다
  return (
    <ComposeForm key={draftKey} draft={draft} editingId={current?.editingId} />
  );
}

interface ComposeFormProps {
  draft: ComposeDraft;
  /** 저장된 초안을 고치는 중이면 그 id. 없으면 새 메일이다. */
  editingId?: number;
}

function ComposeForm({ draft, editingId }: ComposeFormProps) {
  const router = useRouter();
  const showToast = useToastStore((state) => state.show);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSending, setIsSending] = useState(false);
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
  // 첨부가 없으면 검토가 자동으로 통과 처리되므로 바로 보낼 수 있다
  const canSend = hasRequiredFields && !isEmptyBody && isReviewed;
  const isBusy = isSavingDraft || isSending;

  // 개인별·중요·첨부는 초안 생성 스펙(POST /emails)에 없어 아직 보내지 않는다
  const buildPayload = (): EmailPayload => ({
    subject,
    body,
    recipients: toRecipients(recipients),
  });

  /** 네트워크 오류는 인터셉터가 이미 토스트로 알렸으므로 빈 메시지면 넘어간다 */
  const toastError = (error: unknown, fallback: string) => {
    const message = getErrorMessage(error, {}, fallback);
    if (message) showToast(message, "error");
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // 초안은 수신자가 없어도 저장된다 — 한 명 이상이어야 하는 건 발송 시점이다.
      if (editingId) await updateDraft(editingId, buildPayload());
      else await createDraft(buildPayload());

      showToast("임시보관함에 저장했습니다.", "success");
      // 임시보관함으로 넘어가면 이 화면은 언마운트되므로 로딩을 되돌리지 않는다
      router.push(ROUTES.mailDrafts);
    } catch (error) {
      toastError(error, "임시보관에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setIsSavingDraft(false);
    }
  };

  /** 발송은 저장된 메일에만 가능하다 — 먼저 저장하고 그 id 로 보낸다. */
  const handleSend = async () => {
    setIsSending(true);
    try {
      const payload = buildPayload();
      let targetId = editingId;

      if (targetId) await updateDraft(targetId, payload);
      else targetId = (await createDraft(payload)).id;

      const sent = await sendEmail(targetId);
      // 결재가 필요하면 곧바로 SENT 가 되지 않고 BLOCKED(승인 대기)로 떨어진다
      const isDelivered = sent.status === "SENT";
      const message = isDelivered
        ? "메일을 발송했습니다."
        : "발송 승인을 요청했습니다. 관리자 승인 후 발송됩니다.";

      router.push(isDelivered ? ROUTES.mailSent : ROUTES.mailPending);
      showToast(
        // 첨부 업로드 스펙이 아직 없어 파일은 함께 올라가지 않는다
        hasAttachment
          ? `${message} 첨부파일은 아직 함께 전송되지 않습니다.`
          : message,
        "success",
      );
    } catch (error) {
      toastError(error, "발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text-primary">
          {editingId ? "초안 수정" : "메일 쓰기"}
        </h1>

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
        <Button
          type="button"
          variant="outline"
          loading={isSavingDraft}
          disabled={isSending}
          onClick={handleSaveDraft}
        >
          {isSavingDraft ? "저장 중…" : "임시저장"}
        </Button>
        <Button
          type="button"
          loading={isSending}
          disabled={!canSend || isBusy}
          onClick={handleSend}
        >
          {isSending ? "보내는 중…" : "보내기"}
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
