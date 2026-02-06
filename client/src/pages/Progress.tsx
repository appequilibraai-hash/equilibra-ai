import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Loader2,
  Target
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = {
  calories: "#f97316",
  protein: "#ef4444",
  carbs: "#f59e0b",
  fat: "#eab308",
};

export default function Progress() {
  const { data: weeklySummary, isLoading: loadingWeekly } = trpc.nutrition.weeklySummary.useQuery();
  const { data: dailySummary, isLoading: loadingDaily } = trpc.nutrition.dailySummary.useQuery({});
  const { data: profile } = trpc.profile.get.useQuery();

  // Prepare data for charts
  const chartData = weeklySummary?.map((day) => ({
    date: format(new Date(day.date), "EEE", { locale: ptBR }),
    fullDate: format(new Date(day.date), "d/MM"),
    calories: day.totalCalories,
    protein: Number(day.totalProtein),
    carbs: Number(day.totalCarbs),
    fat: Number(day.totalFat),
    meals: day.mealCount,
  })) || [];

  // Fill missing days with zeros
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = weeklySummary?.find(d => d.date === dateStr);
    return {
      date: format(date, "EEE", { locale: ptBR }),
      fullDate: format(date, "d/MM"),
      calories: existing?.totalCalories || 0,
      protein: Number(existing?.totalProtein || 0),
      carbs: Number(existing?.totalCarbs || 0),
      fat: Number(existing?.totalFat || 0),
      meals: existing?.mealCount || 0,
    };
  });

  // Calculate weekly averages
  const weeklyAvg = last7Days.reduce(
    (acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat,
      meals: acc.meals + day.meals,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 }
  );

  const daysWithData = last7Days.filter(d => d.meals > 0).length || 1;
  const avgCalories = Math.round(weeklyAvg.calories / daysWithData);
  const avgProtein = Math.round(weeklyAvg.protein / daysWithData);
  const avgCarbs = Math.round(weeklyAvg.carbs / daysWithData);
  const avgFat = Math.round(weeklyAvg.fat / daysWithData);

  // Today's macro distribution for pie chart
  const todayMacros = dailySummary?.consumed ? [
    { name: "Proteína", value: Number(dailySummary.consumed.totalProtein), color: COLORS.protein },
    { name: "Carboidratos", value: Number(dailySummary.consumed.totalCarbs), color: COLORS.carbs },
    { name: "Gordura", value: Number(dailySummary.consumed.totalFat), color: COLORS.fat },
  ] : [];

  const totalMacros = todayMacros.reduce((sum, m) => sum + m.value, 0);

  const isLoading = loadingWeekly || loadingDaily;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Seu Progresso
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe sua evolução nutricional ao longo do tempo
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Weekly Averages */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{avgCalories}</p>
                    <p className="text-xs text-muted-foreground">kcal/dia (média)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Beef className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{avgProtein}g</p>
                    <p className="text-xs text-muted-foreground">proteína/dia</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Wheat className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{avgCarbs}g</p>
                    <p className="text-xs text-muted-foreground">carboidratos/dia</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{avgFat}g</p>
                    <p className="text-xs text-muted-foreground">gordura/dia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calories Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Calorias - Últimos 7 Dias
              </CardTitle>
              <CardDescription>
                Meta diária: {profile?.dailyCalorieGoal || 2000} kcal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{payload[0]?.payload?.fullDate}</p>
                              <p className="text-orange-600">
                                {payload[0]?.value} kcal
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {payload[0]?.payload?.meals} refeições
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="calories" 
                      fill={COLORS.calories}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Macros Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Macronutrientes - Últimos 7 Dias</CardTitle>
              <CardDescription>
                Evolução de proteínas, carboidratos e gorduras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border rounded-lg p-3 shadow-lg">
                              <p className="font-medium mb-2">{payload[0]?.payload?.fullDate}</p>
                              {payload.map((p: any) => (
                                <p key={p.dataKey} style={{ color: p.color }}>
                                  {p.name}: {p.value?.toFixed(0)}g
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="protein" 
                      name="Proteína"
                      stroke={COLORS.protein} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.protein }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="carbs" 
                      name="Carboidratos"
                      stroke={COLORS.carbs} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.carbs }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fat" 
                      name="Gordura"
                      stroke={COLORS.fat} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.fat }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Today's Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Hoje</CardTitle>
                <CardDescription>
                  Proporção de macronutrientes consumidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalMacros > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={todayMacros}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {todayMacros.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0]?.payload;
                              const percent = ((data.value / totalMacros) * 100).toFixed(0);
                              return (
                                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p style={{ color: data.color }}>
                                    {data.value.toFixed(0)}g ({percent}%)
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    Nenhuma refeição registrada hoje
                  </div>
                )}
                <div className="flex justify-center gap-6 mt-4">
                  {todayMacros.map((macro) => (
                    <div key={macro.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: macro.color }}
                      />
                      <span className="text-sm text-muted-foreground">{macro.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Goals vs Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Metas vs Consumido Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Calorias</span>
                      <span>
                        {dailySummary?.consumed?.totalCalories || 0} / {dailySummary?.goals?.calories || 2000} kcal
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(((dailySummary?.consumed?.totalCalories || 0) / (dailySummary?.goals?.calories || 2000)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Proteína</span>
                      <span>
                        {Number(dailySummary?.consumed?.totalProtein || 0).toFixed(0)} / {dailySummary?.goals?.protein || 50}g
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((Number(dailySummary?.consumed?.totalProtein || 0) / (dailySummary?.goals?.protein || 50)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Carboidratos</span>
                      <span>
                        {Number(dailySummary?.consumed?.totalCarbs || 0).toFixed(0)} / {dailySummary?.goals?.carbs || 250}g
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((Number(dailySummary?.consumed?.totalCarbs || 0) / (dailySummary?.goals?.carbs || 250)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Gordura</span>
                      <span>
                        {Number(dailySummary?.consumed?.totalFat || 0).toFixed(0)} / {dailySummary?.goals?.fat || 65}g
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((Number(dailySummary?.consumed?.totalFat || 0) / (dailySummary?.goals?.fat || 65)) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
