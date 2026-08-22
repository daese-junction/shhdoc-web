"use client";

import { useState } from "react";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Button, Input, Modal } from "@/components/common";
import { useDepartmentStore } from "@/stores/useDepartmentStore";
import { INITIAL_MEMBERS } from "@/mocks/members";
import type { Department } from "@/mocks/departments";

interface DepartmentDetailModalProps {
  department: Department | null;
  onClose: () => void;
}

/** 조직 상세 — 이름 수정과 소속 구성원 목록을 모달 하나에서 보여준다. */
export function DepartmentDetailModal({
  department,
  onClose,
}: DepartmentDetailModalProps) {
  return (
    <Modal open={department !== null} onClose={onClose}>
      {department && (
        // department.id 로 key 를 줘 다른 조직을 열 때 수정 상태가 새로 시작되게 한다.
        <DepartmentDetailContent
          key={department.id}
          department={department}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function DepartmentDetailContent({
  department,
  onClose,
}: {
  department: Department;
  onClose: () => void;
}) {
  const renameDepartment = useDepartmentStore((state) => state.renameDepartment);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(department.name);

  const members = INITIAL_MEMBERS.filter(
    (m) => m.departmentId === department.id
  );

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed) renameDepartment(department.id, trimmed);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              hideMessage
              className="h-9"
            />
            <Button size="sm" onClick={handleSave}>
              저장
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setName(department.name);
                setIsEditing(false);
              }}
            >
              취소
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-text-primary">
              {department.name}
            </h2>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <EditOutlined fontSize="small" />
              수정
            </Button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-text-secondary">
          구성원 {members.length}명
        </h3>

        {members.length > 0 ? (
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
                {members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-2.5 text-text-primary">
                      {member.name}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {member.email}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {member.role === "ADMIN" ? "관리자" : "구성원"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border-tertiary p-4 text-sm text-text-tertiary">
            소속된 구성원이 없어요.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}
