import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./db";

async function ensureDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
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
