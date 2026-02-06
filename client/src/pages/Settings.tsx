import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  User, 
  Target,
  Loader2,
  Save,
  Plus,
  X,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const DIETARY_OPTIONS = [
  "Vegetariano",
  "Vegano",
  "Sem Glúten",
  "Sem Lactose",
  "Low Carb",
  "Keto",
  "Paleo",
  "Mediterrânea",
];

const ALLERGY_OPTIONS = [
  "Amendoim",
  "Nozes",
  "Leite",
  "Ovos",
  "Trigo",
  "Soja",
  "Peixes",
  "Frutos do Mar",
  "Gergelim",
];

export default function Settings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    dailyCalorieGoal: 2000,
    dailyProteinGoal: 50,
    dailyCarbsGoal: 250,
    dailyFatGoal: 65,
    dietaryPreferences: [] as string[],
    allergies: [] as string[],
  });

  const [customPreference, setCustomPreference] = useState("");
  const [customAllergy, setCustomAllergy] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        dailyCalorieGoal: profile.dailyCalorieGoal || 2000,
        dailyProteinGoal: profile.dailyProteinGoal || 50,
        dailyCarbsGoal: profile.dailyCarbsGoal || 250,
        dailyFatGoal: profile.dailyFatGoal || 65,
        dietaryPreferences: (profile.dietaryPreferences as string[]) || [],
        allergies: (profile.allergies as string[]) || [],
      });
    }
  }, [profile]);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      utils.profile.get.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const togglePreference = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter(p => p !== pref)
        : [...prev.dietaryPreferences, pref],
    }));
  };

  const addCustomPreference = () => {
    if (customPreference.trim() && !formData.dietaryPreferences.includes(customPreference.trim())) {
      setFormData(prev => ({
        ...prev,
        dietaryPreferences: [...prev.dietaryPreferences, customPreference.trim()],
      }));
      setCustomPreference("");
    }
  };

  const toggleAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !formData.allergies.includes(customAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, customAllergy.trim()],
      }));
      setCustomAllergy("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Personalize suas metas nutricionais e preferências
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Nome</Label>
              <p className="font-medium">{user?.name || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{user?.email || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nutritional Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Metas Nutricionais Diárias
          </CardTitle>
          <CardDescription>
            Defina suas metas de consumo diário de calorias e macronutrientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calories */}
          <div className="space-y-2">
            <Label htmlFor="calories">Meta de Calorias (kcal)</Label>
            <Input
              id="calories"
              type="number"
              min={500}
              max={10000}
              value={formData.dailyCalorieGoal}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                dailyCalorieGoal: parseInt(e.target.value) || 2000 
              }))}
            />
            <p className="text-xs text-muted-foreground">
              Recomendado: 1500-2500 kcal para a maioria dos adultos
            </p>
          </div>

          <Separator />

          {/* Macros */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protein">Proteína (g)</Label>
              <Input
                id="protein"
                type="number"
                min={0}
                max={500}
                value={formData.dailyProteinGoal}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dailyProteinGoal: parseInt(e.target.value) || 50 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                ~0.8-1.6g por kg de peso
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbs">Carboidratos (g)</Label>
              <Input
                id="carbs"
                type="number"
                min={0}
                max={1000}
                value={formData.dailyCarbsGoal}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dailyCarbsGoal: parseInt(e.target.value) || 250 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                45-65% das calorias
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat">Gordura (g)</Label>
              <Input
                id="fat"
                type="number"
                min={0}
                max={500}
                value={formData.dailyFatGoal}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  dailyFatGoal: parseInt(e.target.value) || 65 
                }))}
              />
              <p className="text-xs text-muted-foreground">
                20-35% das calorias
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-3">Presets Rápidos</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  dailyCalorieGoal: 1500,
                  dailyProteinGoal: 60,
                  dailyCarbsGoal: 150,
                  dailyFatGoal: 50,
                }))}
              >
                Perda de Peso
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  dailyCalorieGoal: 2000,
                  dailyProteinGoal: 50,
                  dailyCarbsGoal: 250,
                  dailyFatGoal: 65,
                }))}
              >
                Manutenção
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  dailyCalorieGoal: 2500,
                  dailyProteinGoal: 100,
                  dailyCarbsGoal: 300,
                  dailyFatGoal: 80,
                }))}
              >
                Ganho de Massa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  dailyCalorieGoal: 1800,
                  dailyProteinGoal: 90,
                  dailyCarbsGoal: 100,
                  dailyFatGoal: 100,
                }))}
              >
                Low Carb
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferências Alimentares</CardTitle>
          <CardDescription>
            Selecione suas preferências para recomendações mais personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((pref) => (
              <Badge
                key={pref}
                variant={formData.dietaryPreferences.includes(pref) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => togglePreference(pref)}
              >
                {pref}
                {formData.dietaryPreferences.includes(pref) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>

          {/* Custom preferences */}
          {formData.dietaryPreferences.filter(p => !DIETARY_OPTIONS.includes(p)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.dietaryPreferences
                .filter(p => !DIETARY_OPTIONS.includes(p))
                .map((pref) => (
                  <Badge
                    key={pref}
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => togglePreference(pref)}
                  >
                    {pref}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Adicionar preferência personalizada"
              value={customPreference}
              onChange={(e) => setCustomPreference(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomPreference()}
            />
            <Button variant="outline" size="icon" onClick={addCustomPreference}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Alergias e Restrições
          </CardTitle>
          <CardDescription>
            Informe suas alergias para evitar recomendações inadequadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((allergy) => (
              <Badge
                key={allergy}
                variant={formData.allergies.includes(allergy) ? "destructive" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleAllergy(allergy)}
              >
                {allergy}
                {formData.allergies.includes(allergy) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>

          {/* Custom allergies */}
          {formData.allergies.filter(a => !ALLERGY_OPTIONS.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.allergies
                .filter(a => !ALLERGY_OPTIONS.includes(a))
                .map((allergy) => (
                  <Badge
                    key={allergy}
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => toggleAllergy(allergy)}
                  >
                    {allergy}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Adicionar alergia personalizada"
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomAllergy()}
            />
            <Button variant="outline" size="icon" onClick={addCustomAllergy}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          size="lg"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
