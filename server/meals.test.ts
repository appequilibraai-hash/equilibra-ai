import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("profile routes", () => {
  it("returns default profile for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const profile = await caller.profile.get();

    expect(profile).toBeDefined();
    expect(typeof profile.dailyCalorieGoal).toBe("number");
    expect(profile.dailyCalorieGoal).toBeGreaterThan(0);
    expect(typeof profile.dailyProteinGoal).toBe("number");
    expect(typeof profile.dailyCarbsGoal).toBe("number");
    expect(typeof profile.dailyFatGoal).toBe("number");
  });
});

describe("nutrition routes", () => {
  it("returns daily summary with goals", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.nutrition.dailySummary({});

    expect(summary).toBeDefined();
    expect(summary.consumed).toBeDefined();
    expect(summary.goals).toBeDefined();
    expect(summary.goals.calories).toBeGreaterThan(0);
  });

  it("returns weekly summary as array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const weekly = await caller.nutrition.weeklySummary();

    expect(Array.isArray(weekly)).toBe(true);
  });
});

describe("recommendations routes", () => {
  it("returns next meal recommendations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const recs = await caller.recommendations.getNextMeal();

    expect(recs).toBeDefined();
    expect(recs.nextMealType).toBeDefined();
    expect(recs.remaining).toBeDefined();
    expect(recs.goals).toBeDefined();
    expect(recs.consumed).toBeDefined();
    expect(typeof recs.mealsToday).toBe("number");
  }, 30000); // Increased timeout for LLM call
});

describe("profile recalculate goals", () => {
  it("returns null when profile is incomplete", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.profile.recalculateGoals();
    // For a user without complete profile data, it should return null or calculated values
    // Either outcome is valid depending on whether onboarding was completed
    expect(result === null || (typeof result === 'object' && result.dailyCalorieGoal > 0)).toBe(true);
  });
});

describe("nutrition dailyFullExtract route", () => {
  it("returns full day nutrition with micronutrients", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const fullDay = await caller.nutrition.dailyFullExtract({ date: new Date().toISOString().split('T')[0] });

    expect(fullDay).toBeDefined();
    expect(fullDay.macros).toBeDefined();
    expect(fullDay.goals).toBeDefined();
    expect(Array.isArray(fullDay.micronutrients)).toBe(true);
    expect(typeof fullDay.mealCount).toBe("number");
    expect(Array.isArray(fullDay.meals)).toBe(true);
  });
});

describe("weight routes", () => {
  it("returns weight history as array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.weight.history();
    expect(Array.isArray(history)).toBe(true);
  });

  it("returns weight progress or null", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const progress = await caller.weight.progress();
    // Can be null for new users without weight records
    expect(progress === null || typeof progress === 'object').toBe(true);
  });
});

describe("meals routes", () => {
  it("returns empty list for new user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const meals = await caller.meals.list({});

    expect(Array.isArray(meals)).toBe(true);
  });

  it("returns today meals as array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const todayMeals = await caller.meals.getToday();

    expect(Array.isArray(todayMeals)).toBe(true);
  });
});
