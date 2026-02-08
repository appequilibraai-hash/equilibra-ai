import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User, Target, Scale, Dumbbell, Save, Loader2, Plus, X,
  Pencil, Calculator, Ban, Settings, ShieldAlert,
} from "lucide-react";

const activityTypes = [
  { value: "sedentary", label: "Sedentário", icon: "🛋️" },
  { value: "football", label: "Futebol", icon: "⚽" },
  { value: "gym", label: "Academia", icon: "🏋️" },
  { value: "basketball", label: "Basquete", icon: "🏀" },
  { value: "dance", label: "Dança", icon: "💃" },
  { value: "running", label: "Corrida", icon: "🏃" },
  { value: "swimming", label: "Natação", icon: "🏊" },
  { value: "cycling", label: "Ciclismo", icon: "🚴" },
  { value: "other", label: "Outro", icon: "🎯" },
];

const dietaryOptions = [
  "Vegetariano", "Vegano", "Sem Glúten", "Sem Lactose",
  "Low Carb", "Keto", "Mediterrânea", "Paleo",
];

const allergyOptions = [
  "Amendoim", "Nozes", "Leite", "Ovos", "Trigo",
  "Soja", "Peixe", "Frutos do Mar", "Gergelim",
];

export default function ProfileSettings() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery();
  const updateMutation = trpc.profile.update.useMutation();
  const recalcMutation = trpc.profile.recalculateGoals.useMutation();
  const addWeightMutation = trpc.weight.add.useMutation();

  const [editMode, setEditMode] = useState(false);
  const [newBlacklistItem, setNewBlacklistItem] = useState("");

  const [formData, setFormData] = useState({
    height: "",
    currentWeight: "",
    targetWeight: "",
    activityTypes: [] as string[],
    activityFrequency: "3",
    dailyCalorieGoal: "",
    dailyProteinGoal: "",
    dailyCarbsGoal: "",
    dailyFatGoal: "",
    dietaryPreferences: [] as string[],
    allergies: [] as string[],
    blacklistedFoods: [] as string[],
  });

  const [newWeight, setNewWeight] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        height: (profile as any).height?.toString() || "",
        currentWeight: (profile as any).currentWeight?.toString() || "",
        targetWeight: (profile as any).targetWeight?.toString() || "",
        activityTypes: (profile as any).activityType
          ? (profile as any).activityType.split(",").filter(Boolean)
          : [],
        activityFrequency: (profile as any).activityFrequency?.toString() || "3",
        dailyCalorieGoal: profile.dailyCalorieGoal?.toString() || "",
        dailyProteinGoal: profile.dailyProteinGoal?.toString() || "",
        dailyCarbsGoal: profile.dailyCarbsGoal?.toString() || "",
        dailyFatGoal: profile.dailyFatGoal?.toString() || "",
        dietaryPreferences: profile.dietaryPreferences || [],
        allergies: profile.allergies || [],
        blacklistedFoods: (profile as any).blacklistedFoods || [],
      });
    }
  }, [profile]);

  const toggleActivity = (value: string) => {
    if (!editMode) return;
    setFormData(prev => {
      if (value === "sedentary") {
        return {
          ...prev,
          activityTypes: prev.activityTypes.includes("sedentary") ? [] : ["sedentary"],
        };
      }
      const withoutSedentary = prev.activityTypes.filter(t => t !== "sedentary");
      if (withoutSedentary.includes(value)) {
        return { ...prev, activityTypes: withoutSedentary.filter(t => t !== value) };
      } else {
        return { ...prev, activityTypes: [...withoutSedentary, value] };
      }
    });
  };

  const handleRecalculate = async () => {
    try {
      const result = await recalcMutation.mutateAsync();
      if (result) {
        setFormData(prev => ({
          ...prev,
          dailyCalorieGoal: result.dailyCalorieGoal.toString(),
          dailyProteinGoal: result.dailyProteinGoal.toString(),
          dailyCarbsGoal: result.dailyCarbsGoal.toString(),
          dailyFatGoal: result.dailyFatGoal.toString(),
        }));
        toast.success("Metas recalculadas automaticamente com base no seu perfil!");
        refetch();
      } else {
        toast.error("Preencha todos os dados biométricos para recalcular.");
      }
    } catch {
      toast.error("Erro ao recalcular metas.");
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        height: formData.height ? Number(formData.height) : undefined,
        currentWeight: formData.currentWeight ? Number(formData.currentWeight) : undefined,
        targetWeight: formData.targetWeight ? Number(formData.targetWeight) : undefined,
        activityType: formData.activityTypes.length > 0 ? formData.activityTypes.join(",") as any : undefined,
        activityFrequency: formData.activityFrequency ? Number(formData.activityFrequency) : undefined,
        dailyCalorieGoal: formData.dailyCalorieGoal ? Number(formData.dailyCalorieGoal) : undefined,
        dailyProteinGoal: formData.dailyProteinGoal ? Number(formData.dailyProteinGoal) : undefined,
        dailyCarbsGoal: formData.dailyCarbsGoal ? Number(formData.dailyCarbsGoal) : undefined,
        dailyFatGoal: formData.dailyFatGoal ? Number(formData.dailyFatGoal) : undefined,
        dietaryPreferences: formData.dietaryPreferences,
        allergies: formData.allergies,
        blacklistedFoods: formData.blacklistedFoods,
      });
      toast.success("Configurações salvas com sucesso!");
      setEditMode(false);
      refetch();
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight) return;
    try {
      await addWeightMutation.mutateAsync({ weight: Number(newWeight) });
      toast.success("Peso registrado com sucesso!");
      setNewWeight("");
      setFormData(prev => ({ ...prev, currentWeight: newWeight }));
      refetch();
    } catch {
      toast.error("Erro ao registrar peso");
    }
  };

  const addBlacklistItem = () => {
    const item = newBlacklistItem.trim();
    if (!item) return;
    if (formData.blacklistedFoods.includes(item)) {
      toast.error("Este alimento já está na lista.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      blacklistedFoods: [...prev.blacklistedFoods, item],
    }));
    setNewBlacklistItem("");
    setEditMode(true);
  };

  const removeBlacklistItem = (item: string) => {
    setFormData(prev => ({
      ...prev,
      blacklistedFoods: prev.blacklistedFoods.filter(f => f !== item),
    }));
    // Auto-save blacklist changes
    setTimeout(() => {
      setEditMode(true);
    }, 0);
  };

  const togglePreference = (pref: string) => {
    if (!editMode) return;
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter(p => p !== pref)
        : [...prev.dietaryPreferences, pref],
    }));
  };

  const toggleAllergy = (allergy: string) => {
    if (!editMode) return;
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Edit Mode Toggle */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-500" />
            Configurações
          </h2>

        </div>

      </motion.div>

      {/* User Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-500" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={user?.name || ""} disabled className="mt-1 bg-gray-50" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="mt-1 bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Body Metrics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-500" />
              Medidas Corporais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  disabled={!editMode}
                  className={`mt-1 ${!editMode ? "bg-gray-50" : ""}`}
                />
              </div>
              <div>
                <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  step="0.1"
                  value={formData.currentWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentWeight: e.target.value }))}
                  disabled={!editMode}
                  className={`mt-1 ${!editMode ? "bg-gray-50" : ""}`}
                />
              </div>
              <div>
                <Label htmlFor="targetWeight">Peso Meta (kg)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
                  disabled={!editMode}
                  className={`mt-1 ${!editMode ? "bg-gray-50" : ""}`}
                />
              </div>
            </div>

            {/* Quick Weight Update - always available */}
            <div className="p-4 bg-emerald-50 rounded-lg">
              <Label className="text-emerald-700">Registrar Novo Peso</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 72.5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddWeight}
                  disabled={!newWeight || addWeightMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {addWeightMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Type + Frequency */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-emerald-500" />
              Atividade Física
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Selecione "Sedentário" ou escolha um ou mais esportes que pratica.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {activityTypes.map((activity) => {
                const isSelected = formData.activityTypes.includes(activity.value);
                const isSedentarySelected = formData.activityTypes.includes("sedentary");
                const isDisabled = !editMode || (activity.value !== "sedentary" && isSedentarySelected);
                return (
                  <button
                    key={activity.value}
                    type="button"
                    onClick={() => toggleActivity(activity.value)}
                    disabled={isDisabled}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : isDisabled
                        ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                        : "border-gray-200 hover:border-emerald-300"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{activity.icon}</span>
                    <span className="text-xs font-medium">{activity.label}</span>
                    {isSelected && <span className="block mt-1 text-emerald-500 text-xs">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Activity Frequency */}
            {!formData.activityTypes.includes("sedentary") && formData.activityTypes.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <Label className="text-blue-700 mb-2 block">Frequência semanal</Label>
                <Select
                  value={formData.activityFrequency}
                  onValueChange={(v) => editMode && setFormData(prev => ({ ...prev, activityFrequency: v }))}
                  disabled={!editMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? "dia" : "dias"} por semana
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Nutrition Goals with Auto-Calculate */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                Metas Nutricionais Diárias
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculate}
                disabled={recalcMutation.isPending}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                {recalcMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Calculator className="h-4 w-4 mr-1" />
                )}
                Calcular Automaticamente
              </Button>
            </div>
            <CardDescription>
              Defina manualmente ou clique em "Calcular Automaticamente" para usar a fórmula Harris-Benedict com base nos seus dados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dailyCalorieGoal">Calorias (kcal)</Label>
                <Input
                  id="dailyCalorieGoal"
                  type="number"
                  value={formData.dailyCalorieGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyCalorieGoal: e.target.value }))}
                  disabled={!editMode}
                  className={`mt-1 ${!editMode ? "bg-gray-50" : ""}`}
                />
              </div>
              <div>
                <Label htmlFor="dailyProteinGoal">Proteína (g)</Label>
                <Input
                  id="dailyProteinGoal"
                  type="number"
                  value={formData.dailyProteinGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyProteinGoal: e.target.value }))}
                  disabled={!editMode}
                  className={`mt-1 ${!editMode ? "bg-gray-50" : ""}`}
                />
              </div>
              <div>
                <Label htmlFor="dailyCarbsGoal">Carboidratos (g)</Label>
                <Input
                  id="dailyCarbsGoal"
                  type="number"
                  value={formData.dailyCarbsGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyCarbsGoal: e.target.value }))}
                  disabled={!editMode}
                  className={`mt-1 ${!editMode ? "bg-gray-50" : ""}`}
                />
              </div>
              <div>
                <Label htmlFor="dailyFatGoal">Gordura (g)</Label>
                <Input
                  id="dailyFatGoal"
                  type="number"
                  value={formData.dailyFatGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyFatGoal: e.target.value }))}
                  disabled={!editMode}
                  className={`mt-1 ${!editMode ? "bg-gray-50" : ""}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alimentos a Evitar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Deseja evitar algum alimento?
            </CardTitle>
            <CardDescription>
              Adicione alimentos que serão excluídos das sugestões de refeição.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite o nome do alimento..."
                value={newBlacklistItem}
                onChange={(e) => setNewBlacklistItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBlacklistItem()}
                className="flex-1"
              />
              <Button onClick={addBlacklistItem} className="bg-red-500 hover:bg-red-600">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            {formData.blacklistedFoods.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Alimentos na lista ({formData.blacklistedFoods.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {formData.blacklistedFoods.map((food) => (
                    <Badge
                      key={food}
                      variant="destructive"
                      className="text-sm py-1.5 px-3 flex items-center gap-1.5 cursor-pointer hover:bg-red-600 transition-colors"
                      onClick={() => removeBlacklistItem(food)}
                    >
                      {food}
                      <X className="h-3.5 w-3.5 opacity-70 hover:opacity-100" />
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Clique no alimento para removê-lo da lista.</p>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Ban className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  Nenhum alimento na lista. Adicione acima os alimentos que deseja evitar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>



      {/* Save Button */}
      {(editMode || formData.blacklistedFoods.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 py-6 text-lg"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
