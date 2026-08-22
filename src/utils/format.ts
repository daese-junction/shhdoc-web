const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** 1024 단위로 줄여 "845KB", "2.1MB" 형태로 만든다 (25.0MB 같은 군더더기 소수점은 떼어낸다) */
export function formatFileSize(bytes: number): string {
  let value = Math.max(bytes, 0);
  let unit = 0;

  while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const rounded = unit === 0 ? Math.round(value) : Number(value.toFixed(1));
  return `${rounded}${SIZE_UNITS[unit]}`;
}
