import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profile with nutritional goals and preferences
 */
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  dailyCalorieGoal: int("dailyCalorieGoal").default(2000).notNull(),
  dailyProteinGoal: int("dailyProteinGoal").default(50), // grams
  dailyCarbsGoal: int("dailyCarbsGoal").default(250), // grams
  dailyFatGoal: int("dailyFatGoal").default(65), // grams
  dietaryPreferences: json("dietaryPreferences").$type<string[]>(), // vegetarian, vegan, gluten-free, etc.
  allergies: json("allergies").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Meals table storing analyzed food photos
 */
export const meals = mysqlTable("meals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 512 }),
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack"]).default("snack").notNull(),
  
  // Nutritional analysis results
  totalCalories: int("totalCalories").default(0),
  totalProtein: decimal("totalProtein", { precision: 6, scale: 2 }).default("0"), // grams
  totalCarbs: decimal("totalCarbs", { precision: 6, scale: 2 }).default("0"), // grams
  totalFat: decimal("totalFat", { precision: 6, scale: 2 }).default("0"), // grams
  totalFiber: decimal("totalFiber", { precision: 6, scale: 2 }).default("0"), // grams
  totalSugar: decimal("totalSugar", { precision: 6, scale: 2 }).default("0"), // grams
  totalSodium: decimal("totalSodium", { precision: 6, scale: 2 }).default("0"), // mg
  
  // Detected foods and ingredients
  detectedFoods: json("detectedFoods").$type<DetectedFood[]>(),
  detectedSauces: json("detectedSauces").$type<string[]>(),
  detectedIngredients: json("detectedIngredients").$type<string[]>(),
  
  // Micronutrients
  micronutrients: json("micronutrients").$type<Micronutrient[]>(),
  
  // AI analysis notes
  analysisNotes: text("analysisNotes"),
  
  // Timestamps
  mealTime: timestamp("mealTime").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;

// Type definitions for JSON fields
export interface DetectedFood {
  name: string;
  quantity: string; // e.g., "150g", "1 unidade", "1/2 xícara"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number; // 0-100
}

export interface Micronutrient {
  name: string;
  amount: number;
  unit: string; // mg, mcg, IU, etc.
  percentDailyValue?: number;
}
