import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface TokenPayload {
  userId: string;
  email: string;
  tenantId: string;
  role: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTenantId(): string {
  return uuidv4();
}

export function generateApiKey(): string {
  return `sk_${uuidv4().replace(/-/g, "")}`;
}

export function generateUserId(): string {
  return uuidv4();
}

export function generateProductId(): string {
  return uuidv4();
}

export function generateOrderId(): string {
  return uuidv4();
}

export function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateCustomerId(): string {
  return uuidv4();
}

export function generateDiscountId(): string {
  return uuidv4();
}

export function generateThemeId(): string {
  return uuidv4();
}

export function generateTransactionId(): string {
  return uuidv4();
}

export function generateSKU(): string {
  const prefix = "SKU";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
