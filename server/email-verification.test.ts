import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  generateEmailVerificationToken,
  requestEmailVerification,
  verifyEmailWithToken,
  isEmailVerified,
} from "./email-verification";
import { registerUser } from "./auth.local";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Email Verification", () => {
  let testEmail = "test-verify-" + Date.now() + "@example.com";
  let verificationToken: string;

  beforeAll(async () => {
    // Create a test user
    await registerUser(testEmail, "password123", "Test User");
  });

  afterAll(async () => {
    // Clean up test user
    const db = await getDb();
    if (db) {
      await db.delete(users).where(eq(users.email, testEmail));
    }
  });

  it("should generate a valid email verification token", () => {
    const { token, hashedToken, expiresAt } = generateEmailVerificationToken();

    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);
    expect(hashedToken).toBeDefined();
    expect(hashedToken.length).toBeGreaterThan(0);
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should request email verification and store token", async () => {
    const token = await requestEmailVerification(testEmail);

    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);

    // Store token for later tests
    verificationToken = token;

    // Verify token was stored in database
    const db = await getDb();
    if (db) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user.length).toBe(1);
      expect(user[0].emailVerificationToken).toBeDefined();
      expect(user[0].emailVerificationExpires).toBeDefined();
    }
  });

  it("should verify email with valid token", async () => {
    const result = await verifyEmailWithToken(verificationToken);

    expect(result).toBe(true);

    // Verify user is marked as verified
    const db = await getDb();
    if (db) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testEmail))
        .limit(1);

      expect(user.length).toBe(1);
      expect(user[0].isEmailVerified).toBe(1);
      expect(user[0].emailVerificationToken).toBeNull();
      expect(user[0].emailVerificationExpires).toBeNull();
    }
  });

  it("should check if email is verified", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    expect(user.length).toBe(1);

    const verified = await isEmailVerified(user[0].id);
    expect(verified).toBe(true);
  });

  it("should reject invalid verification token", async () => {
    const invalidToken = "invalid-token-12345";

    try {
      await verifyEmailWithToken(invalidToken);
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Invalid verification token");
    }
  });

  it("should reject expired verification token", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new test user for this test
    const expiredTestEmail = "test-expired-" + Date.now() + "@example.com";
    await registerUser(expiredTestEmail, "password123", "Test User");

    // Request verification
    const token = await requestEmailVerification(expiredTestEmail);

    // Manually set token expiration to past
    const { token: hashedToken } = generateEmailVerificationToken();
    const expiredDate = new Date(Date.now() - 1000); // 1 second ago

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, expiredTestEmail))
      .limit(1);

    await db
      .update(users)
      .set({
        emailVerificationExpires: expiredDate,
      })
      .where(eq(users.id, user[0].id));

    // Try to verify with expired token
    try {
      await verifyEmailWithToken(token);
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("expired");
    }

    // Clean up
    await db.delete(users).where(eq(users.email, expiredTestEmail));
  });

  it("should handle multiple verification requests", async () => {
    const multiTestEmail = "test-multi-" + Date.now() + "@example.com";
    await registerUser(multiTestEmail, "password123", "Test User");

    // Request verification twice
    const token1 = await requestEmailVerification(multiTestEmail);
    const token2 = await requestEmailVerification(multiTestEmail);

    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);

    // Only the latest token should work
    try {
      await verifyEmailWithToken(token1);
      expect.fail("Old token should not work");
    } catch (error: any) {
      expect(error.message).toContain("Invalid verification token");
    }

    // Latest token should work
    const result = await verifyEmailWithToken(token2);
    expect(result).toBe(true);

    // Clean up
    const db = await getDb();
    if (db) {
      await db.delete(users).where(eq(users.email, multiTestEmail));
    }
  });
});
