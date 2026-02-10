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
  Calculator, Ban, Settings, AlertTriangle, Edit2, Check,
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

  const [newBlacklistItem, setNewBlacklistItem] = useState("");
  const [macroWarning, setMacroWarning] = useState("");
  const [macroEditMode, setMacroEditMode] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    biologicalSex: "",
    mainObjective: "",
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
  const [personalInfoEditMode, setPersonalInfoEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const types = (profile as any).activityType
        ? (profile as any).activityType.split(",").filter(Boolean)
        : [];
      const freqs = (profile as any).activityFrequencies || {};
      const normalizedFreqs: Record<string, number> = {};
      types.forEach((t: string) => {
        if (t !== "sedentary") {
          normalizedFreqs[t] = freqs[t] || 3;
        }
      });

      setFormData({
        fullName: (profile as any).fullName || "",
        dateOfBirth: (profile as any).dateOfBirth || "",
        biologicalSex: (profile as any).biologicalSex || "",
        mainObjective: (profile as any).mainObjective || "",
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

  // Advanced macro reactivity: 2 scenarios
  const recalcMacros = useCallback((data: typeof formData, editedField: string) => {
    const cal = Number(data.dailyCalorieGoal);
    const prot = Number(data.dailyProteinGoal);
    const carbs = Number(data.dailyCarbsGoal);
    const fat = Number(data.dailyFatGoal);

    if (!cal || cal <= 0) {
      setMacroWarning("");
      return data;
    }

    const updated = { ...data };

    // SCENARIO A: User changed Calories - recalculate all macros with default distribution
    if (editedField === "dailyCalorieGoal") {
      const proteinCals = cal * 0.30;
      const carbsCals = cal * 0.40;
      const fatCals = cal * 0.30;

      updated.dailyProteinGoal = Math.round(proteinCals / 4).toString();
      updated.dailyCarbsGoal = Math.round(carbsCals / 4).toString();
      updated.dailyFatGoal = Math.round(fatCals / 9).toString();
      setMacroWarning("");
      return updated;
    }

    // SCENARIO B: User changed a specific macro - keep calories fixed, recalculate others
    const totalFromMacros = (prot * 4) + (carbs * 4) + (fat * 9);
    const diff = totalFromMacros - cal;

    if (Math.abs(diff) > 5) {
      if (editedField === "dailyProteinGoal") {
        const remainingCals = cal - (prot * 4);
        if (remainingCals < 0) {
          setMacroWarning("⚠️ Proteína muito alta! Reduzindo para caber na meta calórica.");
          const maxProt = Math.max(0, Math.round((cal * 0.50) / 4));
          updated.dailyProteinGoal = maxProt.toString();
          const newRemaining = cal - (maxProt * 4);
          updated.dailyCarbsGoal = Math.round((newRemaining * 0.57) / 4).toString();
          updated.dailyFatGoal = Math.round((newRemaining * 0.43) / 9).toString();
        } else {
          updated.dailyCarbsGoal = Math.round((remainingCals * 0.57) / 4).toString();
          updated.dailyFatGoal = Math.round((remainingCals * 0.43) / 9).toString();
          setMacroWarning("");
        }
      } else if (editedField === "dailyCarbsGoal") {
        const remainingCals = cal - (carbs * 4);
        if (remainingCals < 0) {
          setMacroWarning("⚠️ Carboidratos muito altos! Reduzindo para caber na meta calórica.");
          const maxCarbs = Math.max(0, Math.round((cal * 0.50) / 4));
          updated.dailyCarbsGoal = maxCarbs.toString();
          const newRemaining = cal - (maxCarbs * 4);
          updated.dailyProteinGoal = Math.round((newRemaining * 0.50) / 4).toString();
          updated.dailyFatGoal = Math.round((newRemaining * 0.50) / 9).toString();
        } else {
          updated.dailyProteinGoal = Math.round((remainingCals * 0.50) / 4).toString();
          updated.dailyFatGoal = Math.round((remainingCals * 0.50) / 9).toString();
          setMacroWarning("");
        }
      } else if (editedField === "dailyFatGoal") {
        const remainingCals = cal - (fat * 9);
        if (remainingCals < 0) {
          setMacroWarning("⚠️ Gordura muito alta! Reduzindo para caber na meta calórica.");
          const maxFat = Math.max(0, Math.round((cal * 0.30) / 9));
          updated.dailyFatGoal = maxFat.toString();
          const newRemaining = cal - (maxFat * 9);
          updated.dailyProteinGoal = Math.round((newRemaining * 0.30) / 4).toString();
          updated.dailyCarbsGoal = Math.round((newRemaining * 0.70) / 4).toString();
        } else {
          updated.dailyProteinGoal = Math.round((remainingCals * 0.30) / 4).toString();
          updated.dailyCarbsGoal = Math.round((remainingCals * 0.70) / 4).toString();
          setMacroWarning("");
        }
      }
    } else {
      setMacroWarning("");
    }

    return updated;
  }, []);

  const handleMacroChange = (field: string, value: string) => {
    setLastEditedMacro(field);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      return recalcMacros(updated, field);
    });
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
      const newTypes = withoutSedentary.includes(value)
        ? withoutSedentary.filter(t => t !== value)
        : [...withoutSedentary, value];

      const newFreqs = { ...prev.activityFrequencies };
      if (!newTypes.includes(value)) {
        delete newFreqs[value];
      } else if (!newFreqs[value]) {
        newFreqs[value] = 3;
      }

      return {
        ...prev,
        activityTypes: newTypes,
        activityFrequencies: newFreqs,
      };
    });
  };

  const updateActivityFrequency = (activity: string, frequency: number) => {
    setFormData(prev => ({
      ...prev,
      activityFrequencies: {
        ...prev.activityFrequencies,
        [activity]: frequency,
      },
    }));
  };

  const handleRecalculate = async () => {
    try {
      const result = await recalcMutation.mutateAsync();
      if (result) {
        setFormData(prev => ({
          fullName: prev.fullName,
          dateOfBirth: prev.dateOfBirth,
          biologicalSex: prev.biologicalSex,
          mainObjective: prev.mainObjective,
          height: prev.height,
          currentWeight: prev.currentWeight,
          targetWeight: prev.targetWeight,
          activityTypes: prev.activityTypes,
          activityFrequencies: prev.activityFrequencies,
          dailyCalorieGoal: result.dailyCalorieGoal.toString(),
          dailyProteinGoal: result.dailyProteinGoal.toString(),
          dailyCarbsGoal: result.dailyCarbsGoal.toString(),
          dailyFatGoal: result.dailyFatGoal.toString(),
          blacklistedFoods: prev.blacklistedFoods,
        }));
        setMacroWarning("");
        toast.success("Metas recalculadas automaticamente com base no seu perfil!");
      } else {
        toast.error("Preencha todos os dados biométricos para recalcular.");
      }
    } catch {
      toast.error("Erro ao recalcular metas.");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      toast.loading("Salvando dados...");
      
      await updateMutation.mutateAsync({
        fullName: formData.fullName || undefined,
        sex: formData.biologicalSex as any || undefined,
        birthDate: formData.dateOfBirth || undefined,
        mainObjective: formData.mainObjective as any || undefined,
        height: formData.height ? Number(formData.height) : undefined,
        currentWeight: formData.currentWeight ? Number(formData.currentWeight) : undefined,
        targetWeight: formData.targetWeight ? Number(formData.targetWeight) : undefined,
        activityType: formData.activityTypes.length > 0 ? formData.activityTypes.join(",") as any : undefined,
        activityFrequency: undefined,
        dailyCalorieGoal: formData.dailyCalorieGoal ? Number(formData.dailyCalorieGoal) : undefined,
        dailyProteinGoal: formData.dailyProteinGoal ? Number(formData.dailyProteinGoal) : undefined,
        dailyCarbsGoal: formData.dailyCarbsGoal ? Number(formData.dailyCarbsGoal) : undefined,
        dailyFatGoal: formData.dailyFatGoal ? Number(formData.dailyFatGoal) : undefined,
        blacklistedFoods: formData.blacklistedFoods,
      });
      
      setIsSaving(false);
      toast.success("Dados salvos com sucesso!");
    } catch (error) {
      setIsSaving(false);
      toast.error("Erro ao salvar configurações");
      console.error("Erro ao salvar:", error);
    }
  };

  const saveBlacklist = async (foods: string[]) => {
    try {
      await updateMutation.mutateAsync({
        blacklistedFoods: foods,
      });
      toast.success("Lista de alimentos atualizada!");
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

  const macroCalories = (Number(formData.dailyProteinGoal) * 4) + (Number(formData.dailyCarbsGoal) * 4) + (Number(formData.dailyFatGoal) * 9);

  return (
    <div className="space-y-6 max-w-3xl">
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-500" />
                Informações Pessoais
              </CardTitle>
              {!personalInfoEditMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPersonalInfoEditMode(true)}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setPersonalInfoEditMode(false)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-xs">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  disabled={!personalInfoEditMode}
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`mt-1 ${personalInfoEditMode ? '' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth" className="text-xs">Data de Nascimento</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  disabled={!personalInfoEditMode}
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className={`mt-1 ${personalInfoEditMode ? '' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                />
              </div>
              <div>
                <Label htmlFor="biologicalSex" className="text-xs">Sexo</Label>
                <Select
                  value={formData.biologicalSex}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, biologicalSex: val }))}
                  disabled={!personalInfoEditMode}
                >
                  <SelectTrigger className={`mt-1 ${personalInfoEditMode ? '' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mainObjective" className="text-xs">Objetivo Principal</Label>
                <Select
                  value={formData.mainObjective}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, mainObjective: val }))}
                  disabled={!personalInfoEditMode}
                >
                  <SelectTrigger className={`mt-1 ${personalInfoEditMode ? '' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_fat">Perder Gordura</SelectItem>
                    <SelectItem value="maintain">Manter Peso</SelectItem>
                    <SelectItem value="gain_muscle">Ganhar Músculo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Dados Físicos</p>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height" className="text-xs">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  disabled={!personalInfoEditMode}
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  className={`mt-1 ${personalInfoEditMode ? '' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                />
              </div>
              <div>
                <Label htmlFor="currentWeight" className="text-xs">Peso Atual (kg)</Label>
                <Input
                  id="currentWeight"
                  type="number"
                  disabled={!personalInfoEditMode}
                  value={formData.currentWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentWeight: e.target.value }))}
                  className={`mt-1 ${personalInfoEditMode ? '' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                />
              </div>
              <div>
                <Label htmlFor="targetWeight" className="text-xs">Peso Desejado (kg)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  disabled={!personalInfoEditMode}
                  value={formData.targetWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetWeight: e.target.value }))}
                  className={`mt-1 ${personalInfoEditMode ? '' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                />
              </div>

            </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Physical Activities */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-emerald-500" />
              Atividades Físicas
            </CardTitle>
            <CardDescription>Selecione suas atividades. Sedentário exclui outras opções.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {activityTypes.map(activity => (
                <motion.button
                  key={activity.value}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => toggleActivity(activity.value)}
                  disabled={activity.value !== "sedentary" && isSedentary}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.activityTypes.includes(activity.value)
                      ? "border-emerald-500 bg-emerald-50"
                      : activity.value !== "sedentary" && isSedentary
                      ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{activity.icon}</div>
                  <div className="text-xs font-semibold text-gray-700">{activity.label}</div>
                  {formData.activityTypes.includes(activity.value) && (
                    <div className="text-emerald-600 text-lg">✓</div>
                  )}
                </motion.button>
              ))}
            </div>

            {selectedActivities.length > 0 && (
              <div className="space-y-3 mt-4 pt-4 border-t">
                <p className="text-sm font-semibold text-gray-700">Frequência Semanal por Atividade</p>
                {selectedActivities.map(activity => {
                  const actLabel = activityTypes.find(a => a.value === activity)?.label || activity;
                  return (
                    <div key={activity} className="flex items-center gap-3">
                      <Label className="text-xs w-24">{actLabel}</Label>
                      <Select
                        value={(formData.activityFrequencies[activity] || 3).toString()}
                        onValueChange={(val) => updateActivityFrequency(activity, Number(val))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map(day => (
                            <SelectItem key={day} value={day.toString()}>{day}x</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-gray-500">dias/semana</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Nutrition Goals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                Metas Nutricionais Diárias
              </CardTitle>
              <div className="flex gap-2">
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
                {!macroEditMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMacroEditMode(true)}
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setMacroEditMode(false)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                )}
              </div>
            </div>
            <CardDescription>
              Defina sua meta calórica para uma distribuição automática ou ajuste os macronutrientes individualmente conforme sua necessidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dailyCalorieGoal" className="text-xs">Calorias (kcal)</Label>
                <Input
                  id="dailyCalorieGoal"
                  type="number"
                  disabled={!macroEditMode}
                  value={formData.dailyCalorieGoal}
                  onChange={(e) => handleMacroChange("dailyCalorieGoal", e.target.value)}
                  className={`mt-1 ${macroEditMode ? 'border-amber-300 focus:ring-amber-500' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                />
              </div>
              <div>
                <Label htmlFor="dailyProteinGoal" className="text-xs">Proteína (g)</Label>
                <Input
                  id="dailyProteinGoal"
                  type="number"
                  disabled={!macroEditMode}
                  value={formData.dailyProteinGoal}
                  onChange={(e) => handleMacroChange("dailyProteinGoal", e.target.value)}
                  className={`mt-1 ${macroEditMode ? 'border-blue-300 focus:ring-blue-500' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                />
                <span className="text-[10px] text-gray-400">{Number(formData.dailyProteinGoal) * 4} kcal</span>
              </div>
              <div>
                <Label htmlFor="dailyCarbsGoal" className="text-xs">Carboidratos (g)</Label>
                <Input
                  id="dailyCarbsGoal"
                  type="number"
                  disabled={!macroEditMode}
                  value={formData.dailyCarbsGoal}
                  onChange={(e) => handleMacroChange("dailyCarbsGoal", e.target.value)}
                  className={`mt-1 ${macroEditMode ? 'border-green-300 focus:ring-green-500' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                />
                <span className="text-[10px] text-gray-400">{Number(formData.dailyCarbsGoal) * 4} kcal</span>
              </div>
              <div>
                <Label htmlFor="dailyFatGoal" className="text-xs">Gordura (g)</Label>
                <Input
                  id="dailyFatGoal"
                  type="number"
                  disabled={!macroEditMode}
                  value={formData.dailyFatGoal}
                  onChange={(e) => handleMacroChange("dailyFatGoal", e.target.value)}
                  className={`mt-1 ${macroEditMode ? 'border-orange-300 focus:ring-orange-500' : 'bg-gray-100 text-gray-600 cursor-not-allowed'}`}
                />
                <span className="text-[10px] text-gray-400">{Number(formData.dailyFatGoal) * 9} kcal</span>
              </div>
            </div>

            {/* Macro balance indicator with real-time feedback */}
            {formData.dailyCalorieGoal && (
              <div className={`p-3 rounded-lg text-sm transition-colors ${
                Math.abs(macroCalories - Number(formData.dailyCalorieGoal)) <= 20
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : Math.abs(macroCalories - Number(formData.dailyCalorieGoal)) <= 50
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                <div className="flex items-center justify-between">
                  <span>Total dos macros: <strong>{macroCalories} kcal</strong></span>
                  <span>Meta: <strong>{formData.dailyCalorieGoal} kcal</strong></span>
                </div>
                {Math.abs(macroCalories - Number(formData.dailyCalorieGoal)) > 50 && (
                  <p className="text-xs mt-2 font-semibold">
                    ⚠️ Diferença de {Math.abs(macroCalories - Number(formData.dailyCalorieGoal))} kcal
                  </p>
                )}
                {macroWarning && (
                  <p className="text-xs mt-2 font-semibold">{macroWarning}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Blacklist Foods */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Deseja evitar algum alimento?
            </CardTitle>
            <CardDescription>
              Alimentos adicionados aqui ficam guardados permanentemente e serão banidos das recomendações da IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Digite um alimento..."
                value={newBlacklistItem}
                onChange={(e) => setNewBlacklistItem(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addBlacklistItem()}
              />
              <Button
                onClick={addBlacklistItem}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {formData.blacklistedFoods.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">Alimentos na lista:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.blacklistedFoods.map(food => (
                    <Badge
                      key={food}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer"
                      onClick={() => removeBlacklistItem(food)}
                    >
                      {food}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>


    </div>
  );
}
