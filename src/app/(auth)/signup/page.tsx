"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Input, PasswordInput } from "@/components/common";
import { AuthCard } from "@/components/feature/auth/AuthCard";
import {
  signupSchema,
  getFieldErrors,
  type SignupInput,
  type FieldErrors,
} from "@/utils/validation";

const initialForm: SignupInput = {
  companyName: "",
  emailDomain: "",
  name: "",
  username: "",
  password: "",
};

export default function SignupPage() {
  const [form, setForm] = useState<SignupInput>(initialForm);
  const [errors, setErrors] = useState<FieldErrors<SignupInput>>({});

  const update = (key: keyof SignupInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = signupSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    setErrors({});
    // TODO: src/api/auth.ts 연결
  };

  const previewEmail =
    form.username && form.emailDomain
      ? `${form.username}@${form.emailDomain}`
      : undefined;

  return (
    <AuthCard
      title="회원가입"
      description="회사 정보와 계정을 등록하세요"
      footer={
        <>
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-500 hover:underline"
          >
            로그인
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
        <Input
          label="회사명"
          autoComplete="organization"
          placeholder="대세컴퍼니"
          value={form.companyName}
          onChange={(event) => update("companyName", event.target.value)}
          error={errors.companyName}
        />

        <Input
          label="메일 도메인"
          inputMode="url"
          autoCapitalize="none"
          placeholder="company.com"
          leftSlot={<span className="text-sm">@</span>}
          value={form.emailDomain}
          onChange={(event) =>
            update("emailDomain", event.target.value.trim().toLowerCase())
          }
          error={errors.emailDomain}
          hint="회사 메일 주소의 @ 뒤 부분입니다."
        />

        <Input
          label="이름"
          autoComplete="name"
          placeholder="홍길동"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          error={errors.name}
        />

        <Input
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
          label="비밀번호"
          autoComplete="new-password"
          placeholder="8자 이상 입력하세요"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          error={errors.password}
        />

        <Button type="submit" className="mt-2 h-11 w-full sm:h-10">
          회원가입
        </Button>
      </form>
    </AuthCard>
  );
}
