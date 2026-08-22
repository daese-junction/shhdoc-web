"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PasswordInput } from "@/components/common";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { ROUTES } from "@/utils/routes";
import {
  loginSchema,
  getFieldErrors,
  type LoginInput,
  type FieldErrors,
} from "@/utils/validation";
import { login as requestLogin } from "@/app/(auth)/api/auth";
import { getErrorMessage } from "@/api/axios";
import { toStoreUser } from "@/utils/auth";

interface LoginFormProps {
  /** 회원가입 직후 넘어온 경우 방금 만든 이메일을 채워준다 */
  defaultEmail?: string;
}

export function LoginForm({ defaultEmail = "" }: LoginFormProps) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const setUser = useUserStore((state) => state.setUser);
  const [form, setForm] = useState<LoginInput>({
    email: defaultEmail,
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof LoginInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    setErrors({});
    setFormError(undefined);
    setIsSubmitting(true);

    try {
      // POST /auth/login — accessToken 30분, refreshToken 7일.
      // 로그인할 때마다 refreshToken 이 새로 발급되고 이전 것은 무효가 된다.
      const session = await requestLogin(result.data);

      login(session.accessToken, session.refreshToken);
      setUser(toStoreUser(session.user));

      router.replace(ROUTES.mail);
    } catch (error) {
      setFormError(
        getErrorMessage(error, {
          401: "이메일 또는 비밀번호가 올바르지 않습니다.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <Input
        label="이메일"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@company.com"
        value={form.email}
        onChange={(event) => update("email", event.target.value)}
        error={errors.email}
      />

      <PasswordInput
        label="비밀번호"
        autoComplete="current-password"
        placeholder="비밀번호를 입력하세요"
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
        {isSubmitting ? "로그인 중…" : "로그인"}
      </Button>
    </form>
  );
}
