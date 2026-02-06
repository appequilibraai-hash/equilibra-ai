import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  TrendingUp,
  Utensils,
  ArrowRight,
  Loader2,
  Sparkles,
  Target,
  Zap,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const FEATURE_ROBOT = "https://private-us-east-1.manuscdn.com/sessionFile/zzBJEAWa6t4bzzUkBdknzk/sandbox/kw1I1FeG3weE1NSxH7ImVi_1770344056442_na1fn_ZmVhdHVyZS1yZWNvbW1lbmRhdGlvbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvenpCSkVBV2E2dDRienpVa0Jka256ay9zYW5kYm94L2t3MUkxRmVHM3dlRTFOU3hIN0ltVmlfMTc3MDM0NDA1NjQ0Ml9uYTFmbl9abVZoZEhWeVpTMXlaV052YlcxbGJtUmhkR2x2YmcucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=sSsn0TM7iCMK47Nendq-viYI~PFnQ2LGzKSdoi-qgxf-R0aFwNCFnRSzX8txAj2GvJY~acIKue1WtvE-f9OSmDVKA4yrovOZX9VRMrmc1ju7IJZX4yXTHzmsMxojL9Smoo6-xr9E6nEN-JqcsPvVHGEOUEoNBxd-2WbxSkH4sZabGkWlbFi74mPMjCdz9xoHwZPBw~EZBqoUJ0tf7DhT0hXcdtBg0jj8aNmgA9OPI9vCsfdn5Om7crL0cE9BEgJoEiKvR6kKojIhn-59BJOB3Dljj1Be7AT4ow-aFvmRG8g49Z1HRf1KS~Svg~swtB4Tn3lDGQQ8fATGvZCDma6lcA__";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: dailySummary, isLoading: loadingDaily } = trpc.nutrition.dailySummary.useQuery({});
  const { data: todayMeals, isLoading: loadingMeals } = trpc.meals.getToday.useQuery();

  const consumed = dailySummary?.consumed || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: 0 };
  const goals = dailySummary?.goals || { calories: 2000, protein: 50, carbs: 250, fat: 65 };

  const calorieProgress = Math.min((consumed.totalCalories / goals.calories) * 100, 100);
  const proteinProgress = Math.min((Number(consumed.totalProtein) / goals.protein) * 100, 100);
  const carbsProgress = Math.min((Number(consumed.totalCarbs) / goals.carbs) * 100, 100);
  const fatProgress = Math.min((Number(consumed.totalFat) / goals.fat) * 100, 100);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getCalorieStatus = () => {
    const percentage = (consumed.totalCalories / goals.calories) * 100;
    if (percentage < 50) return { text: "Continue assim!", color: "text-emerald-600" };
    if (percentage < 80) return { text: "Ótimo progresso!", color: "text-blue-600" };
    if (percentage < 100) return { text: "Quase lá!", color: "text-amber-600" };
    return { text: "Meta atingida!", color: "text-emerald-600" };
  };

  const status = getCalorieStatus();

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header with Gradient Background */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-6 md:p-8 text-white"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-emerald-200" />
              <span className="text-emerald-100 text-sm font-medium">Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {greeting()}, {user?.name?.split(" ")[0] || "Usuário"}!
            </h1>
            <p className="text-emerald-100 mt-1">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button 
            onClick={() => setLocation("/analyze")} 
            size="lg"
            className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            Nova Refeição
          </Button>
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Calories Card - Featured */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-full lg:col-span-2"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <span className="text-gray-800">Calorias Hoje</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDaily ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        {consumed.totalCalories}
                      </span>
                      <span className="text-gray-500 ml-2">
                        / {goals.calories} kcal
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${status.color}`}>{status.text}</p>
                      <p className="text-sm text-gray-500">
                        {Math.max(0, goals.calories - consumed.totalCalories)} restantes
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={calorieProgress} className="h-4 bg-orange-100" />
                    <div 
                      className="absolute inset-0 h-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                      style={{ width: `${calorieProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Protein Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full bg-gradient-to-br from-red-50 to-rose-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center shadow-md">
                  <Beef className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700">Proteína</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDaily ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-red-600">{Number(consumed.totalProtein).toFixed(0)}</span>
                    <span className="text-sm text-gray-500">/ {goals.protein}g</span>
                  </div>
                  <Progress value={proteinProgress} className="h-2 bg-red-100" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Carbs Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 flex items-center justify-center shadow-md">
                  <Wheat className="h-4 w-4 text-white" />
                </div>
                <span className="text-gray-700">Carboidratos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDaily ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-amber-600">{Number(consumed.totalCarbs).toFixed(0)}</span>
                    <span className="text-sm text-gray-500">/ {goals.carbs}g</span>
                  </div>
                  <Progress value={carbsProgress} className="h-2 bg-amber-100" />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Fat Progress - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-lime-50">
          <CardContent className="p-6">
            {loadingDaily ? (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-lime-500 flex items-center justify-center shadow-lg">
                  <Droplets className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700">Gordura</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-yellow-600">{Number(consumed.totalFat).toFixed(0)}</span>
                      <span className="text-sm text-gray-500">/ {goals.fat}g</span>
                    </div>
                  </div>
                  <Progress value={fatProgress} className="h-3 bg-yellow-100" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Today's Meals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Utensils className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Refeições de Hoje</CardTitle>
                  <CardDescription>
                    {consumed.mealCount} {consumed.mealCount === 1 ? "refeição registrada" : "refeições registradas"}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/history")} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                Ver todas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingMeals ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : todayMeals && todayMeals.length > 0 ? (
              <div className="space-y-3">
                {todayMeals.slice(0, 3).map((meal, index) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:shadow-md cursor-pointer transition-all group"
                    onClick={() => setLocation(`/meal/${meal.id}`)}
                  >
                    <div className="relative">
                      <img
                        src={meal.imageUrl}
                        alt="Refeição"
                        className="w-16 h-16 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 capitalize">
                        {meal.mealType === "breakfast" ? "Café da manhã" :
                         meal.mealType === "lunch" ? "Almoço" :
                         meal.mealType === "dinner" ? "Jantar" : "Lanche"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(meal.mealTime), "HH:mm")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                        {meal.totalCalories} kcal
                      </p>
                      <p className="text-xs text-gray-500">
                        P: {Number(meal.totalProtein).toFixed(0)}g | C: {Number(meal.totalCarbs).toFixed(0)}g
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
                  <Utensils className="h-10 w-10 text-emerald-500" />
                </div>
                <p className="text-gray-600 font-medium mb-1">Nenhuma refeição registrada hoje</p>
                <p className="text-sm text-gray-400 mb-4">Comece tirando uma foto da sua refeição</p>
                <Button onClick={() => setLocation("/analyze")} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  <Camera className="h-4 w-4 mr-2" />
                  Registrar primeira refeição
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card 
            className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all group overflow-hidden"
            onClick={() => setLocation("/progress")}
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Ver Progresso</h3>
                  <p className="text-sm text-gray-500">Acompanhe sua evolução semanal</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card 
            className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all group overflow-hidden"
            onClick={() => setLocation("/recommendations")}
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-violet-50 to-purple-50">
                <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                  <img src={FEATURE_ROBOT} alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-violet-600 transition-colors">Recomendações IA</h3>
                  <p className="text-sm text-gray-500">Sugestões para sua próxima refeição</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-violet-500 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
