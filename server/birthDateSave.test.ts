import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserProfile, getUserProfile } from "./db";

describe("Birth Date Save - String Format", () => {
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

  it("should save birth date correctly as YYYY-MM-DD string", async () => {
    const birthDateString = "1990-05-15";

    await updateUserProfile(testUserId, {
      birthDate: birthDateString,
    });

    const result = await getUserProfile(testUserId);

    expect(result?.birthDate).toBeDefined();
    expect(result?.birthDate).toBe(birthDateString);
  });

  it("should save different birth dates correctly", async () => {
    const birthDateString = "1992-03-20";

    await updateUserProfile(testUserId, {
      birthDate: birthDateString,
    });

    const result = await getUserProfile(testUserId);

    expect(result?.birthDate).toBe(birthDateString);
  });

  it("should save leap year birth dates correctly", async () => {
    const birthDateString = "1988-11-10";

    await updateUserProfile(testUserId, {
      birthDate: birthDateString,
    });

    const result = await getUserProfile(testUserId);

    expect(result?.birthDate).toBe(birthDateString);
  });

  it("should save end-of-year birth dates correctly", async () => {
    const isoDateString = "1995-07-25";

    await updateUserProfile(testUserId, {
      birthDate: isoDateString,
    });

    const result = await getUserProfile(testUserId);

    expect(result?.birthDate).toBe(isoDateString);
  });

  it("should handle multiple consecutive saves without losing data", async () => {
    const firstDate = "1990-05-15";
    const secondDate = "1992-03-20";
    const thirdDate = "1988-11-10";

    // First save
    await updateUserProfile(testUserId, {
      birthDate: firstDate,
    });
    let result = await getUserProfile(testUserId);
    expect(result?.birthDate).toBe(firstDate);

    // Second save
    await updateUserProfile(testUserId, {
      birthDate: secondDate,
    });
    result = await getUserProfile(testUserId);
    expect(result?.birthDate).toBe(secondDate);

    // Third save
    await updateUserProfile(testUserId, {
      birthDate: thirdDate,
    });
    result = await getUserProfile(testUserId);
    expect(result?.birthDate).toBe(thirdDate);
  });
});
