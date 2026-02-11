import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Profile Persistence", () => {
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

  it("should create new profile when updating non-existent user", async () => {
    const updates = {
      fullName: "João Silva",
      sex: "male" as const,
      birthDate: "1990-01-15",
      mainObjective: "gain_muscle" as const,
      height: 180,
      currentWeight: 75,
      targetWeight: 80,
      dailyCalorieGoal: 2500,
      dailyProteinGoal: 150,
      dailyCarbsGoal: 300,
      dailyFatGoal: 80,
    };

    // Insert profile
    await db.insert(userProfiles).values({
      userId: testUserId,
      ...updates,
    });

    // Verify it was saved
    const result = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, testUserId))
      .limit(1);

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("João Silva");
    expect(result[0].sex).toBe("male");
    expect(result[0].height).toBe(180);
    expect(result[0].currentWeight).toBe("75.00"); // Decimal stored as string
    expect(result[0].dailyCalorieGoal).toBe(2500);
  });

  it("should update existing profile", async () => {
    const updates = {
      fullName: "Maria Santos",
      currentWeight: 70,
      dailyCalorieGoal: 2000,
    };

    // Update profile
    await db
      .update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.userId, testUserId));

    // Verify update
    const result = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, testUserId))
      .limit(1);

    expect(result[0].fullName).toBe("Maria Santos");
    expect(result[0].currentWeight).toBe("70.00");
    expect(result[0].dailyCalorieGoal).toBe(2000);
  });

  it("should persist all fields correctly", async () => {
    const fullUpdate = {
      fullName: "Complete Test",
      sex: "female" as const,
      birthDate: "1995-06-20",
      mainObjective: "lose_fat" as const,
      height: 165,
      currentWeight: 65,
      targetWeight: 60,
      activityType: "gym,running",
      activityLevel: "active" as const,
      dailyCalorieGoal: 1800,
      dailyProteinGoal: 120,
      dailyCarbsGoal: 200,
      dailyFatGoal: 60,
      blacklistedFoods: ["peanuts", "shellfish"],
    };

    await db
      .update(userProfiles)
      .set(fullUpdate)
      .where(eq(userProfiles.userId, testUserId));

    const result = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, testUserId))
      .limit(1);

    expect(result[0].fullName).toBe("Complete Test");
    expect(result[0].sex).toBe("female");
    expect(result[0].height).toBe(165);
    expect(result[0].activityType).toBe("gym,running");
    expect(result[0].activityLevel).toBe("active");
    expect(result[0].blacklistedFoods).toEqual(["peanuts", "shellfish"]);
  });
});
