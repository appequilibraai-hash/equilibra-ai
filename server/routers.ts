import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import {
  getUserProfile,
  upsertUserProfile,
  updateUserProfile,
  updateUserOnboarding,
  createMeal,
  getMealById,
  getUserMeals,
  getTodayMeals,
  getDailyNutritionSummary,
  getWeeklyNutritionSummary,
  getWeeklyNutritionSummaryForDate,
  deleteMeal,
  getMealsByDate,
  getMealsByDateRange,
  addWeightRecord,
  getWeightHistory,
  getWeightProgress,
} from "./db";
import { DetectedFood, Micronutrient } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ ONBOARDING ============
  onboarding: router({
    complete: protectedProcedure
      .input(z.object({
        username: z.string().min(3).max(64),
        sex: z.enum(["male", "female", "other"]),
        birthDate: z.string(),
        height: z.number().min(100).max(250),
        currentWeight: z.number().min(30).max(300),
        targetWeight: z.number().min(30).max(300),
        activityTypes: z.array(z.string()).min(1),
        activityFrequencies: z.record(z.string(), z.number().min(1).max(7)).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Calculate recommended daily calories based on Harris-Benedict equation
        const birthDate = new Date(input.birthDate);
        const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        
        let bmr: number;
        if (input.sex === "male") {
          bmr = 88.362 + (13.397 * input.currentWeight) + (4.799 * input.height) - (5.677 * age);
        } else {
          bmr = 447.593 + (9.247 * input.currentWeight) + (3.098 * input.height) - (4.330 * age);
        }

        // Calculate weighted activity multiplier based on individual frequencies
        const isSedentary = input.activityTypes.includes("sedentary");
        let multiplier = 1.2;
        if (!isSedentary && input.activityFrequencies) {
          const totalDays = Object.values(input.activityFrequencies).reduce((a, b) => a + b, 0);
          const cappedDays = Math.min(totalDays, 7);
          if (cappedDays <= 1) multiplier = 1.2;
          else if (cappedDays <= 3) multiplier = 1.375;
          else if (cappedDays <= 5) multiplier = 1.55;
          else multiplier = 1.725;
        }

        const tdee = Math.round(bmr * multiplier);
        
        // Adjust for weight goal
        let dailyCalorieGoal = tdee;
        if (input.targetWeight < input.currentWeight) {
          dailyCalorieGoal = Math.max(1200, tdee - 500); // Deficit for weight loss
        } else if (input.targetWeight > input.currentWeight) {
          dailyCalorieGoal = tdee + 300; // Surplus for weight gain
        }

        // Calculate macro goals (balanced approach)
        const proteinMultiplier = isSedentary ? 1.2 : 1.6;
        const dailyProteinGoal = Math.round(input.currentWeight * proteinMultiplier);
        const dailyFatGoal = Math.round((dailyCalorieGoal * 0.25) / 9); // 25% from fat
        const dailyCarbsGoal = Math.round((dailyCalorieGoal - (dailyProteinGoal * 4) - (dailyFatGoal * 9)) / 4);

        // Create/update profile
        await upsertUserProfile({
          userId: ctx.user.id,
          sex: input.sex,
          birthDate: input.birthDate ? (() => { const d = new Date(input.birthDate); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; })() : undefined,
          height: input.height,
          currentWeight: String(input.currentWeight),
          targetWeight: String(input.targetWeight),
          activityType: input.activityTypes.join(","),
          activityFrequencies: input.activityFrequencies || {},
          dailyCalorieGoal,
          dailyProteinGoal,
          dailyCarbsGoal,
          dailyFatGoal,
        });

        // Add initial weight record
        await addWeightRecord({
          userId: ctx.user.id,
          weight: String(input.currentWeight),
        });

        // Mark onboarding as complete
        await updateUserOnboarding(ctx.user.id, true);

        return { success: true, dailyCalorieGoal, dailyProteinGoal, dailyCarbsGoal, dailyFatGoal };
      }),
  }),

  // ============ USER PROFILE ============
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getUserProfile(ctx.user.id);
      return profile || {
        userId: ctx.user.id,
        dailyCalorieGoal: 2000,
        dailyProteinGoal: 50,
        dailyCarbsGoal: 250,
        dailyFatGoal: 65,
        dietaryPreferences: [],
        allergies: [],
      };
    }),

    update: protectedProcedure
      .input(z.object({
        fullName: z.string().optional(),
        sex: z.enum(["male", "female", "other"]).optional(),
        birthDate: z.string().optional(),
        mainObjective: z.enum(["lose_fat", "maintain", "gain_muscle"]).optional(),
        height: z.number().min(100).max(250).optional(),
        currentWeight: z.number().min(30).max(300).optional(),
        targetWeight: z.number().min(30).max(300).optional(),
        activityType: z.string().optional(),
        activityFrequency: z.number().min(0).max(7).optional(),
        activityFrequencies: z.record(z.string(), z.number().min(1).max(7)).optional(),
        dailyCalorieGoal: z.number().min(500).max(10000).optional(),
        dailyProteinGoal: z.number().min(0).max(500).optional(),
        dailyCarbsGoal: z.number().min(0).max(1000).optional(),
        dailyFatGoal: z.number().min(0).max(500).optional(),
        dietaryPreferences: z.array(z.string()).optional(),
        allergies: z.array(z.string()).optional(),
        blacklistedFoods: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updates: Record<string, any> = {};
        if (input.fullName !== undefined) updates.fullName = input.fullName;
        if (input.sex !== undefined) updates.sex = input.sex;
        if (input.birthDate !== undefined) {
          // Extract only the date part (YYYY-MM-DD) to avoid timezone issues
          const date = new Date(input.birthDate);
          updates.birthDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
        }
        if (input.mainObjective !== undefined) updates.mainObjective = input.mainObjective;
        if (input.height !== undefined) updates.height = input.height;
        if (input.currentWeight !== undefined) updates.currentWeight = input.currentWeight;
        if (input.targetWeight !== undefined) updates.targetWeight = input.targetWeight;
        if (input.activityType !== undefined) updates.activityType = input.activityType;
        if (input.activityFrequency !== undefined) updates.activityFrequency = input.activityFrequency;
        if (input.activityFrequencies !== undefined) updates.activityFrequencies = input.activityFrequencies;
        if (input.dailyCalorieGoal !== undefined) updates.dailyCalorieGoal = input.dailyCalorieGoal;
        if (input.dailyProteinGoal !== undefined) updates.dailyProteinGoal = input.dailyProteinGoal;
        if (input.dailyCarbsGoal !== undefined) updates.dailyCarbsGoal = input.dailyCarbsGoal;
        if (input.dailyFatGoal !== undefined) updates.dailyFatGoal = input.dailyFatGoal;
        if (input.dietaryPreferences !== undefined) updates.dietaryPreferences = input.dietaryPreferences;
        if (input.allergies !== undefined) updates.allergies = input.allergies;
        if (input.blacklistedFoods !== undefined) updates.blacklistedFoods = input.blacklistedFoods;
        
        return updateUserProfile(ctx.user.id, updates);
      }),

    // Recalculate goals automatically based on Harris-Benedict
    recalculateGoals: protectedProcedure.mutation(async ({ ctx }) => {
      const profile = await getUserProfile(ctx.user.id);
      if (!profile || !profile.birthDate || !profile.sex || !profile.height || !profile.currentWeight || !profile.targetWeight) {
        return null;
      }

      const birthDate = new Date(profile.birthDate);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const weight = Number(profile.currentWeight);
      const height = Number(profile.height);
      const targetWeight = Number(profile.targetWeight);

      let bmr: number;
      if (profile.sex === "male") {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }

      const actType = profile.activityType || "sedentary";
      const isSedentary = actType === "sedentary" || actType.includes("sedentary");
      const freqs = (profile as any).activityFrequencies as Record<string, number> | null;
      let multiplier = 1.2;
      if (!isSedentary) {
        const totalDays = freqs ? Object.values(freqs).reduce((a, b) => a + b, 0) : (profile.activityFrequency || 3);
        const cappedDays = Math.min(totalDays, 7);
        if (cappedDays <= 1) multiplier = 1.2;
        else if (cappedDays <= 3) multiplier = 1.375;
        else if (cappedDays <= 5) multiplier = 1.55;
        else multiplier = 1.725;
      }

      const tdee = Math.round(bmr * multiplier);
      let dailyCalorieGoal = tdee;
      if (targetWeight < weight) {
        dailyCalorieGoal = Math.max(1200, tdee - 500);
      } else if (targetWeight > weight) {
        dailyCalorieGoal = tdee + 300;
      }

      const dailyProteinGoal = Math.round(weight * (!isSedentary ? 1.8 : 1.2));
      const dailyFatGoal = Math.round((dailyCalorieGoal * 0.25) / 9);
      const dailyCarbsGoal = Math.round((dailyCalorieGoal - (dailyProteinGoal * 4) - (dailyFatGoal * 9)) / 4);

      await updateUserProfile(ctx.user.id, {
        dailyCalorieGoal,
        dailyProteinGoal,
        dailyCarbsGoal,
        dailyFatGoal,
      });

      return { dailyCalorieGoal, dailyProteinGoal, dailyCarbsGoal, dailyFatGoal };
    }),
  }),

  // ============ WEIGHT TRACKING ============
  weight: router({
    add: protectedProcedure
      .input(z.object({
        weight: z.number().min(30).max(300),
      }))
      .mutation(async ({ ctx, input }) => {
        // Also update current weight in profile
        await updateUserProfile(ctx.user.id, { currentWeight: String(input.weight) });
        return addWeightRecord({
          userId: ctx.user.id,
          weight: String(input.weight),
        });
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(365).default(100) }).optional())
      .query(async ({ ctx, input }) => {
        return getWeightHistory(ctx.user.id, input?.limit || 100);
      }),

    progress: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getWeightProgress(ctx.user.id);
      const profile = await getUserProfile(ctx.user.id);
      
      if (!progress || !profile) {
        return null;
      }

      // Calculate estimated time to reach goal
      const targetWeight = Number(profile.targetWeight);
      const currentWeight = progress.currentWeight;
      const remainingChange = targetWeight - currentWeight;
      
      let estimatedDaysToGoal: number | null = null;
      if (progress.avgChangePerDay !== 0) {
        const isLosingWeight = remainingChange < 0;
        const isOnTrack = (isLosingWeight && progress.avgChangePerDay < 0) || 
                         (!isLosingWeight && progress.avgChangePerDay > 0);
        
        if (isOnTrack) {
          estimatedDaysToGoal = Math.abs(Math.round(remainingChange / progress.avgChangePerDay));
        }
      }

      return {
        ...progress,
        targetWeight,
        remainingChange,
        estimatedDaysToGoal,
      };
    }),
  }),

  // ============ MEALS ============
  meals: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const { limit = 50, offset = 0 } = input || {};
        return getUserMeals(ctx.user.id, limit, offset);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getMealById(input.id, ctx.user.id);
      }),

    getToday: protectedProcedure.query(async ({ ctx }) => {
      return getTodayMeals(ctx.user.id);
    }),

    getByDateRange: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        return getMealsByDateRange(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate)
        );
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteMeal(input.id, ctx.user.id);
      }),

    // Analyze meal photo WITHOUT saving (for non-logged users or preview)
    analyzeOnly: publicProcedure
      .input(z.object({
        imageBase64: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Upload image to S3 temporarily
        const imageBuffer = Buffer.from(input.imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const fileKey = `temp/${nanoid()}.jpg`;
        const { url: imageUrl } = await storagePut(fileKey, imageBuffer, 'image/jpeg');

        // Analyze image with AI
        const analysisResult = await analyzeFood(imageUrl);

        return {
          imageUrl,
          ...analysisResult,
        };
      }),

    // Save analyzed meal to diary (requires login)
    save: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("snack"),
        mealTime: z.string().optional(),
        totalCalories: z.number(),
        totalProtein: z.number(),
        totalCarbs: z.number(),
        totalFat: z.number(),
        totalFiber: z.number(),
        totalSugar: z.number(),
        totalSodium: z.number(),
        detectedFoods: z.array(z.object({
          name: z.string(),
          quantity: z.string(),
          calories: z.number(),
          protein: z.number(),
          carbs: z.number(),
          fat: z.number(),
          confidence: z.number(),
        })),
        detectedSauces: z.array(z.string()),
        detectedIngredients: z.array(z.string()),
        micronutrients: z.array(z.object({
          name: z.string(),
          amount: z.number(),
          unit: z.string(),
          percentDailyValue: z.number().optional(),
        })),
        analysisNotes: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meal = await createMeal({
          userId: ctx.user.id,
          imageUrl: input.imageUrl,
          mealType: input.mealType,
          mealTime: input.mealTime ? new Date(input.mealTime) : new Date(),
          totalCalories: input.totalCalories,
          totalProtein: String(input.totalProtein),
          totalCarbs: String(input.totalCarbs),
          totalFat: String(input.totalFat),
          totalFiber: String(input.totalFiber),
          totalSugar: String(input.totalSugar),
          totalSodium: String(input.totalSodium),
          detectedFoods: input.detectedFoods,
          detectedSauces: input.detectedSauces,
          detectedIngredients: input.detectedIngredients,
          micronutrients: input.micronutrients,
          analysisNotes: input.analysisNotes,
        });

        return meal;
      }),

    // Legacy: Upload and analyze meal photo (for backwards compatibility)
    analyze: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("snack"),
        mealTime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const imageBuffer = Buffer.from(input.imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const fileKey = `meals/${ctx.user.id}/${nanoid()}.jpg`;
        const { url: imageUrl } = await storagePut(fileKey, imageBuffer, 'image/jpeg');

        const analysisResult = await analyzeFood(imageUrl);

        const meal = await createMeal({
          userId: ctx.user.id,
          imageUrl,
          imageKey: fileKey,
          mealType: input.mealType,
          mealTime: input.mealTime ? new Date(input.mealTime) : new Date(),
          totalCalories: analysisResult.totalCalories,
          totalProtein: String(analysisResult.totalProtein),
          totalCarbs: String(analysisResult.totalCarbs),
          totalFat: String(analysisResult.totalFat),
          totalFiber: String(analysisResult.totalFiber),
          totalSugar: String(analysisResult.totalSugar),
          totalSodium: String(analysisResult.totalSodium),
          detectedFoods: analysisResult.detectedFoods,
          detectedSauces: analysisResult.detectedSauces,
          detectedIngredients: analysisResult.detectedIngredients,
          micronutrients: analysisResult.micronutrients,
          analysisNotes: analysisResult.analysisNotes,
        });

        return meal;
      }),
  }),

  // ============ NUTRITION STATS ============
  nutrition: router({
    dailySummary: protectedProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const date = input?.date ? new Date(input.date) : new Date();
        const summary = await getDailyNutritionSummary(ctx.user.id, date);
        const profile = await getUserProfile(ctx.user.id);
        
        return {
          consumed: summary || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 },
          goals: {
            calories: profile?.dailyCalorieGoal || 2000,
            protein: profile?.dailyProteinGoal || 50,
            carbs: profile?.dailyCarbsGoal || 250,
            fat: profile?.dailyFatGoal || 65,
          },
        };
      }),

    weeklySummary: protectedProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (input?.date) {
          return getWeeklyNutritionSummaryForDate(ctx.user.id, new Date(input.date));
        }
        return getWeeklyNutritionSummary(ctx.user.id);
      }),

    // Full daily extract with all micro and macronutrients
    dailyFullExtract: protectedProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const date = input?.date ? new Date(input.date) : new Date();
        const dayMeals = await getMealsByDate(ctx.user.id, date);
        const summary = await getDailyNutritionSummary(ctx.user.id, date);
        const profile = await getUserProfile(ctx.user.id);

        // Aggregate all micronutrients from all meals
        const microMap = new Map<string, { amount: number; unit: string; percentDailyValue: number }>();
        for (const meal of dayMeals) {
          const micros = (meal.micronutrients as any[]) || [];
          for (const m of micros) {
            const existing = microMap.get(m.name);
            if (existing) {
              existing.amount += m.amount;
              existing.percentDailyValue += (m.percentDailyValue || 0);
            } else {
              microMap.set(m.name, { amount: m.amount, unit: m.unit, percentDailyValue: m.percentDailyValue || 0 });
            }
          }
        }

        const micronutrients = Array.from(microMap.entries()).map(([name, data]) => ({
          name,
          ...data,
        }));

        // Aggregate fiber, sugar, sodium
        let totalFiber = 0, totalSugar = 0, totalSodium = 0;
        for (const meal of dayMeals) {
          totalFiber += Number(meal.totalFiber) || 0;
          totalSugar += Number(meal.totalSugar) || 0;
          totalSodium += Number(meal.totalSodium) || 0;
        }

        return {
          date: date.toISOString().split('T')[0],
          macros: {
            calories: summary?.totalCalories || 0,
            protein: summary?.totalProtein || 0,
            carbs: summary?.totalCarbs || 0,
            fat: summary?.totalFat || 0,
            fiber: totalFiber,
            sugar: totalSugar,
            sodium: totalSodium,
          },
          micronutrients,
          goals: {
            calories: profile?.dailyCalorieGoal || 2000,
            protein: profile?.dailyProteinGoal || 50,
            carbs: profile?.dailyCarbsGoal || 250,
            fat: profile?.dailyFatGoal || 65,
          },
          mealCount: dayMeals.length,
          meals: dayMeals.map(m => ({
            id: m.id,
            mealType: m.mealType,
            mealTime: m.mealTime,
            totalCalories: m.totalCalories,
            imageUrl: m.imageUrl,
            detectedFoods: m.detectedFoods,
          })),
        };
      }),
  }),

  // ============ RECOMMENDATIONS ============
  recommendations: router({
    getNextMeal: protectedProcedure
      .input(z.object({ date: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const date = input?.date ? new Date(input.date) : new Date();
        const dayMeals = await getMealsByDate(ctx.user.id, date);
        const profile = await getUserProfile(ctx.user.id);
        const dailySummary = await getDailyNutritionSummary(ctx.user.id, date);

        const goals = {
          calories: profile?.dailyCalorieGoal || 2000,
          protein: profile?.dailyProteinGoal || 50,
          carbs: profile?.dailyCarbsGoal || 250,
          fat: profile?.dailyFatGoal || 65,
        };

        const consumed = {
          calories: dailySummary?.totalCalories || 0,
          protein: dailySummary?.totalProtein || 0,
          carbs: dailySummary?.totalCarbs || 0,
          fat: dailySummary?.totalFat || 0,
        };

        const remaining = {
          calories: Math.max(0, goals.calories - consumed.calories),
          protein: Math.max(0, goals.protein - consumed.protein),
          carbs: Math.max(0, goals.carbs - consumed.carbs),
          fat: Math.max(0, goals.fat - consumed.fat),
        };

        const hour = new Date().getHours();
        let nextMealType: string;
        if (hour < 10) nextMealType = "café da manhã";
        else if (hour < 14) nextMealType = "almoço";
        else if (hour < 18) nextMealType = "lanche da tarde";
        else nextMealType = "jantar";

        const blacklist = profile?.blacklistedFoods || [];
        const recommendations = await getAIRecommendations(
          remaining,
          nextMealType,
          profile?.dietaryPreferences || [],
          [...(profile?.allergies || []), ...blacklist],
          profile?.activityType || "other"
        );

        // Get micronutrient deficiencies for supplement suggestions
        const microMap = new Map<string, { amount: number; unit: string; percentDailyValue: number }>();
        for (const meal of dayMeals) {
          const micros = (meal.micronutrients as any[]) || [];
          for (const m of micros) {
            const existing = microMap.get(m.name);
            if (existing) {
              existing.amount += m.amount;
              existing.percentDailyValue += (m.percentDailyValue || 0);
            } else {
              microMap.set(m.name, { amount: m.amount, unit: m.unit, percentDailyValue: m.percentDailyValue || 0 });
            }
          }
        }
        const deficientMicros = Array.from(microMap.entries())
          .filter(([_, data]) => data.percentDailyValue < 50)
          .map(([name, data]) => ({ name, ...data }));

        // Get supplement suggestions if there are deficiencies
        let supplements: any[] = [];
        if (deficientMicros.length > 0 && dayMeals.length > 0) {
          supplements = await getSupplementSuggestions(deficientMicros, profile);
        }

        return {
          nextMealType,
          remaining,
          goals,
          consumed,
          recommendations,
          supplements,
          mealsToday: dayMeals.length,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// ============ AI ANALYSIS FUNCTIONS ============

interface FoodAnalysisResult {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  detectedFoods: DetectedFood[];
  detectedSauces: string[];
  detectedIngredients: string[];
  micronutrients: Micronutrient[];
  analysisNotes: string;
}

async function analyzeFood(imageUrl: string): Promise<FoodAnalysisResult> {
  const systemPrompt = `### ROLE
You are an expert AI Nutritionist and Computer Vision Specialist. Your goal is to analyze food images to identify ingredients and estimate their mass (in grams) with high precision using volumetric analysis.
Always respond in Brazilian Portuguese (pt-BR) for food names and notes.

### CORE INSTRUCTION
Analyze the provided image. You must detect food items, estimate their volume based on visual scale, and convert that volume to mass using standard cooked food densities.

### ANALYSIS PROTOCOL (STEP-BY-STEP)

1. **SCALE & REFERENCE DETECTION (The "Cutlery Anchor"):**
   * **Primary Search:** Look for a standard utensil (fork, knife, spoon) placed next to the food.
     * *Assumption:* Standard dinner fork/knife length ≈ 20 cm (8 inches).
     * *Calculation:* Use this object to establish a **Pixels-Per-Centimeter (PPCM)** ratio.
   * **Secondary Search (Container Context):** If no utensil is found, identify the container type.
     * *Standard Plate:* Assume 25cm (10 inches) diameter.
     * *Takeout Box (Marmita):* Assume standard medium volume (approx. 500-600ml capacity).
     * *Bowl:* Assume standard 15cm diameter.

2. **VOLUME ESTIMATION:**
   * **Segmentation:** Identify each distinct food component (e.g., rice, beans, protein, salad).
   * **Area:** Estimate the surface area (cm²) each item covers based on the PPCM ratio.
   * **Depth/Height:** Estimate the pile height (e.g., "flat layer" ≈ 1-2cm, "heaped" ≈ 3-5cm).
   * **Volume Calculation:** Volume (cm³) = Area × Estimated Height.

3. **DENSITY CONVERSION (Physics):**
   * Convert Volume to Mass using **Cooked Density** factors (since food is plated).
   * *Examples:*
     * Cooked Rice/Grains: ~0.70 g/cm³
     * Cooked Beans/Legumes: ~0.85 g/cm³
     * Grilled Meat/Poultry: ~1.00 g/cm³
     * Leafy Greens (Loose): ~0.10 g/cm³
   * *Formula:* Mass (g) = Volume (cm³) × Density (g/cm³).

4. **MACRONUTRIENT ESTIMATION:**
   * Based on the estimated mass, calculate: Calories, Protein (g), Carbs (g), Fats (g).
   * Also estimate: Fiber (g), Sugar (g), Sodium (mg).
   * Also estimate micronutrients when possible.`;

  const userPrompt = `Analyze this meal image using the volumetric analysis protocol.

Return a JSON with the following structure:
{
  "analysis_chain_of_thought": "Briefly explain the scale used and volume calculations",
  "scale_reference_used": "Utensil" | "Plate" | "Container" | "None (Estimation)",
  "totalCalories": total calories number,
  "totalProtein": total protein in grams,
  "totalCarbs": total carbs in grams,
  "totalFat": total fat in grams,
  "totalFiber": total fiber in grams,
  "totalSugar": total sugar in grams,
  "totalSodium": total sodium in milligrams,
  "detectedFoods": [
    {
      "name": "food name in Brazilian Portuguese",
      "quantity": "estimated quantity (e.g., 150g)",
      "calories": calories for this item,
      "protein": protein in grams,
      "carbs": carbs in grams,
      "fat": fat in grams,
      "confidence": confidence level 0-100,
      "estimated_volume_cm3": estimated volume in cm³,
      "density_factor": density factor used (g/cm³),
      "visual_description": "brief visual description of the portion"
    }
  ],
  "detectedSauces": ["list of detected sauces in Portuguese"],
  "detectedIngredients": ["list of all visible ingredients in Portuguese"],
  "micronutrients": [
    {
      "name": "micronutrient name in Portuguese",
      "amount": amount number,
      "unit": "unit (mg, mcg, IU)",
      "percentDailyValue": percentage of daily recommended value
    }
  ],
  "analysisNotes": "observations about the meal, health tips. Include the analysis chain of thought here.",
  "user_feedback_hint": "If confidence is low, suggest improvements for next photo"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "food_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              analysis_chain_of_thought: { type: "string" },
              scale_reference_used: { type: "string" },
              totalCalories: { type: "number" },
              totalProtein: { type: "number" },
              totalCarbs: { type: "number" },
              totalFat: { type: "number" },
              totalFiber: { type: "number" },
              totalSugar: { type: "number" },
              totalSodium: { type: "number" },
              detectedFoods: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    quantity: { type: "string" },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" },
                    confidence: { type: "number" },
                    estimated_volume_cm3: { type: "number" },
                    density_factor: { type: "number" },
                    visual_description: { type: "string" }
                  },
                  required: ["name", "quantity", "calories", "protein", "carbs", "fat", "confidence", "estimated_volume_cm3", "density_factor", "visual_description"],
                  additionalProperties: false
                }
              },
              detectedSauces: { type: "array", items: { type: "string" } },
              detectedIngredients: { type: "array", items: { type: "string" } },
              micronutrients: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    amount: { type: "number" },
                    unit: { type: "string" },
                    percentDailyValue: { type: "number" }
                  },
                  required: ["name", "amount", "unit", "percentDailyValue"],
                  additionalProperties: false
                }
              },
              analysisNotes: { type: "string" },
              user_feedback_hint: { type: "string" }
            },
            required: ["analysis_chain_of_thought", "scale_reference_used", "totalCalories", "totalProtein", "totalCarbs", "totalFat", "totalFiber", "totalSugar", "totalSodium", "detectedFoods", "detectedSauces", "detectedIngredients", "micronutrients", "analysisNotes", "user_feedback_hint"],
            additionalProperties: false
          }
        }
      }
    });

    const message = response.choices[0]?.message;
    const content = typeof message?.content === 'string' ? message.content : '';
    if (!content) throw new Error("No response from AI");

    return JSON.parse(content) as FoodAnalysisResult;
  } catch (error) {
    console.error("Food analysis error:", error);
    return {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      totalSugar: 0,
      totalSodium: 0,
      detectedFoods: [],
      detectedSauces: [],
      detectedIngredients: [],
      micronutrients: [],
      analysisNotes: "Não foi possível analisar a imagem. Por favor, tente novamente com uma foto mais clara.",
    };
  }
}

interface NutritionRemaining {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealRecommendation {
  title: string;
  description: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  ingredients: string[];
  tips: string;
}

async function getAIRecommendations(
  remaining: NutritionRemaining,
  mealType: string,
  preferences: string[],
  allergies: string[],
  activityType: string
): Promise<MealRecommendation[]> {
  const systemPrompt = `Você é um nutricionista esportivo especialista em planejamento de refeições.
Forneça recomendações de refeições saudáveis e equilibradas em português brasileiro.
Considere as preferências alimentares, alergias e tipo de atividade física do usuário.
Foco em refeições que otimizem a performance esportiva e recuperação muscular.
IMPORTANTE: NUNCA recomende receitas que contenham os seguintes ingredientes bloqueados: ${allergies.filter(a => !preferences.includes(a)).join(", ") || "nenhum"}. Verifique cada ingrediente cuidadosamente.`;

  const activityContext = activityType !== "sedentary" 
    ? `O usuário pratica ${activityType}, então priorize alimentos que auxiliem na performance e recuperação.`
    : "";

  const userPrompt = `Com base nas seguintes informações, sugira 3 opções de refeições para ${mealType}:

Calorias restantes para hoje: ${remaining.calories} kcal
Proteína restante: ${remaining.protein}g
Carboidratos restantes: ${remaining.carbs}g
Gordura restante: ${remaining.fat}g

${activityContext}
${preferences.length > 0 ? `Preferências alimentares: ${preferences.join(", ")}` : ""}
${allergies.length > 0 ? `Alergias/Restrições OBRIGATÓRIAS (NUNCA incluir estes ingredientes): ${allergies.join(", ")}` : ""}

Retorne um JSON com array de 3 recomendações:
[
  {
    "title": "Nome da refeição",
    "description": "Descrição breve",
    "estimatedCalories": número,
    "estimatedProtein": número em gramas,
    "estimatedCarbs": número em gramas,
    "estimatedFat": número em gramas,
    "ingredients": ["lista", "de", "ingredientes"],
    "tips": "Dica de preparo ou benefício nutricional"
  }
]`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meal_recommendations",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                estimatedCalories: { type: "number" },
                estimatedProtein: { type: "number" },
                estimatedCarbs: { type: "number" },
                estimatedFat: { type: "number" },
                ingredients: { type: "array", items: { type: "string" } },
                tips: { type: "string" }
              },
              required: ["title", "description", "estimatedCalories", "estimatedProtein", "estimatedCarbs", "estimatedFat", "ingredients", "tips"],
              additionalProperties: false
            }
          }
        }
      }
    });

    const message = response.choices[0]?.message;
    const content = typeof message?.content === 'string' ? message.content : '';
    if (!content) return [];

    const recommendations = JSON.parse(content) as MealRecommendation[];
    
    // Filter out recommendations that contain blacklisted ingredients
    const blacklistedKeywords = allergies.filter(a => !preferences.includes(a)).map(a => a.toLowerCase());
    const filtered = recommendations.filter(rec => {
      const recText = `${rec.title} ${rec.description} ${rec.ingredients.join(' ')}`.toLowerCase();
      return !blacklistedKeywords.some(keyword => recText.includes(keyword));
    });
    
    // If all recommendations were filtered out, return original to avoid empty list
    return filtered.length > 0 ? filtered : recommendations;
  } catch (error) {
    console.error("Recommendations error:", error);
    return [];
  }
}

async function getSupplementSuggestions(
  deficientMicros: { name: string; amount: number; unit: string; percentDailyValue: number }[],
  profile: any
): Promise<{ name: string; dosage: string; timing: string; benefit: string }[]> {
  const systemPrompt = `Você é um nutricionista esportivo especializado em suplementação.
Com base nos micronutrientes deficientes do usuário, sugira suplementos adequados em português brasileiro.`;

  const userPrompt = `O usuário tem deficiência nos seguintes micronutrientes hoje:
${deficientMicros.map(m => `- ${m.name}: ${m.amount}${m.unit} (${m.percentDailyValue}% do valor diário)`).join('\n')}

Atividade física: ${profile?.activityType || 'não informado'}
Peso: ${profile?.currentWeight || 'não informado'}kg

Sugira suplementos para cobrir essas deficiências. Retorne JSON:
[
  {
    "name": "Nome do suplemento",
    "dosage": "Dosagem recomendada",
    "timing": "Quando tomar",
    "benefit": "Benefício principal"
  }
]`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "supplement_suggestions",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                dosage: { type: "string" },
                timing: { type: "string" },
                benefit: { type: "string" }
              },
              required: ["name", "dosage", "timing", "benefit"],
              additionalProperties: false
            }
          }
        }
      }
    });

    const message = response.choices[0]?.message;
    const content = typeof message?.content === 'string' ? message.content : '';
    if (!content) return [];
    return JSON.parse(content);
  } catch (error) {
    console.error("Supplement suggestions error:", error);
    return [];
  }
}

async function getSportsNutritionRecommendations(
  profile: any,
  consumed: { calories: number; protein: number; carbs: number; fat: number }
) {
  const systemPrompt = `Você é um nutricionista esportivo especializado em suplementação e otimização de performance.
Analise o perfil do atleta e forneça recomendações personalizadas em português brasileiro.`;

  const userPrompt = `Analise o perfil deste usuário e forneça recomendações de nutrição esportiva:

Atividade física: ${profile.activityType}
Peso atual: ${profile.currentWeight}kg
Peso desejado: ${profile.targetWeight}kg
Meta calórica diária: ${profile.dailyCalorieGoal} kcal

Consumo de hoje:
- Calorias: ${consumed.calories} kcal
- Proteína: ${consumed.protein}g
- Carboidratos: ${consumed.carbs}g
- Gordura: ${consumed.fat}g

Retorne um JSON com:
{
  "recommendations": [
    {
      "title": "Título da recomendação",
      "description": "Descrição detalhada",
      "priority": "alta" | "média" | "baixa"
    }
  ],
  "supplements": [
    {
      "name": "Nome do suplemento",
      "dosage": "Dosagem recomendada",
      "timing": "Quando tomar",
      "benefit": "Benefício principal"
    }
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sports_nutrition",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string" }
                  },
                  required: ["title", "description", "priority"],
                  additionalProperties: false
                }
              },
              supplements: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    dosage: { type: "string" },
                    timing: { type: "string" },
                    benefit: { type: "string" }
                  },
                  required: ["name", "dosage", "timing", "benefit"],
                  additionalProperties: false
                }
              }
            },
            required: ["recommendations", "supplements"],
            additionalProperties: false
          }
        }
      }
    });

    const message = response.choices[0]?.message;
    const content = typeof message?.content === 'string' ? message.content : '';
    if (!content) return { recommendations: [], supplements: [] };

    return JSON.parse(content);
  } catch (error) {
    console.error("Sports nutrition error:", error);
    return { recommendations: [], supplements: [] };
  }
}
