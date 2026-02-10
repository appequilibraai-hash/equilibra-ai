import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userProfiles, meals, weightHistory, InsertUserProfile, InsertMeal, UserProfile, Meal, InsertWeightHistory, WeightHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "username"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserOnboarding(userId: number, completed: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ onboardingCompleted: completed ? 1 : 0 })
    .where(eq(users.id, userId));
}

// ============ USER PROFILE FUNCTIONS ============

export async function getUserProfile(userId: number): Promise<UserProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.insert(userProfiles).values(profile).onDuplicateKeyUpdate({
    set: {
      fullName: profile.fullName,
      sex: profile.sex,
      birthDate: profile.birthDate,
      mainObjective: profile.mainObjective,
      height: profile.height,
      currentWeight: profile.currentWeight,
      targetWeight: profile.targetWeight,
      activityType: profile.activityType,
      activityLevel: profile.activityLevel,
      dailyCalorieGoal: profile.dailyCalorieGoal,
      dailyProteinGoal: profile.dailyProteinGoal,
      dailyCarbsGoal: profile.dailyCarbsGoal,
      dailyFatGoal: profile.dailyFatGoal,
      dietaryPreferences: profile.dietaryPreferences,
      allergies: profile.allergies,
      blacklistedFoods: profile.blacklistedFoods,
    },
  });

  return getUserProfile(profile.userId);
}

export async function updateUserProfile(
  userId: number,
  updates: Partial<InsertUserProfile>
): Promise<UserProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(userProfiles)
    .set(updates)
    .where(eq(userProfiles.userId, userId));

  return getUserProfile(userId);
}

// ============ WEIGHT HISTORY FUNCTIONS ============

export async function addWeightRecord(record: InsertWeightHistory): Promise<WeightHistory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(weightHistory).values(record);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(weightHistory).where(eq(weightHistory.id, insertId)).limit(1);
  return created[0];
}

export async function getWeightHistory(userId: number, limit = 100): Promise<WeightHistory[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(weightHistory)
    .where(eq(weightHistory.userId, userId))
    .orderBy(desc(weightHistory.recordedAt))
    .limit(limit);
}

export async function getWeightProgress(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const history = await db.select().from(weightHistory)
    .where(eq(weightHistory.userId, userId))
    .orderBy(weightHistory.recordedAt);

  if (history.length < 2) return null;

  const firstRecord = history[0];
  const lastRecord = history[history.length - 1];
  const totalChange = Number(lastRecord.weight) - Number(firstRecord.weight);
  const daysDiff = Math.ceil((new Date(lastRecord.recordedAt).getTime() - new Date(firstRecord.recordedAt).getTime()) / (1000 * 60 * 60 * 24));
  const avgChangePerDay = daysDiff > 0 ? totalChange / daysDiff : 0;

  return {
    history,
    totalChange,
    daysDiff,
    avgChangePerDay,
    startWeight: Number(firstRecord.weight),
    currentWeight: Number(lastRecord.weight),
  };
}

// ============ MEAL FUNCTIONS ============

export async function createMeal(meal: InsertMeal): Promise<Meal | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(meals).values(meal);
  const insertId = result[0].insertId;
  
  const created = await db.select().from(meals).where(eq(meals.id, insertId)).limit(1);
  return created[0];
}

export async function getMealById(mealId: number, userId: number): Promise<Meal | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
    .limit(1);
  return result[0];
}

export async function getUserMeals(userId: number, limit = 50, offset = 0): Promise<Meal[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(meals)
    .where(eq(meals.userId, userId))
    .orderBy(desc(meals.mealTime))
    .limit(limit)
    .offset(offset);
}

export async function getMealsByDateRange(
  userId: number, 
  startDate: Date, 
  endDate: Date
): Promise<Meal[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(meals)
    .where(and(
      eq(meals.userId, userId),
      gte(meals.mealTime, startDate),
      lte(meals.mealTime, endDate)
    ))
    .orderBy(desc(meals.mealTime));
}

export async function getTodayMeals(userId: number): Promise<Meal[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getMealsByDateRange(userId, today, tomorrow);
}

export async function getDailyNutritionSummary(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return null;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const result = await db.select({
    totalCalories: sql<number>`COALESCE(SUM(${meals.totalCalories}), 0)`,
    totalProtein: sql<number>`COALESCE(SUM(${meals.totalProtein}), 0)`,
    totalCarbs: sql<number>`COALESCE(SUM(${meals.totalCarbs}), 0)`,
    totalFat: sql<number>`COALESCE(SUM(${meals.totalFat}), 0)`,
    mealCount: sql<number>`COUNT(*)`,
  }).from(meals)
    .where(and(
      eq(meals.userId, userId),
      gte(meals.mealTime, startOfDay),
      lte(meals.mealTime, endOfDay)
    ));

  return result[0];
}

export async function getWeeklyNutritionSummary(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const result = await db.execute(sql`
    SELECT 
      DATE(mealTime) as date,
      COALESCE(SUM(totalCalories), 0) as totalCalories,
      COALESCE(SUM(totalProtein), 0) as totalProtein,
      COALESCE(SUM(totalCarbs), 0) as totalCarbs,
      COALESCE(SUM(totalFat), 0) as totalFat,
      COUNT(*) as mealCount
    FROM meals
    WHERE userId = ${userId}
      AND mealTime >= ${startDate}
      AND mealTime <= ${endDate}
    GROUP BY DATE(mealTime)
    ORDER BY DATE(mealTime)
  `);

  return (result as unknown as any[][])[0] || [];
}

export async function getMealsByDate(userId: number, date: Date): Promise<Meal[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  return getMealsByDateRange(userId, startOfDay, endOfDay);
}

export async function getWeeklyNutritionSummaryForDate(userId: number, referenceDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const endDate = new Date(referenceDate);
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  const result = await db.execute(sql`
    SELECT 
      DATE(mealTime) as date,
      COALESCE(SUM(totalCalories), 0) as totalCalories,
      COALESCE(SUM(totalProtein), 0) as totalProtein,
      COALESCE(SUM(totalCarbs), 0) as totalCarbs,
      COALESCE(SUM(totalFat), 0) as totalFat,
      COALESCE(SUM(totalFiber), 0) as totalFiber,
      COALESCE(SUM(totalSugar), 0) as totalSugar,
      COALESCE(SUM(totalSodium), 0) as totalSodium,
      COUNT(*) as mealCount
    FROM meals
    WHERE userId = ${userId}
      AND mealTime >= ${startDate}
      AND mealTime <= ${endDate}
    GROUP BY DATE(mealTime)
    ORDER BY DATE(mealTime)
  `);

  return (result as unknown as any[][])[0] || [];
}

export async function deleteMeal(mealId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.delete(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
  
  return result[0].affectedRows > 0;
}

export async function updateMeal(
  mealId: number, 
  userId: number, 
  updates: Partial<InsertMeal>
): Promise<Meal | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(meals)
    .set(updates)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));

  return getMealById(mealId, userId);
}
