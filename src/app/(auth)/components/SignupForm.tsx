"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { Button, Input, PasswordInput } from "@/components/common";
import { toEmail } from "@/utils/auth";
import {
  signupSchema,
  getFieldErrors,
  type SignupInput,
  type FieldErrors,
} from "@/utils/validation";
import { createCompany } from "@/app/(auth)/api/company";
import { getErrorMessage } from "@/api/axios";
import { useToastStore } from "@/stores/useToastStore";

const initialForm: SignupInput = {
  companyName: "",
  emailDomain: "",
  name: "",
  username: "",
  password: "",
};

interface SignupFormProps {
  /** 가입에 성공하면 로그인 면으로 넘긴다. 방금 만든 이메일을 넘겨 바로 채워준다. */
  onSuccess?: (email: string) => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const showToast = useToastStore((state) => state.show);
  const [form, setForm] = useState<SignupInput>(initialForm);
  const [errors, setErrors] = useState<FieldErrors<SignupInput>>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof SignupInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = signupSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    setErrors({});
    setFormError(undefined);
    setIsSubmitting(true);

    const email = toEmail(result.data.username, result.data.emailDomain);

    try {
      // POST /companies — 회사와 대표자(ADMIN) 계정을 한 번에 만든다.
      // 대표자 email 은 반드시 회사 도메인이어야 해서 아이디+도메인을 합쳐 보낸다.
      await createCompany({
        companyName: result.data.companyName,
        emailDomain: result.data.emailDomain,
        email,
        password: result.data.password,
        name: result.data.name,
      });

      // 가입 응답에는 토큰이 없다. 로그인 면으로 넘겨 방금 만든 계정으로 로그인하게 한다.
      showToast(`${email} 계정이 만들어졌어요. 로그인해주세요.`, "success");
      onSuccess?.(email);
    } catch (error) {
      // 도메인 중복은 메일 도메인 입력창 아래에 바로 보여준다.
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setErrors((prev) => ({
          ...prev,
          emailDomain: getErrorMessage(error, {
            409: "이미 등록된 회사 도메인입니다.",
          }),
        }));
      } else {
        setFormError(
          getErrorMessage(error, {
            400: "대표자 이메일이 회사 도메인과 달라요. 아이디와 도메인을 확인해주세요.",
          })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewEmail =
    form.username && form.emailDomain
      ? toEmail(form.username, form.emailDomain)
      : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <Input
        layout="horizontal"
        label="회사명"
        autoComplete="organization"
        placeholder="대세컴퍼니"
        value={form.companyName}
        onChange={(event) => update("companyName", event.target.value)}
        error={errors.companyName}
      />

      <Input
        layout="horizontal"
        label="메일 도메인"
        inputMode="url"
        autoCapitalize="none"
        placeholder="shhdoc.co.kr"
        leftSlot={<span className="text-sm">@</span>}
        value={form.emailDomain}
        onChange={(event) =>
          update("emailDomain", event.target.value.trim().toLowerCase())
        }
        error={errors.emailDomain}
        hint="이 도메인으로 보내는 메일이 사내 발송으로 판정됩니다."
      />

      <Input
        layout="horizontal"
        label="이름"
        autoComplete="name"
        placeholder="홍길동"
        value={form.name}
        onChange={(event) => update("name", event.target.value)}
        error={errors.name}
      />

      <Input
        layout="horizontal"
        label="아이디"
        autoComplete="username"
        autoCapitalize="none"
        placeholder="hongildong"
        value={form.username}
        onChange={(event) => update("username", event.target.value)}
        error={errors.username}
        hint={previewEmail}
      />

      <PasswordInput
        layout="horizontal"
        label="비밀번호"
        autoComplete="new-password"
        placeholder="8자 이상 입력하세요"
        value={form.password}
        onChange={(event) => update("password", event.target.value)}
        error={errors.password}
      />

      {formError && (
        <p role="alert" className="text-xs text-error">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 h-11 w-full transition-transform active:scale-[0.99] sm:h-10"
      >
        {isSubmitting ? "가입 중…" : "회원가입"}
      </Button>
    </form>
  );
}
