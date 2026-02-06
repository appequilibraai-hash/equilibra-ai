import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  Utensils, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Camera
} from "lucide-react";
import { useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const mealTypeLabels: Record<string, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
};

const mealTypeColors: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-700",
  lunch: "bg-green-100 text-green-700",
  dinner: "bg-blue-100 text-blue-700",
  snack: "bg-purple-100 text-purple-700",
};

export default function History() {
  const [, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);

  const { data: meals, isLoading } = trpc.meals.getByDateRange.useQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  // Group meals by date
  const mealsByDate = meals?.reduce((acc, meal) => {
    const dateKey = format(new Date(meal.mealTime), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>) || {};

  // Get meals for selected date or all meals if no date selected
  const displayMeals = selectedDate 
    ? mealsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : meals || [];

  // Calculate daily totals for selected date
  const dailyTotals = selectedDate && mealsByDate[format(selectedDate, "yyyy-MM-dd")]
    ? mealsByDate[format(selectedDate, "yyyy-MM-dd")].reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.totalCalories || 0),
          protein: acc.protein + Number(meal.totalProtein || 0),
          carbs: acc.carbs + Number(meal.totalCarbs || 0),
          fat: acc.fat + Number(meal.totalFat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico de Refeições</h1>
          <p className="text-muted-foreground mt-1">
            Visualize todas as suas refeições registradas
          </p>
        </div>
        <Button onClick={() => setLocation("/analyze")}>
          <Camera className="h-4 w-4 mr-2" />
          Nova Refeição
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Calendário</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={ptBR}
              modifiers={{
                hasMeals: Object.keys(mealsByDate).map(d => new Date(d)),
              }}
              modifiersStyles={{
                hasMeals: {
                  fontWeight: "bold",
                  backgroundColor: "oklch(0.55 0.15 160 / 0.2)",
                  borderRadius: "50%",
                },
              }}
              className="rounded-md"
            />
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={() => setSelectedDate(undefined)}
              >
                Limpar seleção
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Meals List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              {selectedDate 
                ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
                : "Todas as Refeições"}
            </CardTitle>
            <CardDescription>
              {displayMeals.length} {displayMeals.length === 1 ? "refeição" : "refeições"}
              {selectedDate && dailyTotals && (
                <span className="ml-2">
                  • {dailyTotals.calories} kcal total
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayMeals.length > 0 ? (
              <div className="space-y-3">
                {/* Daily Summary for selected date */}
                {selectedDate && dailyTotals && (
                  <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg mb-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">{dailyTotals.calories}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">{dailyTotals.protein.toFixed(0)}g</p>
                      <p className="text-xs text-muted-foreground">Proteína</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">{dailyTotals.carbs.toFixed(0)}g</p>
                      <p className="text-xs text-muted-foreground">Carboidratos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-600">{dailyTotals.fat.toFixed(0)}g</p>
                      <p className="text-xs text-muted-foreground">Gordura</p>
                    </div>
                  </div>
                )}

                {displayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setLocation(`/meal/${meal.id}`)}
                  >
                    <img
                      src={meal.imageUrl}
                      alt="Refeição"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={mealTypeColors[meal.mealType]}>
                          {mealTypeLabels[meal.mealType]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(meal.mealTime), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>P: {Number(meal.totalProtein).toFixed(0)}g</span>
                        <span>C: {Number(meal.totalCarbs).toFixed(0)}g</span>
                        <span>G: {Number(meal.totalFat).toFixed(0)}g</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-600">{meal.totalCalories}</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Utensils className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {selectedDate 
                    ? "Nenhuma refeição neste dia"
                    : "Nenhuma refeição registrada este mês"}
                </p>
                <Button variant="link" onClick={() => setLocation("/analyze")} className="mt-2">
                  Registrar uma refeição
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
