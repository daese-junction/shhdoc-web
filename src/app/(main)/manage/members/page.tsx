"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import { Button, Input, Modal, PasswordInput } from "@/components/common";
import { getErrorMessage } from "@/api/axios";
import { useToastStore } from "@/stores/useToastStore";
import { INITIAL_MEMBERS, type Member } from "@/mocks/members";
import type { ApiUser } from "@/types/auth";
import {
  createMemberSchema,
  getFieldErrors,
  type CreateMemberInput,
  type FieldErrors,
} from "@/utils/validation";
import { createMember } from "./api";

const initialForm: CreateMemberInput = { email: "", name: "", password: "" };

const ROLE_LABEL: Record<ApiUser["role"], string> = {
  ADMIN: "관리자",
  USER: "구성원",
};

export default function ManageMembersPage() {
  const showToast = useToastStore((state) => state.show);

  // 목록 조회 API 가 아직 없어 목데이터로 시작하고, 추가에 성공하면 앞에 끼워 넣는다.
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateMemberInput>(initialForm);
  const [errors, setErrors] = useState<FieldErrors<CreateMemberInput>>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof CreateMemberInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(initialForm);
    setErrors({});
    setFormError(undefined);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = createMemberSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    setErrors({});
    setFormError(undefined);
    setIsSubmitting(true);

    try {
      // POST /companies/members — 소속 회사는 토큰에서 읽으므로 남의 회사엔 만들 수 없다.
      const member = await createMember(result.data);

      // 생성 응답에는 소속 조직이 없다 — 조직 배정 전까지는 미배정으로 둔다.
      setMembers((prev) => [{ ...member, departmentId: null }, ...prev]);
      showToast(`${member.email} 계정이 만들어졌어요.`, "success");
      closeModal();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setErrors((prev) => ({
          ...prev,
          email: getErrorMessage(error, { 409: "이미 가입된 이메일이에요." }),
        }));
      } else {
        setFormError(
          getErrorMessage(error, {
            400: "회사 도메인의 이메일이 아니에요.",
            403: "관리자만 구성원을 추가할 수 있어요.",
          })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-text-primary">구성원</h1>
          <p className="text-sm text-text-secondary">
            직원 계정을 추가하고 관리합니다.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <PersonAddOutlined fontSize="small" />
          구성원 추가
        </Button>
      </div>

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
                <td className="px-4 py-2.5 text-text-primary">{member.name}</td>
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

      <Modal open={isModalOpen} onClose={closeModal} title="구성원 추가">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
          <Input
            label="이메일"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="bob@shhdoc.com"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            error={errors.email}
            hint="회사 도메인과 다른 이메일은 등록할 수 없어요."
          />

          <Input
            label="이름"
            autoComplete="name"
            placeholder="박직원"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            error={errors.name}
          />

          <PasswordInput
            label="초기 비밀번호"
            autoComplete="new-password"
            placeholder="8자 이상 입력하세요"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            error={errors.password}
            hint="직원에게 직접 전달해주세요."
          />

          {formError && (
            <p role="alert" className="text-xs text-error">
              {formError}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "추가 중…" : "추가"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
