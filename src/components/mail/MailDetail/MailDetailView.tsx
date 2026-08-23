"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import ForwardOutlined from "@mui/icons-material/ForwardOutlined";
import ReplyOutlined from "@mui/icons-material/ReplyOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Button, ConfirmModal, EmptyState, Loading } from "@/components/common";
import {
  attachmentBlockReason,
  isBlockedAttachment,
  type MailAttachment,
} from "@/api/attachments";
import { getErrorMessage, getErrorStatus } from "@/api/axios";
import {
  deleteDraft,
  fetchEmailDetail,
  isEmailId,
  loadMailAttachments,
  loadMailReview,
  toMailDetail,
} from "@/api/emails";
import { loadMemberDirectory } from "@/api/members";
import {
  fetchMailDetail,
  markMailAsRead,
  moveMailToTrash,
  permanentlyDeleteMail,
  restoreMail,
} from "@/mocks/mail";
import { useToastStore } from "@/stores/useToastStore";
import type { MailAddress, MailDetail } from "@/types/mail";
import { formatFullDateTime } from "@/utils/formatDate";
import {
  getMailComposeRoute,
  getMailFolderRoute,
  ROUTES,
  type ComposeMode,
} from "@/utils/routes";
import { MAIL_BODY_CLASS, sanitizeMailBody } from "../mailBody";
import { MAIL_FOLDER_META } from "../mailFolders";
import { getMailBadgeStatus } from "../mailStatus";
import { MailStatusBadge } from "../MailStatusBadge";
import { MailAttachmentList } from "./MailAttachmentList";
import { MailProgressSteps } from "./MailProgressSteps";

const TOAST_DURATION = 3000;
const UNDO_TOAST_DURATION = 6000;
/** 받는 사람이 많으면 앞의 몇 명만 펼쳐 둔다 */
const VISIBLE_RECIPIENTS = 2;

type ConfirmMode = "delete" | "permanentDelete" | null;

interface MailDetailViewProps {
  id: string;
}

