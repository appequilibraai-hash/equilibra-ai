import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateResetToken,
  generateAndStoreResetToken,
  validateResetToken,
  resetPassword,
} from "./password-reset";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

describe("Password Reset System", () => {
  let testEmail = "test-reset@example.com";
  let testPassword = "originalPassword123";
  let testUserId: number | null = null;

  beforeEach(async () => {
    // Create a test user
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const result = await db
      .insert(users)
      .values({
        openId: `test-reset-${Date.now()}`,
        email: testEmail,
        password: hashedPassword,
        loginMethod: "local",
      });

    // Get the inserted user ID
    const insertedUser = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    if (insertedUser.length > 0) {
      testUserId = insertedUser[0].id;
    }
  });

  afterEach(async () => {
    // Clean up test user
    if (testUserId) {
      const db = await getDb();
      if (db) {
        await db.delete(users).where(eq(users.id, testUserId));
      }
    }
  });

  it("should generate a valid reset token", () => {
    const token = generateResetToken();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);
    expect(typeof token).toBe("string");
  });

  it("should generate and store reset token for valid email", async () => {
    const token = await generateAndStoreResetToken(testEmail);
    expect(token).toBeDefined();
    expect(token).not.toBeNull();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("should return null for non-existent email", async () => {
    const token = await generateAndStoreResetToken("nonexistent@example.com");
    expect(token).toBeNull();
  });

  it("should validate a valid reset token", async () => {
    const token = await generateAndStoreResetToken(testEmail);
    expect(token).not.toBeNull();

    if (token) {
      const validation = await validateResetToken(token);
      expect(validation).not.toBeNull();
      expect(validation?.email).toBe(testEmail);
      expect(validation?.userId).toBe(testUserId);
    }
  });

  it("should reject an invalid reset token", async () => {
    const invalidToken = "invalid-token-12345";
    const validation = await validateResetToken(invalidToken);
    expect(validation).toBeNull();
  });

  it("should reset password with valid token", async () => {
    const token = await generateAndStoreResetToken(testEmail);
    expect(token).not.toBeNull();

    if (token) {
      const newPassword = "newPassword456";
      const success = await resetPassword(token, newPassword);
      expect(success).toBe(true);

      // Verify the password was actually changed
      const db = await getDb();
      if (db) {
        const updatedUser = await db
          .select()
          .from(users)
          .where(eq(users.email, testEmail))
          .limit(1);

        expect(updatedUser.length).toBe(1);
        const passwordMatches = await bcrypt.compare(
          newPassword,
          updatedUser[0].password || ""
        );
        expect(passwordMatches).toBe(true);
      }
    }
  });

  it("should fail to reset password with invalid token", async () => {
    const invalidToken = "invalid-token-12345";
    const success = await resetPassword(invalidToken, "newPassword456");
    expect(success).toBe(false);
  });

  it("should clear reset token after successful password reset", async () => {
    const token = await generateAndStoreResetToken(testEmail);
    expect(token).not.toBeNull();

    if (token) {
      await resetPassword(token, "newPassword456");

      // Try to use the same token again - should fail
      const validation = await validateResetToken(token);
      expect(validation).toBeNull();
    }
  });

  it("should reject expired reset token", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    const token = await generateAndStoreResetToken(testEmail);
    expect(token).not.toBeNull();

    if (token) {
      // Manually set expiration to the past
      await db
        .update(users)
        .set({
          passwordResetExpires: new Date(Date.now() - 1000), // 1 second ago
        })
        .where(eq(users.email, testEmail));

      // Try to validate the expired token
      const validation = await validateResetToken(token);
      expect(validation).toBeNull();
    }
  });

  it("should generate different tokens for multiple requests", async () => {
    const token1 = generateResetToken();
    const token2 = generateResetToken();
    expect(token1).not.toBe(token2);
  });

  it("should handle multiple reset requests for same user", async () => {
    const token1 = await generateAndStoreResetToken(testEmail);
    const token2 = await generateAndStoreResetToken(testEmail);

    expect(token1).not.toBeNull();
    expect(token2).not.toBeNull();
    expect(token1).not.toBe(token2);

    // First token should be invalid now (replaced by second)
    const validation1 = await validateResetToken(token1 || "");
    expect(validation1).toBeNull();

    // Second token should be valid
    const validation2 = await validateResetToken(token2 || "");
    expect(validation2).not.toBeNull();
  });
});
