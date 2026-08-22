"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { Input, type InputProps } from "../Input/Input";

interface SearchInputProps
  extends Omit<
    InputProps,
    "type" | "leftSlot" | "rightSlot" | "hideMessage" | "value" | "onChange"
  > {
  value: string;
  onChange: (value: string) => void;
  /** Enter 키 또는 지우기 이후 호출 */
  onSearch?: (value: string) => void;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "검색어를 입력하세요",
  ...props
}: SearchInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(event.target.value);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSearch?.(value);
    }
  };

  const handleClear = () => {
    onChange("");
    onSearch?.("");
  };

  return (
    <Input
      {...props}
      type="search"
      hideMessage
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      leftSlot={<SearchIcon fontSize="small" />}
      rightSlot={
        value ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="검색어 지우기"
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-secondary"
          >
            <CloseIcon fontSize="small" />
          </button>
        ) : undefined
      }
      // 브라우저 기본 검색 취소 버튼 제거 (직접 만든 지우기 버튼과 중복)
      className="[&::-webkit-search-cancel-button]:appearance-none"
    />
  );
}
