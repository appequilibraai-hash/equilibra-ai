import bcryptjs from "bcryptjs"; // bcryptjs já inclui tipos TypeScript
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Verify password against bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Register new user with email and password
 * Uses multiple fallback strategies to work with different database schemas
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

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate unique openId
  const openId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const userName = name || email.split("@")[0];

  // Try different INSERT strategies based on what columns exist
  let inserted = false;
  let lastError: any = null;

  // Strategy 1: INSERT with all fields (openId, email, name, password)
  if (!inserted) {
    try {
      await db.execute(
        sql`INSERT INTO users (openId, email, name, password) VALUES (${openId}, ${email}, ${userName}, ${hashedPassword})`
      );
      inserted = true;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      
      // If it's a duplicate email error, throw it
      if (errorMsg.includes("UNIQUE") || errorMsg.includes("Duplicate") || error.code === "ER_DUP_ENTRY") {
        throw new Error("User with this email already exists");
      }
    }
  }

  // Strategy 2: INSERT with email and password only
  if (!inserted) {
    try {
      await db.execute(
        sql`INSERT INTO users (email, password) VALUES (${email}, ${hashedPassword})`
      );
      inserted = true;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      
      if (errorMsg.includes("UNIQUE") || errorMsg.includes("Duplicate") || error.code === "ER_DUP_ENTRY") {
        throw new Error("User with this email already exists");
      }
    }
  }

  // Strategy 3: INSERT with openId and email only
  if (!inserted) {
    try {
      await db.execute(
        sql`INSERT INTO users (openId, email) VALUES (${openId}, ${email})`
      );
      inserted = true;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      
      if (errorMsg.includes("UNIQUE") || errorMsg.includes("Duplicate") || error.code === "ER_DUP_ENTRY") {
        throw new Error("User with this email already exists");
      }
    }
  }

  // Strategy 4: INSERT with just email
  if (!inserted) {
    try {
      await db.execute(
        sql`INSERT INTO users (email) VALUES (${email})`
      );
      inserted = true;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || "";
      
      if (errorMsg.includes("UNIQUE") || errorMsg.includes("Duplicate") || error.code === "ER_DUP_ENTRY") {
        throw new Error("User with this email already exists");
      }
    }
  }

  // If all strategies failed, throw error
  if (!inserted) {
    console.error("All registration strategies failed:", lastError);
    throw new Error(`Registration failed: ${lastError?.message || "Unknown error"}`);
  }

  return { id: 0, email, name: userName };
}

/**
 * Login user with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ id: number; email: string; name: string | null; openId: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Find user by email - select only fields that exist
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

  // Check if user has password (local auth)
  if (!user.password) {
    throw new Error("This account uses OAuth login. Please use OAuth to sign in.");
  }

  // Verify password
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
