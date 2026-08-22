const pad = (value: number) => String(value).padStart(2, "0");

/** 목록용 일시 표기: YY.MM.DD HH:mm */
export function formatShortDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = pad(date.getFullYear() % 100);
  return `${year}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 툴팁·상세용 전체 표기 */
export function formatFullDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
