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
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {user?.name?.split(" ")[0] || "Usuário"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button onClick={() => setLocation("/analyze")} size="lg">
          <Camera className="h-4 w-4 mr-2" />
          Nova Refeição
        </Button>
      </div>

      {/* Daily Progress */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Calories Card */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Calorias Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDaily ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-bold text-foreground">
                      {consumed.totalCalories}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      / {goals.calories} kcal
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.max(0, goals.calories - consumed.totalCalories)} restantes
                  </span>
                </div>
                <Progress value={calorieProgress} className="h-3" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Macros Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Beef className="h-4 w-4 text-red-500" />
              Proteína
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDaily ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{Number(consumed.totalProtein).toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">/ {goals.protein}g</span>
                </div>
                <Progress value={proteinProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wheat className="h-4 w-4 text-amber-500" />
              Carboidratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDaily ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{Number(consumed.totalCarbs).toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">/ {goals.carbs}g</span>
                </div>
                <Progress value={carbsProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fat Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Droplets className="h-4 w-4 text-yellow-500" />
            Gordura
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDaily ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{Number(consumed.totalFat).toFixed(0)}</span>
                <span className="text-sm text-muted-foreground">/ {goals.fat}g</span>
              </div>
              <Progress value={fatProgress} className="h-2 flex-1" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Meals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                Refeições de Hoje
              </CardTitle>
              <CardDescription>
                {consumed.mealCount} {consumed.mealCount === 1 ? "refeição registrada" : "refeições registradas"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/history")}>
              Ver todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMeals ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : todayMeals && todayMeals.length > 0 ? (
            <div className="space-y-3">
              {todayMeals.slice(0, 3).map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/meal/${meal.id}`)}
                >
                  <img
                    src={meal.imageUrl}
                    alt="Refeição"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground capitalize">
                      {meal.mealType === "breakfast" ? "Café da manhã" :
                       meal.mealType === "lunch" ? "Almoço" :
                       meal.mealType === "dinner" ? "Jantar" : "Lanche"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(meal.mealTime), "HH:mm")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{meal.totalCalories} kcal</p>
                    <p className="text-xs text-muted-foreground">
                      P: {Number(meal.totalProtein).toFixed(0)}g | C: {Number(meal.totalCarbs).toFixed(0)}g
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Utensils className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">Nenhuma refeição registrada hoje</p>
              <Button variant="link" onClick={() => setLocation("/analyze")} className="mt-2">
                Registrar primeira refeição
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setLocation("/progress")}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Ver Progresso</h3>
              <p className="text-sm text-muted-foreground">Acompanhe sua evolução semanal</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setLocation("/recommendations")}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Utensils className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Recomendações</h3>
              <p className="text-sm text-muted-foreground">Sugestões para sua próxima refeição</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
