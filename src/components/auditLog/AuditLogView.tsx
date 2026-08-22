"use client";

import { useCallback, useState } from "react";
import { DataList } from "@/components/common";
import { fetchAuditLogPage } from "@/mocks/auditLog";
import type { AuditLog, AuditLogFilter } from "@/types/auditLog";
import type { ListPageParams } from "@/types/list";
import { AUDIT_LOG_COLUMNS } from "./auditLogColumns";
import { EMPTY_AUDIT_LOG_FILTER } from "./auditLogMeta";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import { AuditLogFilters } from "./AuditLogFilters";

/** 감사 로그 목록 화면. `/manage/audit-log` 페이지는 이 컴포넌트만 렌더한다. */
export function AuditLogView() {
  const [filter, setFilter] = useState<AuditLogFilter>(EMPTY_AUDIT_LOG_FILTER);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [page, setPage] = useState(1);
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);

  // filter 가 바뀌면 신원이 달라져 DataList 가 다시 조회한다
  const fetchPage = useCallback(
    ({ page: nextPage, pageSize }: ListPageParams) =>
      fetchAuditLogPage({ page: nextPage, pageSize, filter }),
    [filter],
  );

  // 조건이 바뀌면 지금 페이지가 결과 범위를 벗어날 수 있어 처음으로 돌린다
  const changeFilter = (patch: Partial<AuditLogFilter>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const resetFilter = () => {
    setKeywordDraft("");
    setFilter(EMPTY_AUDIT_LOG_FILTER);
    setPage(1);
  };

  return (
    // 목록이 본문 영역을 그대로 채운다 — 여백 없이 화면 끝까지
    <div className="flex min-h-0 flex-1 flex-col">
      <DataList<AuditLog>
        className="min-h-0 flex-1"
        title="감사 로그"
        columns={AUDIT_LOG_COLUMNS}
        fetchPage={fetchPage}
        getRowId={(log) => log.id}
        // 기록은 지우거나 되돌릴 수 없어 선택할 이유가 없다
        selectable={false}
        page={page}
        onPageChange={setPage}
        onRowClick={setDetailLog}
        emptyTitle="감사 로그가 없습니다"
        emptyDescription="조건에 맞는 기록이 없습니다. 검색어나 기간을 바꿔보세요."
        filters={
          <AuditLogFilters
            filter={filter}
            keywordDraft={keywordDraft}
            onKeywordDraftChange={setKeywordDraft}
            onChange={changeFilter}
            onReset={resetFilter}
          />
        }
      />

      <AuditLogDetailModal
        log={detailLog}
        onClose={() => setDetailLog(null)}
      />
    </div>
  );
}
