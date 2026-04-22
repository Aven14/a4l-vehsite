export function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export async function makeUniqueId(
  baseValue: string,
  exists: (candidate: string) => Promise<boolean>,
  fallbackPrefix = "item"
): Promise<string> {
  const base = toSlug(baseValue) || `${fallbackPrefix}-${Date.now()}`;

  if (!(await exists(base))) {
    return base;
  }

  let i = 2;
  while (await exists(`${base}-${i}`)) {
    i++;
  }

  return `${base}-${i}`;
}
