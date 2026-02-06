import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Flame, 
  Scale,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function ProfileProgress() {
  const { data: dailySummary, isLoading: loadingDaily } = trpc.nutrition.dailySummary.useQuery({});
  const { data: weeklySummary, isLoading: loadingWeekly } = trpc.nutrition.weeklySummary.useQuery();
  const { data: weightProgress, isLoading: loadingWeight } = trpc.weight.progress.useQuery();
  const { data: weightHistory } = trpc.weight.history.useQuery({ limit: 30 });

  const isLoading = loadingDaily || loadingWeekly || loadingWeight;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const caloriesProgress = dailySummary 
    ? Math.min(100, (dailySummary.consumed.totalCalories / dailySummary.goals.calories) * 100)
    : 0;

  const proteinProgress = dailySummary
    ? Math.min(100, (dailySummary.consumed.totalProtein / dailySummary.goals.protein) * 100)
    : 0;

  const carbsProgress = dailySummary
    ? Math.min(100, (dailySummary.consumed.totalCarbs / dailySummary.goals.carbs) * 100)
    : 0;

  const fatProgress = dailySummary
    ? Math.min(100, (dailySummary.consumed.totalFat / dailySummary.goals.fat) * 100)
    : 0;

  // Format weight history for chart
  const weightChartData = weightHistory?.map(record => ({
    date: new Date(record.recordedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    weight: Number(record.weight),
  })).reverse() || [];

  // Format weekly data for chart
  const weeklyChartData = weeklySummary?.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    calories: day.totalCalories,
    protein: day.totalProtein,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Progresso de Hoje
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Calories */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700">Calorias</span>
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {dailySummary?.consumed.totalCalories || 0}
                <span className="text-sm font-normal text-orange-600"> / {dailySummary?.goals.calories}</span>
              </p>
              <Progress value={caloriesProgress} className="mt-2 h-2 bg-orange-200" />
            </CardContent>
          </Card>

          {/* Protein */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">Proteína</span>
                <span className="text-xs text-red-500">{Math.round(proteinProgress)}%</span>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {dailySummary?.consumed.totalProtein || 0}g
                <span className="text-sm font-normal text-red-600"> / {dailySummary?.goals.protein}g</span>
              </p>
              <Progress value={proteinProgress} className="mt-2 h-2 bg-red-200" />
            </CardContent>
          </Card>

          {/* Carbs */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-700">Carboidratos</span>
                <span className="text-xs text-amber-500">{Math.round(carbsProgress)}%</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">
                {dailySummary?.consumed.totalCarbs || 0}g
                <span className="text-sm font-normal text-amber-600"> / {dailySummary?.goals.carbs}g</span>
              </p>
              <Progress value={carbsProgress} className="mt-2 h-2 bg-amber-200" />
            </CardContent>
          </Card>

          {/* Fat */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-700">Gordura</span>
                <span className="text-xs text-yellow-500">{Math.round(fatProgress)}%</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900">
                {dailySummary?.consumed.totalFat || 0}g
                <span className="text-sm font-normal text-yellow-600"> / {dailySummary?.goals.fat}g</span>
              </p>
              <Progress value={fatProgress} className="mt-2 h-2 bg-yellow-200" />
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Weight Progress */}
      {weightProgress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Scale className="h-5 w-5 text-emerald-500" />
            Progresso de Peso
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Peso Atual</p>
                    <p className="text-2xl font-bold text-gray-900">{weightProgress.currentWeight} kg</p>
                  </div>
                  <Scale className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Meta</p>
                    <p className="text-2xl font-bold text-gray-900">{weightProgress.targetWeight} kg</p>
                  </div>
                  <Target className="h-8 w-8 text-teal-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Falta</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.abs(weightProgress.remainingChange).toFixed(1)} kg
                    </p>
                  </div>
                  {weightProgress.remainingChange < 0 ? (
                    <TrendingDown className="h-8 w-8 text-green-500" />
                  ) : weightProgress.remainingChange > 0 ? (
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  ) : (
                    <Minus className="h-8 w-8 text-gray-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weight Chart */}
          {weightChartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evolução do Peso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightChartData}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis 
                        domain={['dataMin - 2', 'dataMax + 2']} 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}kg`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} kg`, 'Peso']}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#weightGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estimated Time to Goal */}
          {weightProgress.estimatedDaysToGoal && (
            <Card className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Calendar className="h-12 w-12 opacity-80" />
                  <div>
                    <p className="text-emerald-100">Estimativa para atingir sua meta</p>
                    <p className="text-3xl font-bold">
                      {weightProgress.estimatedDaysToGoal} dias
                    </p>
                    <p className="text-sm text-emerald-100">
                      Mantendo a média de {Math.abs(weightProgress.avgChangePerDay * 7).toFixed(2)} kg/semana
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Weekly Calories Chart */}
      {weeklyChartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Calorias da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'calories' ? `${value} kcal` : `${value}g`,
                        name === 'calories' ? 'Calorias' : 'Proteína'
                      ]}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ fill: '#f97316' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="protein"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
