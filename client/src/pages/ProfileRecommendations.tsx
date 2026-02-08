import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, ChefHat, Flame, Sparkles, Pill, CalendarIcon, ChevronDown,
  Beef, Wheat, Droplets, Clock, Zap,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfileRecommendations() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const { data: recommendations, isLoading } = trpc.recommendations.getNextMeal.useQuery({ date: dateStr });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const caloriePercent = recommendations
    ? Math.min(100, Math.round((recommendations.consumed.calories / recommendations.goals.calories) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 text-base font-semibold">
              <CalendarIcon className="h-5 w-5 text-emerald-500" />
              {isToday ? "Hoje" : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              locale={ptBR}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* Daily Context Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-emerald-100 text-sm">Resumo do dia</p>
                <p className="text-3xl font-bold">{recommendations?.consumed.calories || 0} <span className="text-lg font-normal">/ {recommendations?.goals.calories} kcal</span></p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm">{recommendations?.mealsToday || 0} refeições</p>
                <p className="text-2xl font-bold">{caloriePercent}%</p>
              </div>
            </div>
            <Progress value={caloriePercent} className="h-2 bg-white/20" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/15 rounded-lg p-2 text-center">
                <Beef className="h-4 w-4 mx-auto mb-1 opacity-80" />
                <p className="text-sm font-bold">{recommendations?.consumed.protein || 0}g</p>
                <p className="text-xs opacity-70">Proteína</p>
              </div>
              <div className="bg-white/15 rounded-lg p-2 text-center">
                <Wheat className="h-4 w-4 mx-auto mb-1 opacity-80" />
                <p className="text-sm font-bold">{recommendations?.consumed.carbs || 0}g</p>
                <p className="text-xs opacity-70">Carboidratos</p>
              </div>
              <div className="bg-white/15 rounded-lg p-2 text-center">
                <Droplets className="h-4 w-4 mx-auto mb-1 opacity-80" />
                <p className="text-sm font-bold">{recommendations?.consumed.fat || 0}g</p>
                <p className="text-xs opacity-70">Gordura</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What's remaining */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100">Próxima refeição sugerida</p>
                <p className="text-2xl font-bold capitalize">{recommendations?.nextMealType}</p>
              </div>
              <ChefHat className="h-12 w-12 opacity-80" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Sugestões de Refeição
        </h2>

        {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {recommendations.recommendations.map((rec: any, i: number) => (
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
                      {rec.ingredients.map((ing: string, j: number) => (
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

      {/* Supplement Suggestions */}
      {recommendations?.supplements && recommendations.supplements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Pill className="h-5 w-5 text-blue-500" />
            Sugestões de Suplementação
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Com base nos micronutrientes que ficaram abaixo de 50% do valor diário recomendado.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.supplements.map((supp: any, i: number) => (
              <Card key={i} className="border-blue-100 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Pill className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{supp.name}</h3>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          <span><strong>Dosagem:</strong> {supp.dosage}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-3.5 w-3.5 text-emerald-500" />
                          <span><strong>Quando:</strong> {supp.timing}</span>
                        </div>
                        <p className="text-sm text-blue-600 bg-blue-50 rounded-lg p-2 mt-2">
                          {supp.benefit}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
