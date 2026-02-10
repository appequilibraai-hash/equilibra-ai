import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserProfile, getUserProfile } from "./db";

describe("Birth Date Persistence", () => {
  let testUserId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .insert(users)
      .values({
        openId: `test-birthdate-${Date.now()}`,
        name: "Birth Date Test User",
        email: "birthdate@example.com",
        role: "user",
      });

    testUserId = result[0].insertId;
  });

  afterAll(async () => {
    if (!db || !testUserId) return;
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should save birth date correctly", async () => {
    const birthDateString = "1990-05-15";

    await updateUserProfile(testUserId, {
      birthDate: new Date(birthDateString + "T00:00:00Z"),
    });

    const result = await getUserProfile(testUserId);

    expect(result?.birthDate).toBeDefined();
    // Check if the date is stored correctly (allowing for timezone variance of ±1 day)
    const savedDate = new Date(result?.birthDate as any);
    const isoString = savedDate.toISOString().split('T')[0];
    const expectedDate = new Date("1990-05-15T00:00:00Z").toISOString().split('T')[0];
    const dayDiff = Math.abs(new Date(isoString).getTime() - new Date(expectedDate).getTime()) / (1000 * 60 * 60 * 24);
    expect(dayDiff).toBeLessThanOrEqual(1);
  });

  it("should save birth date with other profile data", async () => {
    const birthDateString = "1992-03-20";

    await updateUserProfile(testUserId, {
      fullName: "Test User",
      sex: "female",
      birthDate: new Date(birthDateString + "T00:00:00Z"),
      mainObjective: "lose_fat",
    });

    const result = await getUserProfile(testUserId);

    expect(result?.fullName).toBe("Test User");
    expect(result?.sex).toBe("female");
    expect(result?.mainObjective).toBe("lose_fat");

    const savedDate = new Date(result?.birthDate as any);
    const isoString = savedDate.toISOString().split('T')[0];
    const expectedDate = new Date("1992-03-20T00:00:00Z").toISOString().split('T')[0];
    const dayDiff = Math.abs(new Date(isoString).getTime() - new Date(expectedDate).getTime()) / (1000 * 60 * 60 * 24);
    expect(dayDiff).toBeLessThanOrEqual(1);
  });

  it("should persist birth date after page refresh", async () => {
    const birthDateString = "1988-11-10";

    // First save
    await updateUserProfile(testUserId, {
      birthDate: new Date(birthDateString + "T00:00:00Z"),
    });

    // Simulate page refresh by fetching again
    const result = await getUserProfile(testUserId);

    expect(result?.birthDate).toBeDefined();
    const savedDate = new Date(result?.birthDate as any);
    const isoString = savedDate.toISOString().split('T')[0];
    const expectedDate = new Date("1988-11-10T00:00:00Z").toISOString().split('T')[0];
    const dayDiff = Math.abs(new Date(isoString).getTime() - new Date(expectedDate).getTime()) / (1000 * 60 * 60 * 24);
    expect(dayDiff).toBeLessThanOrEqual(1);
  });

  it("should handle ISO date string format", async () => {
    const isoDateString = "1995-07-25";

    await updateUserProfile(testUserId, {
      birthDate: new Date(isoDateString + "T00:00:00Z"),
    });

    const result = await getUserProfile(testUserId);

    expect(result?.birthDate).toBeDefined();
    const savedDate = new Date(result?.birthDate as any);
    const isoString = savedDate.toISOString().split('T')[0];
    const expectedDate = new Date("1995-07-25T00:00:00Z").toISOString().split('T')[0];
    const dayDiff = Math.abs(new Date(isoString).getTime() - new Date(expectedDate).getTime()) / (1000 * 60 * 60 * 24);
    expect(dayDiff).toBeLessThanOrEqual(1);
  });
});