/** 메일 한 통을 보여주는 상세 화면. `/mail/view/<id>` 페이지가 이 컴포넌트만 렌더한다. */
export function MailDetailView({ id }: MailDetailViewProps) {
  const router = useRouter();
  const showToast = useToastStore((state) => state.show);

  const [mail, setMail] = useState<MailDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  /**
   * 첨부와 그 조회 결과. 어느 메일 것인지를 함께 들고 있어야
   * 다른 메일로 넘어간 직후 앞선 메일의 첨부가 남아 보이지 않는다.
   * `failed` 는 빈 목록과 구분하기 위한 것이다 — 실패를 삼키면 "첨부 없음" 으로 읽힌다.
   */
  const [attachmentState, setAttachmentState] = useState<{
    id: string;
    files: MailAttachment[];
    failed: boolean;
  }>({ id, files: [], failed: false });
  // 열어본 메일은 한 번만 읽음으로 넘긴다
  const readMarkedRef = useRef<string | null>(null);

  // 서버 메일이면 GET /emails/{id}, 목 메일이면 지금까지 쓰던 목 조회를 쓴다
  const isEmail = isEmailId(id);

  /** 네트워크 오류는 인터셉터가 이미 토스트로 알렸으므로 빈 메시지면 넘어간다 */
  const toastError = useCallback(
    (error: unknown, fallback: string) => {
      const message = getErrorMessage(error, {}, fallback);
      if (message) showToast(message, "error");
    },
    [showToast],
  );

  useEffect(() => {
    let cancelled = false;

    // 서버 메일은 주소만 내려온다 — 이름을 채울 구성원 표를 함께 받는다.
    // 표는 실패해도 비어서 돌아오므로 이름만 빠질 뿐 상세는 그대로 뜬다.
    const load = isEmail
      ? Promise.all([
          fetchEmailDetail(Number(id)),
          loadMemberDirectory(),
        ]).then(([detail, directory]) => toMailDetail(detail, directory))
      : fetchMailDetail(id);

    void load
      .then((result) => {
        if (cancelled) return;

        setMail(result);
        setIsLoading(false);

        if (result && !result.isRead && readMarkedRef.current !== result.id) {
          readMarkedRef.current = result.id;
          void markMailAsRead(result.id);
        }

        // 상세 응답에는 첨부가 없어 따로 읽는다.
        // 목 메일에는 첨부 API 가 없으므로 서버 메일에서만 묻는다.
        if (!isEmail) return;

        // 상태와 무관하게 첨부는 다 보여준다 — 초안이든 발송완료든 무엇을 붙였는지
        // 확인할 수 있어야 한다. 아래 검토 단계 조회와 같은 응답을 나눠 쓴다.
        void loadMailAttachments(Number(id))
          .then((files) => {
            if (!cancelled) setAttachmentState({ id, files, failed: false });
          })
          .catch(() => {
            if (!cancelled)
              setAttachmentState({ id, files: [], failed: true });
          });

        // 검토 단계는 승인 대기 메일에만 있다.
        // 못 받아도 상세는 그대로 뜨고 알약만 "승인 대기중" 으로 남는다.
        if (result?.status !== "BLOCKED") return;

        void loadMailReview(Number(id))
          .then((review) => {
            if (cancelled) return;
            setMail((current) =>
              current === null
                ? current
                : { ...current, reviewStage: review.stage, reviewReason: review.reason },
            );
          })
          .catch(() => undefined);
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        setMail(null);
        setIsLoading(false);
        // 404 는 아래 "메일을 찾을 수 없습니다" 화면이 대신 알려준다
        if (getErrorStatus(error) === 404) return;
        toastError(error, "메일을 불러오지 못했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEmail, toastError]);

  const goToFolder = (target: MailDetail) =>
    router.replace(getMailFolderRoute(target.folder));

  const goBack = () => {
    // 링크로 바로 들어온 경우에는 돌아갈 곳이 없다
    if (window.history.length > 1) router.back();
    else if (mail) router.replace(getMailFolderRoute(mail.folder));
  };

  const compose = (mode: ComposeMode) => {
    if (mail) router.push(getMailComposeRoute(mode, mail.id));
  };

  const handleDelete = async () => {
    if (!mail) return;
    setConfirmMode(null);

    // 서버 초안 삭제는 복구 수단이 없어 되돌리기 액션을 붙이지 않는다
    if (isEmail) {
      try {
        await deleteDraft(Number(mail.id));
      } catch (error) {
        toastError(error, "초안을 삭제하지 못했습니다.");
        return;
      }

      router.replace(ROUTES.mailDrafts);
      showToast("초안을 삭제했습니다.", {
        type: "success",
        duration: TOAST_DURATION,
      });
      return;
    }

    await moveMailToTrash(mail.id);
    goToFolder(mail);
    showToast("메일을 삭제했습니다.", {
      type: "success",
      duration: UNDO_TOAST_DURATION,
      action: {
        label: "되돌리기",
        onClick: () => {
          void restoreMail(mail.id).then(() =>
            showToast("삭제를 되돌렸습니다.", {
              type: "info",
              duration: TOAST_DURATION,
            }),
          );
        },
      },
    });
  };

  // 완전 삭제는 복구할 수 없으므로 되돌리기 액션을 제공하지 않는다
  const handlePermanentDelete = async () => {
    if (!mail) return;
    setConfirmMode(null);

    await permanentlyDeleteMail(mail.id);
    goToFolder(mail);
    showToast("메일을 완전히 삭제했습니다.", {
      type: "success",
      duration: TOAST_DURATION,
    });
  };

  const handleRestore = async () => {
    if (!mail) return;

    await restoreMail(mail.id);
    goToFolder(mail);
    showToast("메일을 복구했습니다.", {
      type: "success",
      duration: TOAST_DURATION,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
        <Loading />
      </div>
    );
  }

  if (!mail) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <EmptyState
          title="메일을 찾을 수 없습니다"
          description="이미 삭제되었거나 접근할 수 없는 메일입니다."
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={goBack}>
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  // 지금 보고 있는 메일 것일 때만 쓴다 — 조회가 끝나기 전에는 빈 목록으로 둔다
  const isAttachmentsReady = attachmentState.id === id;
  const attachments = isAttachmentsReady ? attachmentState.files : [];
  const attachmentsFailed = isAttachmentsReady && attachmentState.failed;

  const isTrash = mail.folder === "trash";
  const isDraft = mail.status === "DRAFT";
  const badgeStatus = getMailBadgeStatus(mail);
  // 반려 사유는 서버가 reviewNote 로 내려준다
  const rejectedNote = mail.status === "REJECTED" ? mail.reviewNote : null;
  // 검토에서 걸린 문서. 한 건만 알리면 나머지는 손대지 못한 채 고쳐 보내도 또 막힌다.
  const restrictedFiles =
    mail.reviewStage === "DOC_RESTRICTED"
      ? attachments.filter(isBlockedAttachment)
      : [];
  // 첨부를 못 받아온 경우 — 목록에서 받아 둔 한 줄 요약으로 물러난다
  const restrictedNote =
    mail.reviewStage === "DOC_RESTRICTED" && restrictedFiles.length === 0
      ? mail.reviewReason
      : null;
  // 발송까지 가는 길 위에 있는 메일만 단계 표시를 붙인다
  const isInPipeline = mail.status === "BLOCKED" || mail.status === "REJECTED";
  // 스펙상 DELETE 는 초안 전용이라 이미 보낸 메일에는 삭제를 내주지 않는다
  const canDelete = isEmail ? isDraft : !isTrash;
  // 서버 메일은 내가 쓴 것이라 답장할 상대가 없다
  const canReply = !isEmail;
  const isPermanent = confirmMode === "permanentDelete";
  // 초안 삭제도 되돌릴 수 없으므로 완전 삭제와 같은 문구를 쓴다
  const isDestructive = isPermanent || (confirmMode === "delete" && isEmail);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      {/* 액션바 — 좌: 뒤로가기·폴더·상태 / 우: 수정·답장·전달·삭제 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          iconOnly
          aria-label="목록으로"
          onClick={goBack}
        >
          <ArrowBackOutlined fontSize="small" />
        </Button>
        <span className="rounded-full bg-surface-tertiary px-2.5 py-1 text-xs text-text-secondary">
          {MAIL_FOLDER_META[mail.folder].label}
        </span>
        {badgeStatus && (
          <MailStatusBadge
            status={badgeStatus}
            title={mail.reviewReason}
          />
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {isEmail && isDraft && (
            <Button variant="outline" size="sm" onClick={() => compose("edit")}>
              <EditOutlined fontSize="small" />
              수정
            </Button>
          )}
          {canReply && (
            <Button variant="outline" size="sm" onClick={() => compose("reply")}>
              <ReplyOutlined fontSize="small" />
              답장
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => compose("forward")}>
            <ForwardOutlined fontSize="small" />
            전달
          </Button>
          {isTrash ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRestore()}
              >
                복구
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-error"
                onClick={() => setConfirmMode("permanentDelete")}
              >
                완전 삭제
              </Button>
            </>
          ) : (
            canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmMode("delete")}
              >
                삭제
              </Button>
            )
          )}
        </div>
      </div>

      {isInPipeline && (
        <MailProgressSteps
          isRejected={mail.status === "REJECTED"}
          reviewStage={mail.reviewStage}
        />
      )}

      {(restrictedFiles.length > 0 || restrictedNote) && (
        // 반려가 아니라 승인이 안 난 단계라, 상태 뱃지와 같은 warning 계열로 둔다.
        // 붉은 배너는 아래 반려 사유 하나만 쓴다.
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning"
        >
          <WarningAmberRoundedIcon
            fontSize="small"
            className="mt-0.5 shrink-0"
          />
          <div className="min-w-0">
            <strong className="font-medium">
              승인 대기
              {restrictedFiles.length > 0 &&
                ` — 검토에서 걸린 문서 ${restrictedFiles.length}건`}
            </strong>
            {restrictedFiles.length > 0 ? (
              <ul className="mt-1 flex flex-col gap-0.5">
                {restrictedFiles.map((attachment) => (
                  <li key={attachment.id} className="break-words">
                    <span className="font-medium">{attachment.filename}</span> —{" "}
                    {attachmentBlockReason(attachment)}
                  </li>
                ))}
              </ul>
            ) : (
              // 사유가 파일마다 한 줄씩 담겨 오므로 줄바꿈을 살려 그린다
              <p className="mt-1 whitespace-pre-line break-words">
                {restrictedNote}
              </p>
            )}
          </div>
        </div>
      )}

      {rejectedNote && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700"
        >
          <WarningAmberRoundedIcon
            fontSize="small"
            className="mt-0.5 shrink-0"
          />
          <span>
            <strong className="font-medium">반려 사유</strong> — {rejectedNote}
          </span>
        </div>
      )}

      <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border-tertiary bg-surface-primary">
        <header className="shrink-0 border-b border-border-tertiary px-6 py-4">
          <h1 className="text-lg font-semibold break-words text-text-primary">
            {mail.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
            {/* 이름을 모르는 주소는 주소가 이름 자리를 대신한다 — 같은 값을 두 번 쓰지 않는다 */}
            <span className="font-medium text-text-primary">
              {mail.sender.name || mail.sender.email}
            </span>
            {mail.sender.name && (
              <span className="text-text-tertiary">{mail.sender.email}</span>
            )}
            <time
              dateTime={mail.receivedAt}
              className="ml-auto text-xs whitespace-nowrap text-text-tertiary"
            >
              {formatFullDateTime(mail.receivedAt)}
            </time>
          </div>

          <RecipientLine recipients={mail.recipients} />
        </header>

        {/*
          본문은 HTML 이라 그대로 넣으면 스크립트가 실행된다.
          작성자가 API 로 직접 밀어 넣을 수 있는 값이므로 반드시 정제한 뒤 그린다.
        */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed break-words text-text-primary ${MAIL_BODY_CLASS}`}
          dangerouslySetInnerHTML={{ __html: sanitizeMailBody(mail.body) }}
        />

        {/* 목 메일에는 첨부 API 가 없어 서버 메일에서만 그린다 */}
        {isEmail && (
          <MailAttachmentList
            files={attachments}
            failed={attachmentsFailed}
          />
        )}
      </article>

      <ConfirmModal
        open={confirmMode !== null}
        onClose={() => setConfirmMode(null)}
        onConfirm={() =>
          void (isPermanent ? handlePermanentDelete() : handleDelete())
        }
        title={isDestructive ? "메일 완전 삭제" : "메일 삭제"}
        description={
          isDestructive
            ? "이 메일을 완전히 삭제할까요? 삭제한 메일은 복구할 수 없습니다."
            : "이 메일을 삭제할까요? 휴지통에서 다시 꺼낼 수 있습니다."
        }
        confirmLabel={isDestructive ? "완전 삭제" : "삭제"}
        danger={isDestructive}
      />
    </div>
  );
}

interface RecipientLineProps {
  recipients: MailAddress[];
}

/** 받는 사람은 이름과 주소를 함께 보여주고, 많으면 뒤를 접는다 */
function RecipientLine({ recipients }: RecipientLineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isFolded = !isExpanded && recipients.length > VISIBLE_RECIPIENTS;
  const visible = isFolded
    ? recipients.slice(0, VISIBLE_RECIPIENTS)
    : recipients;
  const hiddenCount = recipients.length - visible.length;

  return (
    <p className="mt-1 text-xs text-text-tertiary">
      받는 사람:{" "}
      {visible.map((recipient, index) => (
        <span key={recipient.email}>
          {index > 0 && ", "}
          {/* 이름을 모르는 외부 수신자는 주소만 쓴다 — 빈 이름과 꺾쇠만 남지 않게 한다 */}
          {recipient.name ? (
            <>
              <span className="text-text-secondary">{recipient.name}</span>{" "}
              {`<${recipient.email}>`}
            </>
          ) : (
            <span className="text-text-secondary">{recipient.email}</span>
          )}
        </span>
      ))}
      {isFolded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="ml-1 underline underline-offset-2 hover:text-text-secondary"
        >
          외 {hiddenCount}명
        </button>
      )}
    </p>
  );
}
