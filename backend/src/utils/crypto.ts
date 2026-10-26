import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "enc:v1:";

/**
 * Derives a 32-byte key from dedicated environment variable ENCRYPTION_KEY.
 */
function getDerivedKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not configured. Sensitive credentials cannot be encrypted/decrypted safely."
    );
  }
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Checks whether a given string is already encrypted with our format.
 */
export function isEncrypted(text: string | null | undefined): boolean {
  if (!text || typeof text !== "string") return false;
  return text.startsWith(PREFIX);
}

/**
 * Encrypts sensitive credentials (such as user provider API keys) using AES-256-GCM.
 * Output format: enc:v1:<iv_hex>:<tag_hex>:<cipher_hex>
 */
export function encryptApiKey(plainText: string | null | undefined): string | null {
  if (!plainText || typeof plainText !== "string") {
    return null;
  }

  const trimmed = plainText.trim();
  if (!trimmed) {
    return null;
  }

  // Already encrypted
  if (isEncrypted(trimmed)) {
    return trimmed;
  }

  try {
    const key = getDerivedKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(trimmed, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return `${PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
  } catch (error) {
    console.error("[crypto] Failed to encrypt sensitive key:", error);
    // Never return plaintext if encryption fails - throw or return null
    throw new Error("Failed to securely encrypt sensitive credential");
  }
}

/**
 * Decrypts AES-256-GCM encrypted credentials.
 * If the string does not match the encrypted prefix, returns it as-is for backward compatibility.
 */
export function decryptApiKey(cipherText: string | null | undefined): string | null {
  if (!cipherText || typeof cipherText !== "string") {
    return null;
  }

  const trimmed = cipherText.trim();
  if (!trimmed) {
    return null;
  }

  // If not encrypted, return as-is for legacy/unencrypted compatibility
  if (!isEncrypted(trimmed)) {
    return trimmed;
  }

  try {
    const parts = trimmed.slice(PREFIX.length).split(":");
    if (parts.length !== 3) {
      console.warn("[crypto] Malformed encrypted credential payload");
      return null;
    }

    const [ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(cipherHex, "hex");

    if (iv.length !== 12 || tag.length !== 16) {
      console.warn("[crypto] Malformed encrypted credential: invalid IV or tag length");
      return null;
    }

    const key = getDerivedKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[crypto] Failed to decrypt sensitive credential:", error);
    return null;
  }
}
