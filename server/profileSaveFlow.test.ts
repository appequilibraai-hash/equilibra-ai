import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserProfile, getUserProfile } from "./db";

describe("Profile Save Flow - Complete Integration", () => {
  let testUserId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const result = await db
      .insert(users)
      .values({
        openId: `test-save-flow-${Date.now()}`,
        name: "Save Flow Test User",
        email: "saveflow@example.com",
        role: "user",
      });

    testUserId = result[0].insertId;
  });

  afterAll(async () => {
    if (!db || !testUserId) return;
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should save personal information fields correctly", async () => {
    const updates = {
      fullName: "João da Silva",
      sex: "male" as const,
      birthDate: new Date("1990-05-15"),
      mainObjective: "gain_muscle" as const,
    };

    // Simulate what handleSave does
    const result = await updateUserProfile(testUserId, updates);

    expect(result).toBeDefined();
    expect(result?.fullName).toBe("João da Silva");
    expect(result?.sex).toBe("male");
    expect(result?.mainObjective).toBe("gain_muscle");

    // Verify by fetching directly
    const fetched = await getUserProfile(testUserId);
    expect(fetched?.fullName).toBe("João da Silva");
    expect(fetched?.sex).toBe("male");
    expect(fetched?.birthDate).toBeDefined();
  });

  it("should save nutritional goals correctly", async () => {
    const updates = {
      dailyCalorieGoal: 2500,
      dailyProteinGoal: 150,
      dailyCarbsGoal: 300,
      dailyFatGoal: 85,
    };

    const result = await updateUserProfile(testUserId, updates);

    expect(result?.dailyCalorieGoal).toBe(2500);
    expect(result?.dailyProteinGoal).toBe(150);
    expect(result?.dailyCarbsGoal).toBe(300);
    expect(result?.dailyFatGoal).toBe(85);
  });

  it("should save physical data correctly", async () => {
    const updates = {
      height: 180,
      currentWeight: 78,
      targetWeight: 82,
    };

    const result = await updateUserProfile(testUserId, updates);

    expect(result?.height).toBe(180);
    // Database returns decimals as strings
    expect(result?.currentWeight).toBe("78.00");
    expect(result?.targetWeight).toBe("82.00");
  });

  it("should persist data after multiple saves", async () => {
    // First save
    await updateUserProfile(testUserId, {
      fullName: "First Save",
      dailyCalorieGoal: 2000,
    });

    // Second save - should not lose first save data
    await updateUserProfile(testUserId, {
      height: 175,
    });

    // Verify both saves persisted
    const fetched = await getUserProfile(testUserId);
    expect(fetched?.fullName).toBe("First Save"); // From first save
    expect(fetched?.height).toBe(175); // From second save
    expect(fetched?.dailyCalorieGoal).toBe(2000); // From first save
    expect(fetched?.currentWeight).toBe("78.00"); // From previous test
  });

  it("should save blacklisted foods correctly", async () => {
    const updates = {
      blacklistedFoods: ["peanuts", "shellfish", "dairy"],
    };

    const result = await updateUserProfile(testUserId, updates);

    expect(result?.blacklistedFoods).toEqual(["peanuts", "shellfish", "dairy"]);

    // Verify by fetching
    const fetched = await getUserProfile(testUserId);
    expect(fetched?.blacklistedFoods).toEqual(["peanuts", "shellfish", "dairy"]);
  });

  it("should handle undefined values correctly (not overwrite)", async () => {
    // Set initial data
    await updateUserProfile(testUserId, {
      fullName: "Test Name",
      dailyCalorieGoal: 2200,
    });

    // Update with only one field (other should remain)
    await updateUserProfile(testUserId, {
      height: 172,
      // fullName and dailyCalorieGoal are undefined - should not be overwritten
    });

    // Verify data persistence
    const fetched = await getUserProfile(testUserId);
    expect(fetched?.fullName).toBe("Test Name"); // Should still exist
    expect(fetched?.dailyCalorieGoal).toBe(2200); // Should still exist
    expect(fetched?.height).toBe(172); // Should be updated
  });
});
