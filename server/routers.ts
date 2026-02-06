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
  createMeal,
  getMealById,
  getUserMeals,
  getTodayMeals,
  getDailyNutritionSummary,
  getWeeklyNutritionSummary,
  deleteMeal,
  getMealsByDateRange,
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
        dailyCalorieGoal: z.number().min(500).max(10000),
        dailyProteinGoal: z.number().min(0).max(500).optional(),
        dailyCarbsGoal: z.number().min(0).max(1000).optional(),
        dailyFatGoal: z.number().min(0).max(500).optional(),
        dietaryPreferences: z.array(z.string()).optional(),
        allergies: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return upsertUserProfile({
          userId: ctx.user.id,
          ...input,
        });
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

    // Upload and analyze meal photo
    analyze: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("snack"),
        mealTime: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 1. Upload image to S3
        const imageBuffer = Buffer.from(input.imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const fileKey = `meals/${ctx.user.id}/${nanoid()}.jpg`;
        const { url: imageUrl } = await storagePut(fileKey, imageBuffer, 'image/jpeg');

        // 2. Analyze image with AI
        const analysisResult = await analyzeFood(imageUrl);

        // 3. Save meal to database
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

    weeklySummary: protectedProcedure.query(async ({ ctx }) => {
      return getWeeklyNutritionSummary(ctx.user.id);
    }),
  }),

  // ============ RECOMMENDATIONS ============
  recommendations: router({
    getNextMeal: protectedProcedure.query(async ({ ctx }) => {
      const todayMeals = await getTodayMeals(ctx.user.id);
      const profile = await getUserProfile(ctx.user.id);
      const dailySummary = await getDailyNutritionSummary(ctx.user.id, new Date());

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

      // Determine next meal type based on time
      const hour = new Date().getHours();
      let nextMealType: string;
      if (hour < 10) nextMealType = "café da manhã";
      else if (hour < 14) nextMealType = "almoço";
      else if (hour < 18) nextMealType = "lanche da tarde";
      else nextMealType = "jantar";

      // Get AI recommendations
      const recommendations = await getAIRecommendations(
        remaining,
        nextMealType,
        profile?.dietaryPreferences || [],
        profile?.allergies || []
      );

      return {
        nextMealType,
        remaining,
        goals,
        consumed,
        recommendations,
        mealsToday: todayMeals.length,
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
  const systemPrompt = `Você é um nutricionista especialista em análise de alimentos por imagem. 
Analise a foto da refeição e forneça informações nutricionais detalhadas em português brasileiro.
Seja preciso nas estimativas de porções e valores nutricionais.
Considere todos os ingredientes visíveis, incluindo molhos, temperos e acompanhamentos.`;

  const userPrompt = `Analise esta imagem de refeição e forneça uma análise nutricional completa.

Retorne um JSON com a seguinte estrutura:
{
  "totalCalories": número total de calorias estimado,
  "totalProtein": gramas de proteína total,
  "totalCarbs": gramas de carboidratos total,
  "totalFat": gramas de gordura total,
  "totalFiber": gramas de fibra total,
  "totalSugar": gramas de açúcar total,
  "totalSodium": miligramas de sódio total,
  "detectedFoods": [
    {
      "name": "nome do alimento em português",
      "quantity": "quantidade estimada (ex: 150g, 1 unidade)",
      "calories": calorias deste item,
      "protein": proteína em gramas,
      "carbs": carboidratos em gramas,
      "fat": gordura em gramas,
      "confidence": nível de confiança 0-100
    }
  ],
  "detectedSauces": ["lista de molhos identificados"],
  "detectedIngredients": ["lista de todos os ingredientes visíveis"],
  "micronutrients": [
    {
      "name": "nome do micronutriente",
      "amount": quantidade,
      "unit": "unidade (mg, mcg, IU)",
      "percentDailyValue": porcentagem do valor diário recomendado
    }
  ],
  "analysisNotes": "observações sobre a refeição, dicas de saúde relacionadas"
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
                    confidence: { type: "number" }
                  },
                  required: ["name", "quantity", "calories", "protein", "carbs", "fat", "confidence"],
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
              analysisNotes: { type: "string" }
            },
            required: ["totalCalories", "totalProtein", "totalCarbs", "totalFat", "totalFiber", "totalSugar", "totalSodium", "detectedFoods", "detectedSauces", "detectedIngredients", "micronutrients", "analysisNotes"],
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
    // Return default values if analysis fails
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
  allergies: string[]
): Promise<MealRecommendation[]> {
  const systemPrompt = `Você é um nutricionista especialista em planejamento de refeições.
Forneça recomendações de refeições saudáveis e equilibradas em português brasileiro.
Considere as preferências alimentares e alergias do usuário.`;

  const userPrompt = `Com base nas seguintes informações, sugira 3 opções de refeições para ${mealType}:

Calorias restantes para hoje: ${remaining.calories} kcal
Proteína restante: ${remaining.protein}g
Carboidratos restantes: ${remaining.carbs}g
Gordura restante: ${remaining.fat}g

${preferences.length > 0 ? `Preferências alimentares: ${preferences.join(", ")}` : ""}
${allergies.length > 0 ? `Alergias/Restrições: ${allergies.join(", ")}` : ""}

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

    return JSON.parse(content) as MealRecommendation[];
  } catch (error) {
    console.error("Recommendations error:", error);
    return [];
  }
}
