"use client";

import { useState } from "react";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import { Button } from "@/components/common";
import { useDepartmentStore } from "@/stores/useDepartmentStore";
import { INITIAL_MEMBERS } from "@/mocks/members";
import { DepartmentFormModal } from "./DepartmentFormModal";
import { DepartmentDetailModal } from "./DepartmentDetailModal";

export default function ManageDepartmentsPage() {
  const departments = useDepartmentStore((state) => state.departments);
  const addDepartment = useDepartmentStore((state) => state.addDepartment);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // 객체 대신 id 로 들고 있어야, 수정 후 store 가 바뀌면 모달도 새 이름을 반영한다.
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    number | null
  >(null);
  const selectedDepartment =
    departments.find((d) => d.id === selectedDepartmentId) ?? null;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text-primary">조직</h1>
          <p className="text-sm text-text-secondary">
            조직을 눌러 구성원을 확인하세요.
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)}>
          <AddOutlined fontSize="small" />
          조직 추가
        </Button>
      </div>

      <ul className="divide-y divide-border-tertiary overflow-hidden rounded-lg border border-border-tertiary">
        {departments.map((department) => {
          const memberCount = INITIAL_MEMBERS.filter(
            (m) => m.departmentId === department.id
          ).length;

          return (
            <li key={department.id}>
              <button
                type="button"
                onClick={() => setSelectedDepartmentId(department.id)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-surface-tertiary"
              >
                <span className="text-text-primary">{department.name}</span>
                <span className="flex items-center gap-2 text-text-secondary">
                  구성원 {memberCount}명
                  <ChevronRightOutlined
                    fontSize="small"
                    className="text-text-tertiary"
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <DepartmentFormModal
        open={isAddModalOpen}
        title="조직 추가"
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={(name) => addDepartment(name)}
      />

      <DepartmentDetailModal
        department={selectedDepartment}
        onClose={() => setSelectedDepartmentId(null)}
      />
    </div>
  );
}
