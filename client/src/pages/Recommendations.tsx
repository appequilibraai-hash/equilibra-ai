import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Loader2,
  Utensils,
  Clock,
  ChefHat,
  Sparkles
} from "lucide-react";

export default function Recommendations() {
  const { data, isLoading, error } = trpc.recommendations.getNextMeal.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Gerando recomendações personalizadas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Erro ao carregar recomendações</p>
      </div>
    );
  }

  const { 
    nextMealType, 
    remaining, 
    goals, 
    consumed, 
    recommendations,
    mealsToday 
  } = data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          Recomendações
        </h1>
        <p className="text-muted-foreground mt-1">
          Sugestões personalizadas para sua próxima refeição
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Seu Status Atual
          </CardTitle>
          <CardDescription>
            Você registrou {mealsToday || 0} {mealsToday === 1 ? "refeição" : "refeições"} hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Calories Remaining */}
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">Calorias</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{remaining?.calories || 0}</p>
              <p className="text-xs text-orange-600/70">restantes de {goals?.calories || 2000}</p>
              <Progress 
                value={((consumed?.calories || 0) / (goals?.calories || 2000)) * 100} 
                className="h-2 mt-2"
              />
            </div>

            {/* Protein Remaining */}
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Beef className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Proteína</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{remaining?.protein || 0}g</p>
              <p className="text-xs text-red-600/70">restantes de {goals?.protein || 50}g</p>
              <Progress 
                value={((consumed?.protein || 0) / (goals?.protein || 50)) * 100} 
                className="h-2 mt-2"
              />
            </div>

            {/* Carbs Remaining */}
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wheat className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">Carboidratos</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{remaining?.carbs || 0}g</p>
              <p className="text-xs text-amber-600/70">restantes de {goals?.carbs || 250}g</p>
              <Progress 
                value={((consumed?.carbs || 0) / (goals?.carbs || 250)) * 100} 
                className="h-2 mt-2"
              />
            </div>

            {/* Fat Remaining */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700">Gordura</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{remaining?.fat || 0}g</p>
              <p className="text-xs text-yellow-600/70">restantes de {goals?.fat || 65}g</p>
              <Progress 
                value={((consumed?.fat || 0) / (goals?.fat || 65)) * 100} 
                className="h-2 mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Meal Suggestion */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Próxima Refeição Sugerida
          </CardTitle>
          <CardDescription>
            Com base no horário atual, sugerimos opções para o seu <strong>{nextMealType}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ChefHat className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-orange-600 bg-orange-100">
                    {rec.estimatedCalories} kcal
                  </Badge>
                </div>
                <CardDescription className="mt-2">
                  {rec.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Macros */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="font-medium text-red-600">{rec.estimatedProtein}g</p>
                    <p className="text-xs text-red-600/70">Proteína</p>
                  </div>
                  <div className="text-center p-2 bg-amber-50 rounded">
                    <p className="font-medium text-amber-600">{rec.estimatedCarbs}g</p>
                    <p className="text-xs text-amber-600/70">Carboidratos</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <p className="font-medium text-yellow-600">{rec.estimatedFat}g</p>
                    <p className="text-xs text-yellow-600/70">Gordura</p>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                    <Utensils className="h-4 w-4" />
                    Ingredientes
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {rec.ingredients.map((ingredient, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {rec.tips}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Não foi possível gerar recomendações no momento.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente novamente mais tarde ou configure suas preferências alimentares.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dicas para Atingir suas Metas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {remaining && remaining.calories > 500 && (
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-foreground mb-1">Calorias Restantes</p>
                <p className="text-sm text-muted-foreground">
                  Você ainda tem {remaining.calories} kcal disponíveis. Considere uma refeição mais substancial.
                </p>
              </div>
            )}
            {remaining && remaining.protein > 20 && (
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-foreground mb-1">Aumente a Proteína</p>
                <p className="text-sm text-muted-foreground">
                  Faltam {remaining.protein}g de proteína. Inclua carnes magras, ovos ou leguminosas.
                </p>
              </div>
            )}
            {remaining && remaining.carbs < 50 && consumed && consumed.carbs > 0 && (
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-foreground mb-1">Carboidratos Controlados</p>
                <p className="text-sm text-muted-foreground">
                  Você está próximo da meta de carboidratos. Opte por vegetais e proteínas.
                </p>
              </div>
            )}
            {remaining && remaining.fat < 20 && consumed && consumed.fat > 0 && (
              <div className="p-4 border rounded-lg">
                <p className="font-medium text-foreground mb-1">Gorduras Equilibradas</p>
                <p className="text-sm text-muted-foreground">
                  Restam apenas {remaining.fat}g de gordura. Evite frituras e alimentos processados.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
