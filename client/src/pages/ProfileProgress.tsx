import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  CalendarIcon, Flame, Beef, Wheat, Droplets, Share2, ChevronDown, ChevronUp,
  Apple, Pill, TrendingUp, Scale, FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ALL_NUTRIENT_CARDS = [
  { key: "calories", label: "Calorias", unit: "kcal", icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
  { key: "protein", label: "Proteínas", unit: "g", icon: Beef, color: "text-red-500", bg: "bg-red-50" },
  { key: "carbs", label: "Carboidratos", unit: "g", icon: Wheat, color: "text-amber-500", bg: "bg-amber-50" },
  { key: "fat", label: "Gorduras", unit: "g", icon: Droplets, color: "text-yellow-600", bg: "bg-yellow-50" },
  { key: "fiber", label: "Fibras", unit: "g", icon: Apple, color: "text-green-500", bg: "bg-green-50" },
  { key: "sugar", label: "Açúcar", unit: "g", icon: Droplets, color: "text-pink-500", bg: "bg-pink-50" },
  { key: "sodium", label: "Sódio", unit: "mg", icon: Pill, color: "text-blue-500", bg: "bg-blue-50" },
];

const CHART_METRICS = [
  { key: "totalCalories", label: "Calorias (kcal)" },
  { key: "totalProtein", label: "Proteínas (g)" },
  { key: "totalCarbs", label: "Carboidratos (g)" },
  { key: "totalFat", label: "Gorduras (g)" },
  { key: "totalFiber", label: "Fibras (g)" },
  { key: "totalSugar", label: "Açúcar (g)" },
  { key: "totalSodium", label: "Sódio (mg)" },
];

export default function ProfileProgress() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visibleCards, setVisibleCards] = useState<string[]>(["calories", "protein", "carbs", "fat"]);
  const [chartMetric, setChartMetric] = useState("totalCalories");
  const [showExtract, setShowExtract] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(false);

  const dateStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  const { data: dailySummary, isLoading: loadingDaily } = trpc.nutrition.dailySummary.useQuery({ date: dateStr });
  const { data: weeklyData, isLoading: loadingWeekly } = trpc.nutrition.weeklySummary.useQuery({ date: dateStr });
  const { data: fullExtract, isLoading: loadingExtract } = trpc.nutrition.dailyFullExtract.useQuery({ date: dateStr });
  const { data: weightProgress } = trpc.weight.progress.useQuery();
  const { data: weightHistory } = trpc.weight.history.useQuery({ limit: 30 });

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const getNutrientValue = (key: string) => {
    if (!fullExtract) return 0;
    const macros = fullExtract.macros as any;
    return Number(macros[key]) || 0;
  };

  const getNutrientGoal = (key: string) => {
    if (!dailySummary) return 0;
    const goals = dailySummary.goals as any;
    if (key === "calories") return goals.calories;
    if (key === "protein") return goals.protein;
    if (key === "carbs") return goals.carbs;
    if (key === "fat") return goals.fat;
    if (key === "fiber") return 25;
    if (key === "sugar") return 50;
    if (key === "sodium") return 2300;
    return 100;
  };

  const chartData = useMemo(() => {
    if (!weeklyData || !Array.isArray(weeklyData)) return [];
    return (weeklyData as any[]).map((d: any) => ({
      date: format(new Date(d.date + "T12:00:00"), "EEE", { locale: ptBR }),
      value: Number(d[chartMetric]) || 0,
    }));
  }, [weeklyData, chartMetric]);

  const weightChartData = useMemo(() => {
    if (!weightHistory || !Array.isArray(weightHistory)) return [];
    return [...weightHistory].reverse().slice(-14).map((w: any) => ({
      date: format(new Date(w.recordedAt), "dd/MM", { locale: ptBR }),
      peso: Number(w.weight),
    }));
  }, [weightHistory]);

  const handleShare = () => {
    if (!fullExtract) return;
    const macros = fullExtract.macros as any;
    const micros = (fullExtract.micronutrients || []) as any[];

    let text = `📊 *Relatório Nutricional - Equilibra AI*\n`;
    text += `📅 ${format(selectedDate, "dd/MM/yyyy")}\n\n`;
    text += `🔥 Calorias: ${macros.calories} kcal\n`;
    text += `🥩 Proteínas: ${Number(macros.protein).toFixed(1)}g\n`;
    text += `🌾 Carboidratos: ${Number(macros.carbs).toFixed(1)}g\n`;
    text += `💧 Gorduras: ${Number(macros.fat).toFixed(1)}g\n`;
    text += `🥬 Fibras: ${Number(macros.fiber).toFixed(1)}g\n`;
    text += `🍬 Açúcar: ${Number(macros.sugar).toFixed(1)}g\n`;
    text += `🧂 Sódio: ${Number(macros.sodium).toFixed(0)}mg\n`;

    if (micros.length > 0) {
      text += `\n💊 *Micronutrientes:*\n`;
      micros.forEach((m: any) => {
        text += `  • ${m.name}: ${m.amount.toFixed(1)}${m.unit} (${m.percentDailyValue}% VD)\n`;
      });
    }

    text += `\n🍽️ Refeições: ${fullExtract.mealCount}\n`;
    text += `\n_Gerado por Equilibra AI_`;

    if (navigator.share) {
      navigator.share({ title: "Relatório Nutricional", text }).catch(() => {});
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  if (loadingDaily) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
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

          <Button variant="outline" size="sm" onClick={() => setShowCardSelector(!showCardSelector)}>
            <Pill className="h-4 w-4 mr-1" />
            Nutrientes
          </Button>
        </div>
      </motion.div>

      {/* Card Selector */}
      <AnimatePresence>
        {showCardSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-600 mb-3">Selecione os nutrientes visíveis:</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_NUTRIENT_CARDS.map((n) => (
                    <button
                      key={n.key}
                      onClick={() => {
                        setVisibleCards((prev) =>
                          prev.includes(n.key)
                            ? prev.filter((k) => k !== n.key)
                            : [...prev, n.key]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        visibleCards.includes(n.key)
                          ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-400"
                          : "bg-gray-100 text-gray-500 border-2 border-transparent"
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nutrient Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ALL_NUTRIENT_CARDS.filter((n) => visibleCards.includes(n.key)).map((nutrient) => {
            const value = getNutrientValue(nutrient.key);
            const goal = getNutrientGoal(nutrient.key);
            const percent = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
            const Icon = nutrient.icon;

            return (
              <Card key={nutrient.key} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${nutrient.bg}`}>
                      <Icon className={`h-4 w-4 ${nutrient.color}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{nutrient.label}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {nutrient.key === "calories" ? Math.round(value) : value.toFixed(1)}
                    <span className="text-xs font-normal text-gray-400 ml-1">{nutrient.unit}</span>
                  </p>
                  <div className="mt-2">
                    <Progress value={percent} className="h-1.5" />
                    <p className="text-xs text-gray-400 mt-1">{percent}% da meta</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Weight Progress */}
      {weightProgress && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-500" />
                Evolução do Peso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Início</p>
                  <p className="text-lg font-bold">{weightProgress.startWeight?.toFixed(1)}kg</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Atual</p>
                  <p className="text-lg font-bold text-emerald-600">{weightProgress.currentWeight?.toFixed(1)}kg</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Meta</p>
                  <p className="text-lg font-bold text-blue-600">{weightProgress.targetWeight?.toFixed(1)}kg</p>
                </div>
              </div>
              {weightProgress.estimatedDaysToGoal && (
                <p className="text-sm text-center text-gray-500 mb-4">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Estimativa: {weightProgress.estimatedDaysToGoal} dias para atingir a meta
                </p>
              )}
              {weightChartData.length > 1 && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Semana
              </CardTitle>
              <Select value={chartMetric} onValueChange={setChartMetric}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_METRICS.map((m) => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400 py-8">Sem dados para esta semana</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Meals of the day */}
      {fullExtract && fullExtract.meals && fullExtract.meals.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Refeições do Dia ({fullExtract.mealCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fullExtract.meals.map((meal: any) => {
                const mealTypeLabels: Record<string, string> = {
                  breakfast: "Café da Manhã", lunch: "Almoço", dinner: "Jantar", snack: "Lanche",
                };
                return (
                  <div key={meal.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {meal.imageUrl && (
                      <img src={meal.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{mealTypeLabels[meal.mealType] || meal.mealType}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(meal.mealTime), "HH:mm", { locale: ptBR })}
                        {" • "}{meal.totalCalories} kcal
                      </p>
                      {meal.detectedFoods && (
                        <p className="text-xs text-gray-400 truncate">
                          {(meal.detectedFoods as any[]).map((f: any) => f.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Full Nutritional Extract */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-2">
            <button onClick={() => setShowExtract(!showExtract)} className="flex items-center justify-between w-full">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                Meus Dados - Extrato Nutricional
              </CardTitle>
              {showExtract ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {showExtract && (
              <div className="flex items-center justify-between flex-wrap gap-2 mt-3 pt-3 border-t">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarIcon className="h-4 w-4 text-emerald-500" />
                      {isToday ? "Hoje" : format(selectedDate, "dd/MM/yyyy")}
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
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </Button>
              </div>
            )}
          </CardHeader>
          <AnimatePresence>
            {showExtract && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CardContent>
                  {loadingExtract ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
                    </div>
                  ) : fullExtract ? (
                    <div className="space-y-6">
                      {/* Macronutrients Table */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Macronutrientes</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-medium text-gray-500">Nutriente</th>
                                <th className="text-right py-2 font-medium text-gray-500">Consumido</th>
                                <th className="text-right py-2 font-medium text-gray-500">Meta</th>
                                <th className="text-right py-2 font-medium text-gray-500">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { name: "Calorias", value: fullExtract.macros.calories, goal: fullExtract.goals.calories, unit: "kcal" },
                                { name: "Proteínas", value: fullExtract.macros.protein, goal: fullExtract.goals.protein, unit: "g" },
                                { name: "Carboidratos", value: fullExtract.macros.carbs, goal: fullExtract.goals.carbs, unit: "g" },
                                { name: "Gorduras", value: fullExtract.macros.fat, goal: fullExtract.goals.fat, unit: "g" },
                                { name: "Fibras", value: fullExtract.macros.fiber, goal: 25, unit: "g" },
                                { name: "Açúcar", value: fullExtract.macros.sugar, goal: 50, unit: "g" },
                                { name: "Sódio", value: fullExtract.macros.sodium, goal: 2300, unit: "mg" },
                              ].map((row) => {
                                const pct = row.goal > 0 ? Math.round((Number(row.value) / row.goal) * 100) : 0;
                                return (
                                  <tr key={row.name} className="border-b last:border-0">
                                    <td className="py-2 font-medium">{row.name}</td>
                                    <td className="py-2 text-right">{Number(row.value).toFixed(row.unit === "kcal" ? 0 : 1)} {row.unit}</td>
                                    <td className="py-2 text-right text-gray-400">{row.goal} {row.unit}</td>
                                    <td className="py-2 text-right">
                                      <Badge variant={pct >= 80 && pct <= 120 ? "default" : "secondary"} className="text-xs">
                                        {pct}%
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Micronutrients Table */}
                      {fullExtract.micronutrients && (fullExtract.micronutrients as any[]).length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">Micronutrientes</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 font-medium text-gray-500">Nutriente</th>
                                  <th className="text-right py-2 font-medium text-gray-500">Quantidade</th>
                                  <th className="text-right py-2 font-medium text-gray-500">% Valor Diário</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(fullExtract.micronutrients as any[]).map((micro: any, i: number) => (
                                  <tr key={i} className="border-b last:border-0">
                                    <td className="py-2 font-medium">{micro.name}</td>
                                    <td className="py-2 text-right">{micro.amount.toFixed(1)} {micro.unit}</td>
                                    <td className="py-2 text-right">
                                      <Badge
                                        variant={micro.percentDailyValue >= 50 ? "default" : "destructive"}
                                        className="text-xs"
                                      >
                                        {micro.percentDailyValue}%
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {fullExtract.mealCount === 0 && (
                        <p className="text-center text-gray-400 py-4">
                          Nenhuma refeição registrada neste dia.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-4">Dados não disponíveis</p>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}
