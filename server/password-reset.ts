import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
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
 * Send password reset email via SendGrid
 */
async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  try {
    if (!SENDGRID_API_KEY) {
      console.log(`[EMAIL] SendGrid not configured. Reset token for ${email}: ${token}`);
      return false;
    }

    // Build reset link
    const resetLink = `https://equilibraai.manus.space/reset-password?token=${token}`;

    const msg = {
      to: email,
      from: "appequilibraai@gmail.com", // SendGrid verified sender
      subject: "Redefinir sua senha - Equilibra AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d9d78;">Redefinir Senha</h2>
          <p>Você solicitou para redefinir sua senha no Equilibra AI. Clique no link abaixo para continuar:</p>
          <p>
            <a href="${resetLink}" style="background-color: #2d9d78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Redefinir Senha
            </a>
          </p>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p style="color: #999; font-size: 12px;">Este link expira em 1 hora.</p>
          <p style="color: #999; font-size: 12px;">Se você não solicitou esta ação, ignore este email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Equilibra AI - Sua alimentação sob controle total</p>
        </div>
      `,
      text: `Clique aqui para redefinir sua senha: ${resetLink}\n\nEste link expira em 1 hora.`,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Password reset email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL] Failed to send password reset email to ${email}:`, error.message);
    return false;
  }
}

/**
 * Gera um token de reset de senha
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Solicita reset de senha para um email
 * Retorna o token se o email existe, null caso contrário
 */
export async function generateAndStoreResetToken(email: string): Promise<string | null> {
  const db = await ensureDb();
  
  const user = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || user.length === 0) {
    return null;
  }

  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora

  // Hash do token para armazenar no banco (segurança)
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await db
    .update(users)
    .set({
      passwordResetToken: hashedToken,
      passwordResetExpires: expiresAt,
    })
    .where(eq(users.id, user[0].id));

  // Send email via SendGrid
  await sendPasswordResetEmail(email, resetToken);

  // Retorna o token não-hasheado para enviar por email
  return resetToken;
}

/**
 * Valida um token de reset de senha
 */
export async function validateResetToken(token: string): Promise<{ userId: number; email: string } | null> {
  const db = await ensureDb();
  
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      passwordResetToken: users.passwordResetToken,
      passwordResetExpires: users.passwordResetExpires,
    })
    .from(users)
    .where(eq(users.passwordResetToken, hashedToken))
    .limit(1);

  if (!user || user.length === 0) {
    return null;
  }

  const resetUser = user[0];

  // Verifica se o token expirou
  if (!resetUser.passwordResetExpires || resetUser.passwordResetExpires < new Date()) {
    // Limpa o token expirado
    await db
      .update(users)
      .set({
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, resetUser.id));

    return null;
  }

  return {
    userId: resetUser.id,
    email: resetUser.email || "",
  };
}

/**
 * Reseta a senha do usuário
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const db = await ensureDb();
  
  const validation = await validateResetToken(token);

  if (!validation) {
    return false;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    })
    .where(eq(users.id, validation.userId));

  return true;
}
