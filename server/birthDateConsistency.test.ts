import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserProfile, getUserProfile } from "./db";

describe("Birth Date Consistency - Navigation Between Tabs", () => {
  let testUserId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .insert(users)
      .values({
        openId: `test-consistency-${Date.now()}`,
        name: "Consistency Test User",
        email: "consistency@example.com",
        role: "user",
      });

    testUserId = result[0].insertId;
  });

  afterAll(async () => {
    if (!db || !testUserId) return;
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should keep birth date unchanged when navigating between tabs", async () => {
    const birthDate = "1995-07-25";

    // Save birth date
    await updateUserProfile(testUserId, {
      birthDate: birthDate,
    });

    // Simulate: User navigates to another tab (e.g., Progresso)
    // and comes back to Configurações
    const result1 = await getUserProfile(testUserId);
    expect(result1?.birthDate).toBe(birthDate);

    // Simulate: User navigates away and back again
    const result2 = await getUserProfile(testUserId);
    expect(result2?.birthDate).toBe(birthDate);

    // Both should be identical
    expect(result1?.birthDate).toBe(result2?.birthDate);
  });

  it("should maintain data integrity with partial updates", async () => {
    const birthDate = "1995-07-25";
    const fullName = "John Doe";
    const height = 175;

    // Initial save with all data
    await updateUserProfile(testUserId, {
      birthDate: birthDate,
      fullName: fullName,
      height: height,
    });

    const result1 = await getUserProfile(testUserId);
    expect(result1?.birthDate).toBe(birthDate);

    // Partial update (only update height)
    await updateUserProfile(testUserId, {
      height: 180,
    });

    const result2 = await getUserProfile(testUserId);

    // Birth date and name should remain unchanged
    expect(result2?.birthDate).toBe(birthDate);
    expect(result2?.fullName).toBe(fullName);
    expect(result2?.height).toBe(180);
  });

  it("should handle consecutive date changes correctly", async () => {
    const date1 = "1990-05-15";
    const date2 = "1992-03-20";
    const date3 = "1988-11-10";

    // Change 1
    await updateUserProfile(testUserId, {
      birthDate: date1,
    });
    let result = await getUserProfile(testUserId);
    expect(result?.birthDate).toBe(date1);

    // Change 2
    await updateUserProfile(testUserId, {
      birthDate: date2,
    });
    result = await getUserProfile(testUserId);
    expect(result?.birthDate).toBe(date2);

    // Change 3
    await updateUserProfile(testUserId, {
      birthDate: date3,
    });
    result = await getUserProfile(testUserId);
    expect(result?.birthDate).toBe(date3);
  });

  it("should preserve birth date when updating other fields", async () => {
    const birthDate = "1985-12-25";
    const initialName = "Initial Name";

    // Set initial data
    await updateUserProfile(testUserId, {
      birthDate: birthDate,
      fullName: initialName,
    });

    // Update multiple other fields
    await updateUserProfile(testUserId, {
      height: 185,
      currentWeight: 80,
      targetWeight: 75,
      dailyCalorieGoal: 2200,
    });

    const result = await getUserProfile(testUserId);

    // Birth date should not change
    expect(result?.birthDate).toBe(birthDate);
    expect(result?.fullName).toBe(initialName);
    expect(result?.height).toBe(185);
    expect(result?.currentWeight).toBe("80.00");
  });
});
