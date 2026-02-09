import { useState, useEffect, useCallback } from "react";
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
  Calculator, Ban, Settings, AlertTriangle,
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

export default function ProfileSettings() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = trpc.profile.get.useQuery();
  const updateMutation = trpc.profile.update.useMutation();
  const recalcMutation = trpc.profile.recalculateGoals.useMutation();
  const addWeightMutation = trpc.weight.add.useMutation();

  const [editMode, setEditMode] = useState(false);
  const [newBlacklistItem, setNewBlacklistItem] = useState("");
  const [macroWarning, setMacroWarning] = useState("");

  const [formData, setFormData] = useState({
    height: "",
    currentWeight: "",
    targetWeight: "",
    activityTypes: [] as string[],
    activityFrequencies: {} as Record<string, number>,
    dailyCalorieGoal: "",
    dailyProteinGoal: "",
    dailyCarbsGoal: "",
    dailyFatGoal: "",
    blacklistedFoods: [] as string[],
  });

  const [newWeight, setNewWeight] = useState("");
  const [lastEditedMacro, setLastEditedMacro] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      const types = (profile as any).activityType
        ? (profile as any).activityType.split(",").filter(Boolean)
        : [];
      const freqs = (profile as any).activityFrequencies || {};
      // Ensure all non-sedentary activities have a frequency
      const normalizedFreqs: Record<string, number> = {};
      types.forEach((t: string) => {
        if (t !== "sedentary") {
          normalizedFreqs[t] = freqs[t] || 3;
        }
      });

      setFormData({
        height: (profile as any).height?.toString() || "",
        currentWeight: (profile as any).currentWeight?.toString() || "",
        targetWeight: (profile as any).targetWeight?.toString() || "",
        activityTypes: types,
        activityFrequencies: normalizedFreqs,
        dailyCalorieGoal: profile.dailyCalorieGoal?.toString() || "",
        dailyProteinGoal: profile.dailyProteinGoal?.toString() || "",
        dailyCarbsGoal: profile.dailyCarbsGoal?.toString() || "",
        dailyFatGoal: profile.dailyFatGoal?.toString() || "",
        blacklistedFoods: (profile as any).blacklistedFoods || [],
      });
    }
  }, [profile]);

  // Auto-calculate the 4th macro when 3 are set
  const recalcFourthMacro = useCallback((data: typeof formData, editedField: string) => {
    const cal = Number(data.dailyCalorieGoal);
    const prot = Number(data.dailyProteinGoal);
    const carbs = Number(data.dailyCarbsGoal);
    const fat = Number(data.dailyFatGoal);

    if (!cal || cal <= 0) {
      setMacroWarning("");
      return data;
    }

    // Count how many macros have values
    const hasProt = data.dailyProteinGoal !== "" && prot > 0;
    const hasCarbs = data.dailyCarbsGoal !== "" && carbs > 0;
    const hasFat = data.dailyFatGoal !== "" && fat > 0;
    const filledCount = [hasProt, hasCarbs, hasFat].filter(Boolean).length;

    if (filledCount < 3) {
      setMacroWarning("");
      return data;
    }

    // All 3 macros are filled - calculate what the 4th should be
    // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
    const totalFromMacros = (prot * 4) + (carbs * 4) + (fat * 9);
    const diff = Math.abs(totalFromMacros - cal);

    if (diff > 50) {
      // Adjust the last edited macro to fit
      const updated = { ...data };
      const remaining = cal - (editedField !== "dailyProteinGoal" ? prot * 4 : 0)
                           - (editedField !== "dailyCarbsGoal" ? carbs * 4 : 0)
                           - (editedField !== "dailyFatGoal" ? fat * 9 : 0);

      if (editedField === "dailyCalorieGoal") {
        // Recalculate carbs (most flexible)
        const newCarbs = Math.max(0, Math.round((cal - (prot * 4) - (fat * 9)) / 4));
        updated.dailyCarbsGoal = newCarbs.toString();
        if (newCarbs < 0) {
          setMacroWarning("Impossível atingir essa meta calórica com os macros atuais. Ajustado ao mais próximo possível.");
          updated.dailyCarbsGoal = "0";
          // Recalculate calories to match
          const realCal = (prot * 4) + (fat * 9);
          updated.dailyCalorieGoal = realCal.toString();
        } else {
          setMacroWarning("");
        }
      } else if (editedField === "dailyProteinGoal") {
        const newVal = Math.max(0, Math.round(remaining / 4));
        if (remaining < 0) {
          setMacroWarning("O valor de proteína é muito alto para a meta calórica. Ajustado ao mais próximo possível.");
          const maxProt = Math.max(0, Math.round((cal - (carbs * 4) - (fat * 9)) / 4));
          updated.dailyProteinGoal = maxProt.toString();
        } else {
          setMacroWarning("");
        }
        // Recalculate carbs
        const adjustedProt = Number(updated.dailyProteinGoal);
        const newCarbs = Math.max(0, Math.round((cal - (adjustedProt * 4) - (fat * 9)) / 4));
        updated.dailyCarbsGoal = newCarbs.toString();
      } else if (editedField === "dailyCarbsGoal") {
        // Recalculate fat
        const newFat = Math.max(0, Math.round((cal - (prot * 4) - (carbs * 4)) / 9));
        if (newFat < 0) {
          setMacroWarning("O valor de carboidratos é muito alto para a meta calórica. Ajustado ao mais próximo possível.");
          const maxCarbs = Math.max(0, Math.round((cal - (prot * 4) - (fat * 9)) / 4));
          updated.dailyCarbsGoal = maxCarbs.toString();
        } else {
          updated.dailyFatGoal = newFat.toString();
          setMacroWarning("");
        }
      } else if (editedField === "dailyFatGoal") {
        // Recalculate carbs
        const newCarbs = Math.max(0, Math.round((cal - (prot * 4) - (fat * 9)) / 4));
        if (newCarbs < 0) {
          setMacroWarning("O valor de gordura é muito alto para a meta calórica. Ajustado ao mais próximo possível.");
          const maxFat = Math.max(0, Math.round((cal - (prot * 4) - (carbs * 4)) / 9));
          updated.dailyFatGoal = maxFat.toString();
        } else {
          updated.dailyCarbsGoal = newCarbs.toString();
          setMacroWarning("");
        }
      }

      return updated;
    }

    setMacroWarning("");
    return data;
  }, []);

  const handleMacroChange = (field: string, value: string) => {
    setLastEditedMacro(field);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Debounce recalculation
      return updated;
    });
  };

  // Recalculate on blur (when user finishes editing a macro field)
  const handleMacroBlur = (field: string) => {
    setFormData(prev => recalcFourthMacro(prev, field));
  };

  const toggleActivity = (value: string) => {
    setFormData(prev => {
      if (value === "sedentary") {
        return {
          ...prev,
          activityTypes: prev.activityTypes.includes("sedentary") ? [] : ["sedentary"],
          activityFrequencies: {},
        };
      }
      const withoutSedentary = prev.activityTypes.filter(t => t !== "sedentary");
      const newFreqs = { ...prev.activityFrequencies };
      if (withoutSedentary.includes(value)) {
        delete newFreqs[value];
        return { ...prev, activityTypes: withoutSedentary.filter(t => t !== value), activityFrequencies: newFreqs };
      } else {
        newFreqs[value] = 3; // default 3 days/week
        return { ...prev, activityTypes: [...withoutSedentary, value], activityFrequencies: newFreqs };
      }
    });
  };

  const setActivityFrequency = (activity: string, freq: number) => {
    setFormData(prev => ({
      ...prev,
      activityFrequencies: { ...prev.activityFrequencies, [activity]: freq },
    }));
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
        setMacroWarning("");
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
        activityFrequency: undefined, // deprecated, using activityFrequencies now
        dailyCalorieGoal: formData.dailyCalorieGoal ? Number(formData.dailyCalorieGoal) : undefined,
        dailyProteinGoal: formData.dailyProteinGoal ? Number(formData.dailyProteinGoal) : undefined,
        dailyCarbsGoal: formData.dailyCarbsGoal ? Number(formData.dailyCarbsGoal) : undefined,
        dailyFatGoal: formData.dailyFatGoal ? Number(formData.dailyFatGoal) : undefined,
        blacklistedFoods: formData.blacklistedFoods,
      });
      toast.success("Configurações salvas com sucesso!");
      setEditMode(false);
      refetch();
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  // Auto-save blacklist immediately
  const saveBlacklist = async (foods: string[]) => {
    try {
      await updateMutation.mutateAsync({
        blacklistedFoods: foods,
      });
      refetch();
    } catch {
      toast.error("Erro ao salvar lista de alimentos");
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
    const newFoods = [...formData.blacklistedFoods, item];
    setFormData(prev => ({ ...prev, blacklistedFoods: newFoods }));
    setNewBlacklistItem("");
    saveBlacklist(newFoods);
    toast.success(`"${item}" adicionado à lista.`);
  };

  const removeBlacklistItem = (item: string) => {
    const newFoods = formData.blacklistedFoods.filter(f => f !== item);
    setFormData(prev => ({ ...prev, blacklistedFoods: newFoods }));
    saveBlacklist(newFoods);
    toast.success(`"${item}" removido da lista.`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const isSedentary = formData.activityTypes.includes("sedentary");
  const selectedActivities = formData.activityTypes.filter(t => t !== "sedentary");

  // Calculate macro total for display
  const macroCalories = (Number(formData.dailyProteinGoal) * 4) + (Number(formData.dailyCarbsGoal) * 4) + (Number(formData.dailyFatGoal) * 9);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-500" />
          Configurações
        </h2>
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
                  className="mt-1"
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
                  className="mt-1"
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
                  className="mt-1"
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

      {/* Activity Type + Individual Frequency */}
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

            {/* Individual Frequency per Activity */}
            {!isSedentary && selectedActivities.length > 0 && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                <Label className="text-blue-700 font-semibold">Frequência semanal por atividade</Label>
                <p className="text-xs text-blue-500">Defina quantos dias por semana pratica cada atividade.</p>
                {selectedActivities.map((actValue) => {
                  const act = activityTypes.find(a => a.value === actValue);
                  if (!act) return null;
                  return (
                    <div key={actValue} className="flex items-center gap-3 bg-white p-3 rounded-lg">
                      <span className="text-lg">{act.icon}</span>
                      <span className="text-sm font-medium flex-1">{act.label}</span>
                      <Select
                        value={(formData.activityFrequencies[actValue] || 3).toString()}
                        onValueChange={(v) => setActivityFrequency(actValue, Number(v))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map(n => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}x / semana
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Nutrition Goals with Interlinked Macros */}
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
                Calcular
              </Button>
            </div>
            <CardDescription>
              Defina manualmente ou clique em "Calcular" para usar a fórmula Harris-Benedict. Ao alterar 3 macronutrientes, o 4o é ajustado automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dailyCalorieGoal" className="text-xs">Calorias (kcal)</Label>
                <Input
                  id="dailyCalorieGoal"
                  type="number"
                  value={formData.dailyCalorieGoal}
                  onChange={(e) => handleMacroChange("dailyCalorieGoal", e.target.value)}
                  onBlur={() => handleMacroBlur("dailyCalorieGoal")}
                  className="mt-1 border-amber-300 focus:ring-amber-500"
                />
              </div>
              <div>
                <Label htmlFor="dailyProteinGoal" className="text-xs">Proteína (g)</Label>
                <Input
                  id="dailyProteinGoal"
                  type="number"
                  value={formData.dailyProteinGoal}
                  onChange={(e) => handleMacroChange("dailyProteinGoal", e.target.value)}
                  onBlur={() => handleMacroBlur("dailyProteinGoal")}
                  className="mt-1 border-blue-300 focus:ring-blue-500"
                />
                <span className="text-[10px] text-gray-400">{Number(formData.dailyProteinGoal) * 4} kcal</span>
              </div>
              <div>
                <Label htmlFor="dailyCarbsGoal" className="text-xs">Carboidratos (g)</Label>
                <Input
                  id="dailyCarbsGoal"
                  type="number"
                  value={formData.dailyCarbsGoal}
                  onChange={(e) => handleMacroChange("dailyCarbsGoal", e.target.value)}
                  onBlur={() => handleMacroBlur("dailyCarbsGoal")}
                  className="mt-1 border-green-300 focus:ring-green-500"
                />
                <span className="text-[10px] text-gray-400">{Number(formData.dailyCarbsGoal) * 4} kcal</span>
              </div>
              <div>
                <Label htmlFor="dailyFatGoal" className="text-xs">Gordura (g)</Label>
                <Input
                  id="dailyFatGoal"
                  type="number"
                  value={formData.dailyFatGoal}
                  onChange={(e) => handleMacroChange("dailyFatGoal", e.target.value)}
                  onBlur={() => handleMacroBlur("dailyFatGoal")}
                  className="mt-1 border-orange-300 focus:ring-orange-500"
                />
                <span className="text-[10px] text-gray-400">{Number(formData.dailyFatGoal) * 9} kcal</span>
              </div>
            </div>

            {/* Macro balance indicator */}
            {formData.dailyCalorieGoal && (
              <div className={`p-3 rounded-lg text-sm ${
                Math.abs(macroCalories - Number(formData.dailyCalorieGoal)) <= 50
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                <div className="flex items-center justify-between">
                  <span>Total dos macros: <strong>{macroCalories} kcal</strong></span>
                  <span>Meta: <strong>{formData.dailyCalorieGoal} kcal</strong></span>
                </div>
                {Math.abs(macroCalories - Number(formData.dailyCalorieGoal)) > 50 && (
                  <p className="text-xs mt-1 opacity-75">
                    Diferença de {Math.abs(macroCalories - Number(formData.dailyCalorieGoal))} kcal. Ajuste os macros ou recalcule.
                  </p>
                )}
              </div>
            )}

            {macroWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">{macroWarning}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Alimentos a Evitar - Always editable, auto-saves */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Deseja evitar algum alimento?
            </CardTitle>
            <CardDescription>
              Alimentos adicionados aqui ficam guardados permanentemente até que você os remova manualmente.
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

      {/* Save Button - only for profile edits, not blacklist */}
      {editMode && (
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
