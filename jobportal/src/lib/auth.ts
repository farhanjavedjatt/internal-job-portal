import { createHash, timingSafeEqual } from "crypto";

export const AUTH_COOKIE = "site_auth";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function expectedToken(): string | null {
  const pw = process.env.SITE_PASSWORD;
  if (!pw) return null;
  return sha256(pw);
}

export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = expectedToken();
  if (!expected) return false;
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueToken(password: string): string | null {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return null;
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return sha256(password);
}
