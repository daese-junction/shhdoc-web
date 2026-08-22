"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useListSelection, type ListSelection } from "@/hooks/useListSelection";
import type { FetchListPage, ListColumn } from "@/types/list";
import { EmptyState } from "../EmptyState/EmptyState";
import { Loading } from "../Loading/Loading";
import { DataListHeader } from "./DataListHeader";
import { DataListRow } from "./DataListRow";

const DEFAULT_PAGE_SIZE = 20;

/** 조회 한 번을 특정하는 값들. 하나라도 달라지면 다시 조회한다. */
interface LoadKey {
  fetchPage: unknown;
  page: number;
  pageSize: number;
  reloadKey: number;
  reloadToken: number;
}

interface DataListProps<T> {
  /** 목록 헤더 맨 앞에 붙는 화면 제목 */
  title?: string;
  columns: ListColumn<T>[];
  /** 페이지네이션 단위로 목록을 조회한다 */
  fetchPage: FetchListPage<T>;
  getRowId: (item: T) => string;
  /** 행 체크박스의 접근성 라벨 */
  getRowLabel?: (item: T) => string;
  rowClassName?: (item: T) => string;
  /** 행마다 체크박스를 두고 전체 선택을 지원할지 */
  selectable?: boolean;
  /** 선택 상태를 바깥에서도 써야 할 때 넘긴다. 없으면 목록이 직접 들고 있는다. */
  selection?: ListSelection;
  /** 하나 이상 선택했을 때 헤더에 붙는 동작 버튼들 */
  selectionActions?: ReactNode;
  /** 헤더 두 번째 줄에 놓이는 검색·필터 영역 */
  filters?: ReactNode;
  /** 헤더 아래에 고정으로 붙는 안내 문구 */
  notice?: ReactNode;
  /** 페이지를 URL 등 바깥에서 관리할 때. 없으면 컴포넌트가 직접 들고 있는다. */
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  /** 값이 바뀌면 목록을 다시 조회한다 (바깥에서 일어난 변경 반영용) */
  reloadToken?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  onRowClick?: (item: T) => void;
}

