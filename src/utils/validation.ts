import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요.")
    .pipe(z.email("이메일 형식이 올바르지 않습니다.")),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export const signupSchema = z.object({
  companyName: z.string().trim().min(1, "회사명을 입력해주세요."),
  emailDomain: z
    .string()
    .trim()
    .min(1, "메일 도메인을 입력해주세요.")
    .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i, "example.com 형식으로 입력해주세요."),
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력해주세요.")
    .max(20, "20자 이하로 입력해주세요."),
  username: z
    .string()
    .trim()
    .min(1, "아이디를 입력해주세요.")
    .regex(/^[a-z0-9._-]{4,20}$/i, "영문·숫자 4~20자로 입력해주세요."),
  password: z
    .string()
    .min(1, "비밀번호를 입력해주세요.")
    .min(8, "8자 이상 입력해주세요."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

/** 필드별 첫 번째 에러 메시지만 뽑아낸다. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function getFieldErrors<T>(error: z.ZodError<T>): FieldErrors<T> {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;

  return Object.entries(fieldErrors).reduce<FieldErrors<T>>(
    (acc, [key, messages]) => {
      if (messages?.[0]) acc[key as keyof T] = messages[0];
      return acc;
    },
    {}
  );
}
