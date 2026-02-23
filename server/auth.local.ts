import bcryptjs from "bcryptjs"; // bcryptjs já inclui tipos TypeScript
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

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

  // We'll handle duplicate email errors when inserting

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate unique openId
  const openId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create user
  try {
    await db.insert(users).values({
      openId,
      email,
      password: hashedPassword,
      name: name || email.split("@")[0],
      loginMethod: "local",
      isEmailVerified: 0,
    });
  } catch (error: any) {
    // Check if it's a duplicate email error
    if (error.message?.includes("UNIQUE") || error.message?.includes("Duplicate")) {
      throw new Error("User with this email already exists");
    }
    throw error;
  }

  // Return the created user data without fetching from DB
  // This avoids issues with SELECT queries on different database schemas
  return {
    id: 0, // ID will be auto-generated, we don't need it for registration response
    email,
    name: name || email.split("@")[0],
  };
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