/** 조회·페이지네이션·선택을 공통으로 처리하는 목록. 열 구성만 바꿔 재사용한다. */
export function DataList<T>({
  title,
  columns,
  fetchPage,
  getRowId,
  getRowLabel,
  rowClassName,
  selectable = true,
  selection: controlledSelection,
  selectionActions,
  filters,
  notice,
  page: controlledPage,
  onPageChange,
  pageSize = DEFAULT_PAGE_SIZE,
  reloadToken = 0,
  emptyTitle = "표시할 항목이 없습니다",
  emptyDescription,
  className = "",
  onRowClick,
}: DataListProps<T>) {
  const [ownPage, setOwnPage] = useState(1);
  const page = controlledPage ?? ownPage;
  const setPage = (nextPage: number) => {
    if (onPageChange) onPageChange(nextPage);
    else setOwnPage(nextPage);
  };

  // 조회 effect 안에서도 최신 setPage 를 쓰되, 콜백 신원이 바뀌어도
  // 재조회가 다시 돌지 않도록 ref 로 들고 있는다
  const setPageRef = useRef(setPage);
  useEffect(() => {
    setPageRef.current = setPage;
  });

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  // 지금 화면에 그려진 목록이 어떤 조회의 결과인지. 지금 필요한 조회와
  // 다르면 아직 못 받아온 것이므로 로딩으로 본다.
  const [loadedFor, setLoadedFor] = useState<LoadKey | null>(null);
  // 헤더가 상단에 붙어 있는 동안(= 목록을 내린 동안) 아래에 그림자를 깐다.
  // 목록은 제 안에서 스크롤되므로(바깥 화면은 늘어나지 않는다) 행 영역의
  // scrollTop 으로 판단한다. 같은 값이면 리액트가 리렌더를 건너뛴다.
  const [isScrolled, setIsScrolled] = useState(false);

  const ownSelection = useListSelection();
  const selection = controlledSelection ?? ownSelection;
  // shift 범위 선택의 기준이 되는 직전 클릭 행. 페이지가 바뀌면 순번이 달라져 지운다.
  const anchorIndexRef = useRef<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const loadKey: LoadKey = { fetchPage, page, pageSize, reloadKey, reloadToken };
  const isLoading =
    loadedFor === null ||
    (Object.keys(loadKey) as (keyof LoadKey)[]).some(
      (key) => loadedFor[key] !== loadKey[key],
    );

  useEffect(() => {
    let cancelled = false;

    void fetchPage({ page, pageSize }).then((result) => {
      if (cancelled) return;

      // 삭제 등으로 전체 페이지 수가 줄어든 경우 마지막 페이지를 다시 조회한다
      const lastPage = Math.max(1, Math.ceil(result.total / pageSize));
      if (page > lastPage) {
        setPageRef.current(lastPage);
        return;
      }

      setItems(result.items);
      setTotal(result.total);
      setLoadedFor({ fetchPage, page, pageSize, reloadKey, reloadToken });
      anchorIndexRef.current = null;
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPage, page, pageSize, reloadKey, reloadToken]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const movePage = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
  };

  const pageIds = useMemo(() => items.map(getRowId), [items, getRowId]);

  // shift 로 찍으면 직전에 찍은 행부터 지금 행까지를 지금 행의 결과 상태로 맞춘다
  const handleToggle = (index: number, shiftKey: boolean) => {
    const id = pageIds[index];
    const anchorIndex = anchorIndexRef.current;

    if (shiftKey && anchorIndex !== null && anchorIndex !== index) {
      const [start, end] =
        anchorIndex < index ? [anchorIndex, index] : [index, anchorIndex];
      selection.select(pageIds.slice(start, end + 1), !selection.isSelected(id));
    } else {
      selection.toggle(id);
    }

    anchorIndexRef.current = index;
  };

  const allChecked =
    pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
  const someChecked = pageIds.some((id) => selection.isSelected(id));
  const hasColumnHeaders = columns.some((column) => Boolean(column.header));

  return (
    // 스크롤은 아래 행 영역만 한다 — 목록이 길어져도 화면(본문 영역)은 늘어나지 않고
    // 제목·페이지 정보가 늘 같은 자리에 남는다
    <div className={`flex h-full min-h-0 flex-col bg-surface-primary ${className}`}>
      {/* 제목·필터·열 제목은 한 덩어리로 상단에 고정한다 */}
      <div
        className={`sticky top-0 z-10 shrink-0 bg-surface-primary transition-shadow ${
          isScrolled ? "shadow-xs" : ""
        }`}
      >
        <DataListHeader
          title={title}
          selectable={selectable}
          allChecked={allChecked}
          someChecked={someChecked}
          selectedCount={selection.selectedCount}
          selectionActions={selectionActions}
          filters={filters}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          total={total}
          onToggleAll={(checked) => {
            anchorIndexRef.current = null;
            selection.select(pageIds, checked);
          }}
          onRefresh={reload}
          onPrevPage={() => movePage(Math.max(1, page - 1))}
          onNextPage={() => movePage(Math.min(totalPages, page + 1))}
        />

        {notice && (
          <p className="border-b border-border-tertiary bg-surface-secondary px-4 py-2 text-xs text-text-secondary">
            {notice}
          </p>
        )}

        {/* 열 제목을 하나라도 준 목록만 제목 행을 그린다 (메일함처럼 없는 목록도 있다) */}
        {hasColumnHeaders && (
          <div className="flex items-center gap-3 border-b border-border-tertiary bg-surface-secondary px-4 py-2 text-xs font-medium text-text-secondary">
            {selectable && <span className="w-4 shrink-0" aria-hidden />}
            {columns.map((column) => (
              <span
                key={column.key}
                className={column.className ?? "min-w-0 flex-1 truncate"}
              >
                {column.header}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => setIsScrolled(event.currentTarget.scrollTop > 0)}
      >
        {isLoading && items.length === 0 ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul>
            {items.map((item, index) => {
              const id = getRowId(item);

              return (
                <DataListRow
                  key={id}
                  item={item}
                  columns={columns}
                  index={index}
                  selectable={selectable}
                  selected={selection.isSelected(id)}
                  selectLabel={getRowLabel?.(item)}
                  className={rowClassName?.(item)}
                  onToggle={handleToggle}
                  onClick={onRowClick}
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
