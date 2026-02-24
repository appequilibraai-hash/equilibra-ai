import bcryptjs from "bcryptjs";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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
 * Register new user - supports multiple schema variations
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
  const openId = uuidv4(); // Generate unique openId

  // Try multiple INSERT strategies to handle different database schemas
  const strategies = [
    // Strategy 1: With openId (VPS schema)
    async () => {
      await db.execute(
        sql`INSERT INTO users (openId, email, password, name) VALUES (${openId}, ${email}, ${hashedPassword}, ${userName})`
      );
    },
    // Strategy 2: Without openId, with name
    async () => {
      await db.execute(
        sql`INSERT INTO users (email, password, name) VALUES (${email}, ${hashedPassword}, ${userName})`
      );
    },
    // Strategy 3: Without openId, without name
    async () => {
      await db.execute(
        sql`INSERT INTO users (email, password) VALUES (${email}, ${hashedPassword})`
      );
    },
  ];

  let lastError: Error | null = null;

  for (const strategy of strategies) {
    try {
      await strategy();
      return { id: 0, email, name: userName };
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      
      // If it's a duplicate email error, stop trying and throw immediately
      if (errorMsg.includes("UNIQUE") || errorMsg.includes("Duplicate") || error.code === "ER_DUP_ENTRY") {
        throw new Error("User with this email already exists");
      }
      
      // Otherwise, continue to next strategy
      continue;
    }
  }

  // If all strategies failed, throw the last error
  if (lastError) {
    throw new Error(`Registration failed: ${lastError.message}`);
  }

  throw new Error("Registration failed: Unknown error");
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ id: number; email: string; name: string | null; openId: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Try to select with openId field first
  let userResult: any[] = [];
  
  try {
    userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        password: users.password,
        openId: users.openId,
      })
      .from(users)
      .where(eq(users.email, email));
  } catch (error: any) {
    // If openId field doesn't exist, try without it
    if (error.message?.includes("Unknown column") && error.message?.includes("openId")) {
      userResult = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          password: users.password,
        })
        .from(users)
        .where(eq(users.email, email));
    } else {
      throw error;
    }
  }

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
    openId: user.openId || email, // Fallback to email if openId doesn't exist
  };
}
