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
    // 라벨은 영숫자로 시작·끝나야 하고(하이픈은 중간만), 최상위는 두 글자 이상.
    // shhdoc.com / daese.kr / daese.co.kr 모두 허용된다.
    .regex(
      /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i,
      "shhdoc.com, daese.co.kr 같은 형식으로 입력해주세요."
    ),
  // 사내 구성원 이름이라 한글로 받는다. ㄱ·ㅏ 같은 자모 단독은 걸러진다.
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력해주세요.")
    .regex(/^[가-힣]{2,20}$/, "한글 이름을 2~20자로 입력해주세요."),
  // 이메일 앞부분이 되므로 소문자로 시작하고, 특수문자는 사이에만 한 번씩 올 수 있다.
  username: z
    .string()
    .trim()
    .min(1, "아이디를 입력해주세요.")
    .min(4, "4자 이상 입력해주세요.")
    .max(20, "20자 이하로 입력해주세요.")
    .regex(
      /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/,
      "영문 소문자로 시작하고 영문·숫자만 쓸 수 있어요. (. _ - 는 사이에만)"
    ),
  password: z
    .string()
    .min(1, "비밀번호를 입력해주세요.")
    .min(8, "8자 이상 입력해주세요.")
    .max(64, "64자 이하로 입력해주세요.")
    .regex(
      /^(?=.*[A-Za-z])(?=.*[0-9])[!-~]+$/,
      "영문과 숫자를 함께 넣어주세요. (공백·한글 불가)"
    ),
});

/** 관리자가 구성원을 추가할 때 쓰는 폼. 이메일 도메인이 회사 도메인과 다른지는 서버가 판단한다. */
export const createMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "이메일을 입력해주세요.")
    .pipe(z.email("이메일 형식이 올바르지 않습니다.")),
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력해주세요.")
    .max(20, "20자 이하로 입력해주세요."),
  password: z
    .string()
    .min(1, "초기 비밀번호를 입력해주세요.")
    .min(8, "8자 이상 입력해주세요."),
});

/** 직책 추가 폼. 우선순위는 숫자가 작을수록 상위 직책이다. */
export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "직책명을 입력해주세요.")
    .max(20, "20자 이하로 입력해주세요."),
  priority: z.coerce
    .number({ error: "우선순위를 입력해주세요." })
    .int("정수로 입력해주세요.")
    .min(1, "1 이상으로 입력해주세요."),
});

/** 조직(부서) 추가 폼 */
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "조직명을 입력해주세요.")
    .max(20, "20자 이하로 입력해주세요."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

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
