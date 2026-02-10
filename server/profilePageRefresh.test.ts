import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { updateUserProfile, getUserProfile } from "./db";

describe("Profile Data Persistence - Page Refresh Scenario", () => {
  let testUserId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const result = await db
      .insert(users)
      .values({
        openId: `test-refresh-${Date.now()}`,
        name: "Refresh Test User",
        email: "refresh@example.com",
        role: "user",
      });

    testUserId = result[0].insertId;
  });

  afterAll(async () => {
    if (!db || !testUserId) return;
    await db.delete(userProfiles).where(eq(userProfiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should persist data after page refresh (simulate user workflow)", async () => {
    // Step 1: User fills in personal information
    const personalInfo = {
      fullName: "Maria Silva Santos",
      sex: "female" as const,
      birthDate: new Date("1992-03-20"),
      mainObjective: "lose_fat" as const,
    };

    // Step 2: User fills in physical data
    const physicalData = {
      height: 165,
      currentWeight: 72,
      targetWeight: 65,
    };

    // Step 3: User fills in nutritional goals
    const nutritionalGoals = {
      dailyCalorieGoal: 1800,
      dailyProteinGoal: 120,
      dailyCarbsGoal: 200,
      dailyFatGoal: 60,
    };

    // Step 4: User clicks Save (all data is sent together)
    const allUpdates = {
      ...personalInfo,
      ...physicalData,
      ...nutritionalGoals,
    };

    await updateUserProfile(testUserId, allUpdates);

    // Step 5: User refreshes the page (simulate by fetching from DB)
    const refreshedData = await getUserProfile(testUserId);

    // Verify all data persisted after refresh
    expect(refreshedData?.fullName).toBe("Maria Silva Santos");
    expect(refreshedData?.sex).toBe("female");
    expect(refreshedData?.mainObjective).toBe("lose_fat");
    expect(refreshedData?.height).toBe(165);
    expect(refreshedData?.dailyCalorieGoal).toBe(1800);
    expect(refreshedData?.dailyProteinGoal).toBe(120);
  });

  it("should not lose data when switching between tabs", async () => {
    // Simulate: User is on "Informações Pessoais" tab, saves data
    const tab1Data = {
      fullName: "João Pedro",
      sex: "male" as const,
      birthDate: new Date("1988-11-10"),
    };

    await updateUserProfile(testUserId, tab1Data);

    // Simulate: User switches to "Metas Nutricionais" tab, saves data
    const tab2Data = {
      dailyCalorieGoal: 2500,
      dailyProteinGoal: 150,
      dailyCarbsGoal: 300,
      dailyFatGoal: 85,
    };

    await updateUserProfile(testUserId, tab2Data);

    // Simulate: User switches back to "Informações Pessoais" tab
    // Data from tab 1 should still be there
    const data = await getUserProfile(testUserId);

    expect(data?.fullName).toBe("João Pedro"); // From tab 1
    expect(data?.sex).toBe("male"); // From tab 1
    expect(data?.dailyCalorieGoal).toBe(2500); // From tab 2 (should persist)
    expect(data?.dailyProteinGoal).toBe(150); // From tab 2 (should persist)
  });

  it("should handle partial updates without losing other fields", async () => {
    // Initial complete profile
    const initialProfile = {
      fullName: "Complete Profile",
      sex: "female" as const,
      birthDate: new Date("1995-05-15"),
      mainObjective: "maintain" as const,
      height: 170,
      currentWeight: 65,
      targetWeight: 65,
      dailyCalorieGoal: 2000,
      dailyProteinGoal: 130,
      dailyCarbsGoal: 250,
      dailyFatGoal: 65,
      blacklistedFoods: ["nuts", "dairy"],
    };

    await updateUserProfile(testUserId, initialProfile);

    // User updates only one field (e.g., changes weight)
    await updateUserProfile(testUserId, {
      currentWeight: 64,
    });

    // All other fields should still exist
    const result = await getUserProfile(testUserId);

    expect(result?.fullName).toBe("Complete Profile");
    expect(result?.sex).toBe("female");
    expect(result?.height).toBe(170);
    expect(result?.currentWeight).toBe("64.00"); // Updated
    expect(result?.dailyCalorieGoal).toBe(2000); // Unchanged
    expect(result?.blacklistedFoods).toEqual(["nuts", "dairy"]); // Unchanged
  });

  it("should correctly load data from database on component mount", async () => {
    // Simulate: User saves profile data
    const profileData = {
      fullName: "Test User Complete",
      sex: "male" as const,
      birthDate: new Date("1990-01-01"),
      mainObjective: "gain_muscle" as const,
      height: 180,
      currentWeight: 85,
      targetWeight: 90,
      dailyCalorieGoal: 3000,
      dailyProteinGoal: 180,
      dailyCarbsGoal: 350,
      dailyFatGoal: 100,
    };

    await updateUserProfile(testUserId, profileData);

    // Simulate: Component mounts and calls getUserProfile (like useEffect does)
    const loadedProfile = await getUserProfile(testUserId);

    // Verify all fields are loaded correctly for form population
    expect(loadedProfile).toBeDefined();
    expect(loadedProfile?.fullName).toBe("Test User Complete");
    expect(loadedProfile?.sex).toBe("male");
    expect(loadedProfile?.birthDate).toBeDefined();
    expect(loadedProfile?.mainObjective).toBe("gain_muscle");
    expect(loadedProfile?.height).toBe(180);
    expect(loadedProfile?.dailyCalorieGoal).toBe(3000);

    // These fields should be populated in the form
    expect(loadedProfile?.fullName).not.toBeNull();
    expect(loadedProfile?.sex).not.toBeNull();
    expect(loadedProfile?.mainObjective).not.toBeNull();
  });
});
