export const LOCK_STORAGE_KEY = "budgetbold-lock";

export const LOCK_EVENT = "budgetbold-lock";

export interface LockRecord {
  hash: string;
  salt: string;
}

export const PIN_LENGTH = 4;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export async function createLockRecord(pin: string): Promise<LockRecord> {
  const salt = randomSalt();
  return { salt, hash: await hashPin(pin, salt) };
}

export function loadLockRecord(): LockRecord | null {
  try {
    const raw = localStorage.getItem(LOCK_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as { hash?: unknown }).hash === "string" &&
      typeof (parsed as { salt?: unknown }).salt === "string"
    ) {
      return parsed as LockRecord;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLockRecord(record: LockRecord): void {
  localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(record));
}

export function clearLock(): void {
  localStorage.removeItem(LOCK_STORAGE_KEY);
}

export async function verifyPin(
  pin: string,
  record: LockRecord,
): Promise<boolean> {
  const hash = await hashPin(pin, record.salt);
  if (hash.length !== record.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) {
    diff |= hash.charCodeAt(i) ^ record.hash.charCodeAt(i);
  }
  return diff === 0;
}
