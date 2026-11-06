const NUL = "\u0000";

/**
 * True if any string inside the value holds a NUL byte. Postgres text can't store one,
 * so a query carrying it fails and the route would answer 500.
 * Walks with a stack, not recursion: a deeply nested body must not overflow the call stack.
 */
export function containsNulByte(input: unknown): boolean {
  const pending: unknown[] = [input];
  while (pending.length > 0) {
    const value = pending.pop();
    if (typeof value === "string") {
      if (value.includes(NUL)) return true;
    } else if (typeof value === "object" && value !== null) {
      for (const child of Object.values(value)) pending.push(child);
    }
  }
  return false;
}
