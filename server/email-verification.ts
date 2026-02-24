import crypto from "crypto";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

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
 * Send email verification email via SendGrid
 */
export async function sendEmailVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.log(`[EMAIL] SendGrid not configured. Token for ${email}: ${token}`);
      return false;
    }

    // Build verification link
    // In production, use your actual domain
    const verificationLink = `https://equilibraai.manus.space/verify-email?token=${token}`;

    const msg = {
      to: email,
      from: "noreply@equilibra-ai.com", // Change to your verified sender email
      subject: "Verifique seu email - Equilibra AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d9d78;">Bem-vindo ao Equilibra AI!</h2>
          <p>Obrigado por se registrar. Para ativar sua conta, clique no link abaixo:</p>
          <p>
            <a href="${verificationLink}" style="background-color: #2d9d78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verificar Email
            </a>
          </p>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p style="color: #999; font-size: 12px;">Este link expira em 24 horas.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Equilibra AI - Sua alimentação sob controle total</p>
        </div>
      `,
      text: `Clique aqui para verificar seu email: ${verificationLink}\n\nEste link expira em 24 horas.`,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Verification email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL] Failed to send verification email to ${email}:`, error.message);
    return false;
  }
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
