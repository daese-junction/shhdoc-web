"use client";

import { useRef, type ChangeEvent } from "react";
import AttachFile from "@mui/icons-material/AttachFile";
import { ToolbarButton } from "./EditorToolbar";

interface AttachmentButtonProps {
  onSelect: (files: FileList) => void;
}

/** 툴바 끝에 붙는 첨부 버튼. 숨은 file input 을 직접 들고 있다. */
export function AttachmentButton({ onSelect }: AttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files && files.length > 0) onSelect(files);
    // 같은 파일을 다시 고를 수 있도록 값을 비운다
    event.target.value = "";
  };

  return (
    <>
      <ToolbarButton
        label="첨부파일 추가"
        description="메일에 붙일 파일을 고릅니다."
        onClick={() => inputRef.current?.click()}
      >
        <AttachFile fontSize="small" />
      </ToolbarButton>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </>
  );
}
