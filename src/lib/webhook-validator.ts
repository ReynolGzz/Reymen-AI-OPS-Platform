import { createHmac } from "crypto";

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  const expectedHeader = `sha256=${expected}`;

  if (signature.length !== expectedHeader.length) return false;

  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedHeader.charCodeAt(i);
  }
  return result === 0;
}

export function createWebhookSignature(payload: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

/**
 * In development, accepts either the full HMAC signature OR a plain
 * x-reymen-secret header matching N8N_WEBHOOK_SECRET.
 * In production, only the HMAC flow is accepted.
 */
export function isWebhookAuthorized(
  rawBody: string,
  hmacSignature: string,
  plainSecret: string,
  knownSecret: string
): boolean {
  if (verifyWebhookSignature(rawBody, hmacSignature, knownSecret)) return true;

  if (process.env.NODE_ENV !== "production" && plainSecret === knownSecret && knownSecret !== "") {
    return true;
  }

  return false;
}
