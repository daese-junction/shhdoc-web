"use client";

import { useState, type FormEvent } from "react";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { Button, Input, Modal } from "@/components/common";
import { useToastStore } from "@/stores/useToastStore";
import { INITIAL_ROLES, type Role } from "@/mocks/roles";
import {
  createRoleSchema,
  getFieldErrors,
  type CreateRoleInput,
  type FieldErrors,
} from "@/utils/validation";

const initialForm = { name: "", priority: "" };

const byPriority = (a: Role, b: Role) => a.priority - b.priority;

export default function ManageRolesPage() {
  const showToast = useToastStore((state) => state.show);

  // API 가 아직 없어 목데이터로 시작하고, 추가하면 우선순위 순으로 다시 정렬해 끼워 넣는다.
  const [roles, setRoles] = useState<Role[]>([...INITIAL_ROLES].sort(byPriority));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FieldErrors<CreateRoleInput>>({});

  const update = (key: keyof typeof initialForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(initialForm);
    setErrors({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = createRoleSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    const role: Role = {
      id: Math.max(0, ...roles.map((r) => r.id)) + 1,
      ...result.data,
    };

    setRoles((prev) => [...prev, role].sort(byPriority));
    showToast(`${role.name} 직책이 추가되었어요.`, "success");
    closeModal();
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text-primary">직책</h1>
          <p className="text-sm text-text-secondary">
            직책과 우선순위를 관리합니다. 숫자가 작을수록 상위 직책입니다.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <AddOutlined fontSize="small" />
          직책 추가
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-tertiary">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-secondary text-text-secondary">
            <tr>
              <th className="w-24 px-4 py-2.5 font-medium">우선순위</th>
              <th className="px-4 py-2.5 font-medium">직책명</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-tertiary">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-4 py-2.5 text-text-secondary">
                  {role.priority}
                </td>
                <td className="px-4 py-2.5 text-text-primary">{role.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={isModalOpen} onClose={closeModal} title="직책 추가">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
          <Input
            label="직책명"
            placeholder="팀장"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            error={errors.name}
          />

          <Input
            label="우선순위"
            type="number"
            min={1}
            placeholder="숫자가 작을수록 상위 직책"
            value={form.priority}
            onChange={(event) => update("priority", event.target.value)}
            error={errors.priority}
          />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              취소
            </Button>
            <Button type="submit">추가</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
