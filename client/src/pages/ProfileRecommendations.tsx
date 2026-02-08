import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Lightbulb, 
  ChefHat, 
  Flame, 
  Sparkles
} from "lucide-react";

export default function ProfileRecommendations() {
  const { data: recommendations, isLoading } = trpc.recommendations.getNextMeal.useQuery();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100">Próxima refeição sugerida</p>
                <p className="text-2xl font-bold capitalize">{recommendations?.nextMealType}</p>
              </div>
              <ChefHat className="h-12 w-12 opacity-80" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-xs text-purple-100">Calorias restantes</p>
                <p className="text-xl font-bold">{recommendations?.remaining.calories} kcal</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-xs text-purple-100">Proteína restante</p>
                <p className="text-xl font-bold">{recommendations?.remaining.protein}g</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-xs text-purple-100">Carboidratos restantes</p>
                <p className="text-xl font-bold">{recommendations?.remaining.carbs}g</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-xs text-purple-100">Gordura restante</p>
                <p className="text-xl font-bold">{recommendations?.remaining.fat}g</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Meal Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Sugestões de Refeição
          </h2>

        </div>

        {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {recommendations.recommendations.map((rec, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </span>
                    {rec.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{rec.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="bg-orange-50 rounded-lg p-2 text-center">
                      <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                      <p className="font-semibold text-orange-700">{rec.estimatedCalories}</p>
                      <p className="text-xs text-orange-500">kcal</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 text-center">
                      <p className="font-semibold text-red-700">{rec.estimatedProtein}g</p>
                      <p className="text-xs text-red-500">Proteína</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center">
                      <p className="font-semibold text-amber-700">{rec.estimatedCarbs}g</p>
                      <p className="text-xs text-amber-500">Carboidratos</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2 text-center">
                      <p className="font-semibold text-yellow-700">{rec.estimatedFat}g</p>
                      <p className="text-xs text-yellow-500">Gordura</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Ingredientes:</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.ingredients.map((ing, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">
                          {ing}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs text-emerald-700">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      {rec.tips}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <ChefHat className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                Registre algumas refeições para receber sugestões personalizadas
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>


    </div>
  );
}
