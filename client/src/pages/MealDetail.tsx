import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Trash2,
  Clock,
  Utensils,
  Loader2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const mealTypeLabels: Record<string, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
};

export default function MealDetail() {
  const [, params] = useRoute("/meal/:id");
  const [, setLocation] = useLocation();
  const mealId = params?.id ? parseInt(params.id) : 0;

  const { data: meal, isLoading, error } = trpc.meals.getById.useQuery(
    { id: mealId },
    { enabled: mealId > 0 }
  );

  const deleteMutation = trpc.meals.delete.useMutation({
    onSuccess: () => {
      toast.success("Refeição excluída com sucesso");
      setLocation("/history");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Refeição não encontrada</p>
        <Button variant="outline" onClick={() => setLocation("/history")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Histórico
        </Button>
      </div>
    );
  }

  const detectedFoods = (meal.detectedFoods as any[]) || [];
  const detectedSauces = (meal.detectedSauces as string[]) || [];
  const detectedIngredients = (meal.detectedIngredients as string[]) || [];
  const micronutrients = (meal.micronutrients as any[]) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/history")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {mealTypeLabels[meal.mealType] || meal.mealType}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4" />
              {format(new Date(meal.mealTime), "PPP 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir refeição?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A refeição será permanentemente removida do seu histórico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate({ id: mealId })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image */}
        <Card>
          <CardContent className="p-0">
            <img
              src={meal.imageUrl}
              alt="Foto da refeição"
              className="w-full aspect-[4/3] object-cover rounded-lg"
            />
          </CardContent>
        </Card>

        {/* Macros Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Resumo Nutricional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calories */}
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-4xl font-bold text-orange-600">{meal.totalCalories}</p>
              <p className="text-sm text-orange-600/80">calorias</p>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <Beef className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-xl font-semibold text-red-600">{Number(meal.totalProtein).toFixed(1)}g</p>
                <p className="text-xs text-red-600/80">Proteína</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <Wheat className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xl font-semibold text-amber-600">{Number(meal.totalCarbs).toFixed(1)}g</p>
                <p className="text-xs text-amber-600/80">Carboidratos</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <Droplets className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-xl font-semibold text-yellow-600">{Number(meal.totalFat).toFixed(1)}g</p>
                <p className="text-xs text-yellow-600/80">Gordura</p>
              </div>
            </div>

            {/* Additional Macros */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 bg-muted rounded">
                <p className="font-medium">{Number(meal.totalFiber).toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">Fibra</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="font-medium">{Number(meal.totalSugar).toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground">Açúcar</p>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <p className="font-medium">{Number(meal.totalSodium).toFixed(0)}mg</p>
                <p className="text-xs text-muted-foreground">Sódio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detected Foods */}
      {detectedFoods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Alimentos Identificados
            </CardTitle>
            <CardDescription>
              Alimentos detectados pela IA com suas informações nutricionais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detectedFoods.map((food: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">{food.name}</h4>
                      <p className="text-sm text-muted-foreground">{food.quantity}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {food.confidence}% confiança
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <p className="font-medium text-orange-600">{food.calories}</p>
                      <p className="text-xs text-orange-600/80">kcal</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="font-medium text-red-600">{food.protein}g</p>
                      <p className="text-xs text-red-600/80">Prot</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded">
                      <p className="font-medium text-amber-600">{food.carbs}g</p>
                      <p className="text-xs text-amber-600/80">Carb</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="font-medium text-yellow-600">{food.fat}g</p>
                      <p className="text-xs text-yellow-600/80">Gord</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sauces and Ingredients */}
      <div className="grid md:grid-cols-2 gap-6">
        {detectedSauces.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Molhos Detectados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {detectedSauces.map((sauce: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {sauce}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {detectedIngredients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ingredientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {detectedIngredients.map((ingredient: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Micronutrients */}
      {micronutrients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Micronutrientes</CardTitle>
            <CardDescription>
              Vitaminas e minerais presentes na refeição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {micronutrients.map((nutrient: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{nutrient.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {nutrient.amount}{nutrient.unit}
                    </span>
                  </div>
                  {nutrient.percentDailyValue > 0 && (
                    <>
                      <Progress value={Math.min(nutrient.percentDailyValue, 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {nutrient.percentDailyValue}% do valor diário
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Notes */}
      {meal.analysisNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{meal.analysisNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
