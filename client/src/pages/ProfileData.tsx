import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Utensils, 
  Trash2, 
  ChevronRight,
  ImageIcon
} from "lucide-react";
import { toast } from "sonner";

export default function ProfileData() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(),
  });

  const { data: meals, isLoading, refetch } = trpc.meals.list.useQuery({ limit: 50 });
  const { data: todayMeals } = trpc.meals.getToday.useQuery();
  const deleteMutation = trpc.meals.delete.useMutation();

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta refeição?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Refeição excluída com sucesso");
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir refeição");
    }
  };

  const getMealTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      breakfast: "☕ Café da manhã",
      lunch: "🍽️ Almoço",
      dinner: "🌙 Jantar",
      snack: "🍎 Lanche",
    };
    return types[type] || type;
  };

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      breakfast: "bg-amber-100 text-amber-700",
      lunch: "bg-emerald-100 text-emerald-700",
      dinner: "bg-indigo-100 text-indigo-700",
      snack: "bg-pink-100 text-pink-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  // Group meals by date
  const groupedMeals = meals?.reduce((acc, meal) => {
    const date = format(new Date(meal.mealTime), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100">Refeições de Hoje</p>
                <p className="text-4xl font-bold">{todayMeals?.length || 0}</p>
              </div>
              <Utensils className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Meals History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-emerald-500" />
          Histórico de Refeições
        </h2>

        {Object.keys(groupedMeals).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhuma refeição registrada
              </h3>
              <p className="text-gray-500 mb-4">
                Comece a registrar suas refeições para acompanhar sua nutrição
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  Analisar Primeira Refeição
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMeals)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dayMeals]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    {format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <div className="space-y-3">
                    {dayMeals?.map((meal) => (
                      <Card key={meal.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Meal Image */}
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {meal.imageUrl ? (
                                <img
                                  src={meal.imageUrl}
                                  alt="Refeição"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Utensils className="h-8 w-8 text-gray-300" />
                                </div>
                              )}
                            </div>

                            {/* Meal Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMealTypeColor(meal.mealType)}`}>
                                  {getMealTypeLabel(meal.mealType)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {format(new Date(meal.mealTime), "HH:mm")}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 truncate">
                                {(meal.detectedFoods as any[])?.slice(0, 3).map((f: any) => f.name).join(", ") || "Refeição"}
                              </p>

                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span className="text-orange-600 font-medium">
                                  {meal.totalCalories} kcal
                                </span>
                                <span className="text-red-500">
                                  P: {meal.totalProtein}g
                                </span>
                                <span className="text-amber-500">
                                  C: {meal.totalCarbs}g
                                </span>
                                <span className="text-yellow-500">
                                  G: {meal.totalFat}g
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/meal/${meal.id}`}>
                                <Button variant="ghost" size="sm">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(meal.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
