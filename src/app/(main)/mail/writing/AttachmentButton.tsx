"use client";

import AttachFile from "@mui/icons-material/AttachFile";
import { ToolbarButton } from "./EditorToolbar";

interface AttachmentButtonProps {
  onClick: () => void;
}

/** 툴바 끝에 붙는 첨부 버튼. 실제 파일 고르기는 아래 첨부 영역이 맡는다. */
export function AttachmentButton({ onClick }: AttachmentButtonProps) {
  return (
    <ToolbarButton
      label="첨부파일 추가"
      description="파일을 첨부합니다."
      onClick={onClick}
    >
      <AttachFile fontSize="small" />
    </ToolbarButton>
  );
}
