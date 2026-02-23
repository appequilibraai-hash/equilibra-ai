import crypto from "crypto";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function ensureDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): {
  token: string;
  hashedToken: string;
  expiresAt: Date;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Token expires in 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return { token, hashedToken, expiresAt };
}

/**
 * Send email verification email
 * For now, just return the token (in production, send via email service)
 */
export async function sendEmailVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  // In production, integrate with SendGrid/Mailgun here
  // For now, just log it
  console.log(`[EMAIL] Verification email would be sent to ${email}`);
  console.log(`[EMAIL] Verification link: /verify-email?token=${token}`);
  return true;
}

/**
 * Request email verification
 */
export async function requestEmailVerification(email: string): Promise<string> {
  const { token, hashedToken, expiresAt } = generateEmailVerificationToken();
  const db = await ensureDb();

  // Find user by email - select only fields that exist
  const user = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerificationToken: users.emailVerificationToken,
      emailVerificationExpires: users.emailVerificationExpires,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  // Update user with verification token
  await db
    .update(users)
    .set({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expiresAt,
    })
    .where(eq(users.id, user[0].id));

  // Send email
  await sendEmailVerificationEmail(email, token);

  return token; // Return token for testing (in production, don't return)
}

/**
 * Verify email with token
 */
export async function verifyEmailWithToken(token: string): Promise<boolean> {
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const db = await ensureDb();

  // Find user with matching token - select only fields that exist
  const user = await db
    .select({
      id: users.id,
      emailVerificationToken: users.emailVerificationToken,
      emailVerificationExpires: users.emailVerificationExpires,
    })
    .from(users)
    .where(eq(users.emailVerificationToken, hashedToken))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("Invalid verification token");
  }

  // Check if token is expired
  if (user[0].emailVerificationExpires && user[0].emailVerificationExpires < new Date()) {
    throw new Error("Verification token expired");
  }

  // Mark email as verified
  await db
    .update(users)
    .set({
      isEmailVerified: 1,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    })
    .where(eq(users.id, user[0].id));

  return true;
}

/**
 * Check if email is verified
 */
export async function isEmailVerified(userId: number): Promise<boolean> {
  const db = await ensureDb();

  const user = await db
    .select({
      id: users.id,
      isEmailVerified: users.isEmailVerified,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  return user[0].isEmailVerified === 1;
}
