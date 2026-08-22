"use client";

import { useEffect, useState } from "react";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import { Loading, Modal } from "@/components/common";
import { getErrorMessage } from "@/api/axios";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiUserRole, CompanyMember } from "@/types/auth";
import { listMembers } from "../members/api";

const UNASSIGNED_LABEL = "미배정";

const ROLE_LABEL: Record<ApiUserRole, string> = {
  ADMIN: "관리자",
  USER: "구성원",
};

interface DepartmentGroup {
  name: string;
  members: CompanyMember[];
}

/** 부서를 관리하는 API 가 따로 없다 — 구성원 목록을 부서 이름 기준으로 묶어서 보여준다. */
function groupByDepartment(members: CompanyMember[]): DepartmentGroup[] {
  const groups = new Map<string, CompanyMember[]>();

  for (const member of members) {
    const key = member.department?.trim() || UNASSIGNED_LABEL;
    const group = groups.get(key) ?? [];
    group.push(member);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([name, groupMembers]) => ({ name, members: groupMembers }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export default function ManageDepartmentsPage() {
  const showToast = useToastStore((state) => state.show);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<DepartmentGroup | null>(null);

  useEffect(() => {
    let cancelled = false;

    listMembers()
      .then((result) => {
        if (cancelled) return;
        setMembers(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // 응답 자체가 없는 네트워크 오류는 인터셉터가 이미 토스트로 안내했다.
        const message = getErrorMessage(error, {}, "구성원 목록을 불러오지 못했어요.");
        if (message) showToast(message, "error");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const groups = groupByDepartment(members);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text-primary">조직</h1>
        <p className="text-sm text-text-secondary">
          구성원의 부서 정보를 기준으로 묶어서 보여줍니다.
        </p>
      </div>

      {isLoading ? (
        <Loading />
      ) : groups.length > 0 ? (
        <ul className="divide-y divide-border-tertiary overflow-hidden rounded-lg border border-border-tertiary">
          {groups.map((group) => (
            <li key={group.name}>
              <button
                type="button"
                onClick={() => setSelected(group)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-surface-tertiary"
              >
                <span className="text-text-primary">{group.name}</span>
                <span className="flex items-center gap-2 text-text-secondary">
                  구성원 {group.members.length}명
                  <ChevronRightOutlined
                    fontSize="small"
                    className="text-text-tertiary"
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border-tertiary p-8 text-center text-sm text-text-tertiary">
          구성원이 없어요.
        </p>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name}
      >
        {selected && (
          <div className="overflow-hidden rounded-lg border border-border-tertiary">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-secondary text-text-secondary">
                <tr>
                  <th className="px-4 py-2.5 font-medium">이름</th>
                  <th className="px-4 py-2.5 font-medium">이메일</th>
                  <th className="px-4 py-2.5 font-medium">역할</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-tertiary">
                {selected.members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-2.5 text-text-primary">
                      {member.name}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {member.email}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {ROLE_LABEL[member.role]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
