"use client";

import { useId, useState } from "react";
import { Button, Checkbox, Input } from "@/components/common";
import { TextEditor } from "./TextEditor";

/** Tiptap 은 내용을 모두 지워도 빈 문단(`<p></p>`)을 남기므로 태그를 걷어내고 판단한다 */
function isBlank(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}

export default function MailWritingPage() {
  const [recipients, setRecipients] = useState("");
  const [isIndividual, setIsIndividual] = useState(false);
  const [subject, setSubject] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [body, setBody] = useState("");

  const isEmptyBody = isBlank(body);
  const canSend = Boolean(recipients.trim() && subject.trim()) && !isEmptyBody;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-text-primary">메일 쓰기</h1>
        {/* 검토 요청 연동은 결재 API 작업에서 붙인다 */}
        <Button type="button" variant="outline" disabled={!canSend}>
          검토
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border-tertiary bg-surface-primary p-4">
        <ComposeField
          label="받는 사람"
          value={recipients}
          onValueChange={setRecipients}
          placeholder="이메일 주소를 쉼표로 구분해 입력하세요"
          optionLabel="개인별"
          optionChecked={isIndividual}
          onOptionChange={setIsIndividual}
        />

        <ComposeField
          label="제목"
          value={subject}
          onValueChange={setSubject}
          placeholder="제목을 입력하세요"
          optionLabel="중요"
          optionChecked={isImportant}
          onOptionChange={setIsImportant}
        />
      </div>

      <TextEditor
        placeholder="메일 내용을 입력하세요"
        characterLimit={10000}
        minHeightClass="min-h-96"
        onChange={setBody}
      />

      <div className="flex justify-end gap-2">
        {/* 발송·임시저장 연동은 메일 API 작업에서 붙인다 */}
        <Button type="button" variant="outline" disabled={isEmptyBody}>
          임시저장
        </Button>
        <Button type="button" disabled={!canSend}>
          보내기
        </Button>
      </div>
    </div>
  );
}

interface ComposeFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** 라벨 옆에 붙는 옵션 체크박스 (개인별 / 중요) */
  optionLabel: string;
  optionChecked: boolean;
  onOptionChange: (checked: boolean) => void;
}

/** 라벨 + 옵션 체크박스 + 입력창 한 줄. 좁은 화면에서는 위아래로 쌓인다. */
function ComposeField({
  label,
  value,
  onValueChange,
  placeholder,
  optionLabel,
  optionChecked,
  onOptionChange,
}: ComposeFieldProps) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3 sm:w-44">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text-primary"
        >
          {label}
        </label>
        <Checkbox
          label={optionLabel}
          checked={optionChecked}
          onChange={(event) => onOptionChange(event.target.checked)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <Input
          id={inputId}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          hideMessage
        />
      </div>
    </div>
  );
}
