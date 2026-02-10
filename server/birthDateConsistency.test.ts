import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserProfile, getUserProfile } from "./db";

describe("Birth Date Consistency - No Random Changes", () => {
  let testUserId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const result = await db
      .insert(users)
      .values({
        openId: `test-user-${Date.now()}`,
        name: "Test User",
        email: "test@example.com",
        role: "user",
      });

    testUserId = result[0].insertId;
  });

  afterAll(async () => {
    if (!db || !testUserId) return;

    // Clean up test data
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should keep birth date consistent after multiple saves", async () => {
    const birthDate = new Date("1990-05-15T00:00:00Z");

    // First save
    await updateUserProfile(testUserId, {
      birthDate: birthDate,
    });

    const result1 = await getUserProfile(testUserId);
    const savedDate1 = new Date(result1?.birthDate as any).toISOString().split('T')[0];

    // Second save (simulating user saving again)
    await updateUserProfile(testUserId, {
      birthDate: birthDate,
    });

    const result2 = await getUserProfile(testUserId);
    const savedDate2 = new Date(result2?.birthDate as any).toISOString().split('T')[0];

    // Third save (simulating multiple navigations)
    await updateUserProfile(testUserId, {
      birthDate: birthDate,
    });

    const result3 = await getUserProfile(testUserId);
    const savedDate3 = new Date(result3?.birthDate as any).toISOString().split('T')[0];

    // All should be the same
    expect(savedDate1).toBe(savedDate2);
    expect(savedDate2).toBe(savedDate3);
  });

  it("should not change birth date when updating other fields", async () => {
    const birthDate = new Date("1992-03-20T00:00:00Z");

    // Save birth date
    await updateUserProfile(testUserId, {
      birthDate: birthDate,
    });

    const result1 = await getUserProfile(testUserId);
    const savedDate1 = new Date(result1?.birthDate as any).toISOString().split('T')[0];

    // Update other fields without touching birth date
    await updateUserProfile(testUserId, {
      fullName: "Updated Name",
      height: 180,
    });

    const result2 = await getUserProfile(testUserId);
    const savedDate2 = new Date(result2?.birthDate as any).toISOString().split('T')[0];

    // Birth date should remain the same
    expect(savedDate1).toBe(savedDate2);
    expect(result2?.fullName).toBe("Updated Name");
    expect(result2?.height).toBe(180);
  });

  it("should handle rapid consecutive saves without data loss", async () => {
    const birthDate = new Date("1988-11-10T00:00:00Z");

    // Rapid saves
    const promises = Array(5).fill(null).map(() =>
      updateUserProfile(testUserId, {
        birthDate: birthDate,
        fullName: "Test User",
      })
    );

    await Promise.all(promises);

    const result = await getUserProfile(testUserId);
    const savedDate = new Date(result?.birthDate as any).toISOString().split('T')[0];

    // Should still have correct date
    const expectedDate = new Date("1988-11-10T00:00:00Z").toISOString().split('T')[0];
    const dayDiff = Math.abs(new Date(savedDate).getTime() - new Date(expectedDate).getTime()) / (1000 * 60 * 60 * 24);
    expect(dayDiff).toBeLessThanOrEqual(1);
  });

  it("should maintain data integrity with partial updates", async () => {
    const birthDate = new Date("1995-07-25T00:00:00Z");
    const fullName = "John Doe";
    const height = 175;

    // Initial save with all data
    await updateUserProfile(testUserId, {
      birthDate: birthDate,
      fullName: fullName,
      height: height,
    });

    const result1 = await getUserProfile(testUserId);
    const savedDate1 = new Date(result1?.birthDate as any).toISOString().split('T')[0];

    // Partial update (only update height)
    await updateUserProfile(testUserId, {
      height: 180,
    });

    const result2 = await getUserProfile(testUserId);
    const savedDate2 = new Date(result2?.birthDate as any).toISOString().split('T')[0];

    // Birth date and name should remain unchanged
    expect(savedDate1).toBe(savedDate2);
    expect(result2?.fullName).toBe(fullName);
    expect(result2?.height).toBe(180);
  });
});
