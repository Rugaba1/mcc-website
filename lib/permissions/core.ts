import {
  ADMIN_CODE,
  ALL_PERMISSION_CODES,
  PERMISSION_IMPLIES,
  REGULAR_PERMISSION_CODES,
} from "./catalog";

export function permissionsForAccount(
  codes: Iterable<string>,
  accountType: "staff" | "regular",
): Set<string> {
  const allowedCodes =
    accountType === "regular" ? REGULAR_PERMISSION_CODES : ALL_PERMISSION_CODES;
  return expandPermissions(
    [...codes].filter((code) => allowedCodes.includes(code)),
  );
}

export function expandPermissions(codes: Iterable<string>): Set<string> {
  const result = new Set<string>();
  const stack = [...codes];

  while (stack.length > 0) {
    const code = stack.pop()!;
    if (result.has(code)) continue; // also protects against cycles
    result.add(code);
    for (const implied of PERMISSION_IMPLIES.get(code) ?? []) {
      stack.push(implied);
    }
  }

  return result;
}

export function hasPermissions(
  granted: Iterable<string>,
  required: string | readonly string[],
): boolean {
  const effective = expandPermissions(granted);
  if (effective.has(ADMIN_CODE)) return true;

  const requirements = typeof required === "string" ? [required] : required;
  return requirements.every((code) => effective.has(code));
}

export function hasAnyPermission(
  granted: Iterable<string>,
  required: readonly string[],
): boolean {
  const effective = expandPermissions(granted);
  return effective.has(ADMIN_CODE) || required.some((code) => effective.has(code));
}
