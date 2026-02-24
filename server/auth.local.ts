import bcryptjs from "bcryptjs";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Register new user - simplified version
 */
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ id: number; email: string; name: string | null }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const hashedPassword = await hashPassword(password);
  const userName = name || email.split("@")[0];

  try {
    // Simple insert with just email, password, and name
    await db.execute(
      sql`INSERT INTO users (email, password, name) VALUES (${email}, ${hashedPassword}, ${userName})`
    );
    return { id: 0, email, name: userName };
  } catch (error: any) {
    const errorMsg = error.message || "";
    
    // Check for duplicate email
    if (errorMsg.includes("UNIQUE") || errorMsg.includes("Duplicate") || error.code === "ER_DUP_ENTRY") {
      throw new Error("User with this email already exists");
    }

    // If name column doesn't exist, try without it
    if (errorMsg.includes("Unknown column") && errorMsg.includes("name")) {
      try {
        await db.execute(
          sql`INSERT INTO users (email, password) VALUES (${email}, ${hashedPassword})`
        );
        return { id: 0, email, name: userName };
      } catch (error2: any) {
        const errorMsg2 = error2.message || "";
        if (errorMsg2.includes("UNIQUE") || errorMsg2.includes("Duplicate")) {
          throw new Error("User with this email already exists");
        }
        throw new Error(`Registration failed: ${errorMsg2}`);
      }
    }

    throw new Error(`Registration failed: ${errorMsg}`);
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ id: number; email: string; name: string | null; openId: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      password: users.password,
      openId: users.openId,
    })
    .from(users)
    .where(eq(users.email, email));

  if (userResult.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = userResult[0];

  if (!user.password) {
    throw new Error("This account uses OAuth login. Please use OAuth to sign in.");
  }

  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return {
    id: user.id,
    email: user.email || "",
    name: user.name,
    openId: user.openId,
  };
}
