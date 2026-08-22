"use client";

import { useRef, type ChangeEvent } from "react";
import type { ListColumn } from "@/types/list";
import { Checkbox } from "../Checkbox/Checkbox";

interface DataListRowProps<T> {
  item: T;
  columns: ListColumn<T>[];
  /** 현재 페이지 안에서의 순번. shift 범위 선택의 기준이 된다. */
  index: number;
  selectable: boolean;
  selected: boolean;
  selectLabel?: string;
  className?: string;
  onToggle: (index: number, shiftKey: boolean) => void;
  onClick?: (item: T) => void;
}

export function DataListRow<T>({
  item,
  columns,
  index,
  selectable,
  selected,
  selectLabel = "행 선택",
  className = "",
  onToggle,
  onClick,
}: DataListRowProps<T>) {
  // label 을 거쳐 들어온 클릭은 change 이벤트에 수식키가 남지 않을 수 있어
  // 캡처 단계에서 미리 받아둔다.
  const shiftKeyRef = useRef(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nativeEvent = event.nativeEvent as Partial<MouseEvent>;
    onToggle(index, shiftKeyRef.current || Boolean(nativeEvent.shiftKey));
    shiftKeyRef.current = false;
  };

  return (
    <li
      onClick={() => onClick?.(item)}
      className={`flex items-center gap-3 border-b border-border-tertiary px-4 py-3 text-sm transition-colors hover:bg-surface-tertiary ${
        onClick ? "cursor-pointer" : ""
      } ${selected ? "bg-brand-50" : ""} ${className}`}
    >
      {selectable && (
        // 체크는 행 열기와 별개 동작이다
        <span
          className="flex shrink-0 items-center"
          onClickCapture={(event) => {
            shiftKeyRef.current = event.shiftKey;
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            aria-label={selectLabel}
            checked={selected}
            onChange={handleChange}
          />
        </span>
      )}

      {columns.map((column) => (
        <span
          key={column.key}
          className={column.className ?? "min-w-0 flex-1 truncate"}
        >
          {column.render(item)}
        </span>
      ))}
    </li>
  );
}
