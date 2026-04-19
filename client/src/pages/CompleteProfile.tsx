import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

const activityTypes = [
  { value: "sedentary", label: "Sedentário", icon: "🛋️" },
  { value: "football", label: "Futebol", icon: "⚽" },
  { value: "gym", label: "Academia", icon: "🏋️" },
  { value: "basketball", label: "Basquete", icon: "🏀" },
  { value: "dance", label: "Dança", icon: "💃" },
  { value: "running", label: "Corrida", icon: "🏃" },
  { value: "swimming", label: "Natação", icon: "🏊" },
  { value: "cycling", label: "Ciclismo", icon: "🚴" },
];

export default function CompleteProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery();
  const updateMutation = trpc.profile.update.useMutation();
  const recalcMutation = trpc.profile.recalculateGoals.useMutation();
  const completeOnboardingMutation = trpc.profile.completeOnboarding.useMutation();

  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    sex: "",
    mainObjective: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
    activityTypes: [] as string[],
    activityFrequencies: {} as Record<string, number>,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Load existing profile data if available
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

      const formatDateToBrazilian = (isoDate: string) => {
        if (!isoDate) return "";
        try {
          const date = new Date(isoDate);
          const day = String(date.getUTCDate()).padStart(2, "0");
          const month = String(date.getUTCMonth() + 1).padStart(2, "0");
          const year = date.getUTCFullYear();
          return `${day}/${month}/${year}`;
        } catch {
          return "";
        }
      };

      setFormData({
        fullName: (profile as any).fullName || "",
        birthDate: formatDateToBrazilian((profile as any).birthDate),
        sex: (profile as any).sex || "",
        mainObjective: (profile as any).mainObjective || "",
        height: (profile as any).height?.toString() || "",
        currentWeight: (profile as any).currentWeight?.toString() || "",
        targetWeight: (profile as any).targetWeight?.toString() || "",
        activityTypes: types,
        activityFrequencies: normalizedFreqs,
      });
    }
  }, [profile]);

  const handleActivityToggle = (activity: string) => {
    setFormData((prev) => {
      const newTypes = prev.activityTypes.includes(activity)
        ? prev.activityTypes.filter((a) => a !== activity)
        : [...prev.activityTypes, activity];

      // If sedentary is selected, clear other activities
      if (activity === "sedentary" && newTypes.includes("sedentary")) {
        return {
          ...prev,
          activityTypes: ["sedentary"],
          activityFrequencies: {},
        };
      }

      // If other activities are selected, remove sedentary
      if (activity !== "sedentary" && newTypes.includes("sedentary")) {
        return {
          ...prev,
          activityTypes: newTypes.filter((a) => a !== "sedentary"),
        };
      }

      return { ...prev, activityTypes: newTypes };
    });
  };

  const handleActivityFrequencyChange = (activity: string, frequency: number) => {
    setFormData((prev) => ({
      ...prev,
      activityFrequencies: {
        ...prev.activityFrequencies,
        [activity]: frequency,
      },
    }));
  };

  const formatDateToISO = (brazilianDate: string): string => {
    if (!brazilianDate) return "";
    try {
      const [day, month, year] = brazilianDate.split("/");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.birthDate || !formData.sex || !formData.height || !formData.currentWeight) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    try {
      const isoDate = formatDateToISO(formData.birthDate);
      const activityTypeStr = formData.activityTypes.join(",");

      // Update profile with onboarding data
      await updateMutation.mutateAsync({
        fullName: formData.fullName,
        birthDate: isoDate,
        sex: formData.sex as "male" | "female" | "other",
        mainObjective: formData.mainObjective as "lose_fat" | "maintain" | "gain_muscle" | undefined,
        height: parseInt(formData.height),
        currentWeight: parseFloat(formData.currentWeight),
        targetWeight: formData.targetWeight ? parseFloat(formData.targetWeight) : undefined,
        activityType: activityTypeStr,
        activityFrequencies: formData.activityFrequencies,
      });

      // Recalculate nutritional goals based on new data
      await recalcMutation.mutateAsync();

      // Mark onboarding as completed
      await completeOnboardingMutation.mutateAsync();

      toast.success("Perfil completado com sucesso!");
      // Redirect to home
      setTimeout(() => navigate("/"), 1000);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const isStep1Valid = formData.fullName && formData.birthDate && formData.sex;
  const isStep2Valid = formData.height && formData.currentWeight;
  const isStep3Valid = formData.activityTypes.length > 0;
  const isStep4Valid = formData.mainObjective;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <Label htmlFor="fullName" className="text-base font-semibold">
                Nome Completo *
              </Label>
              <Input
                id="fullName"
                placeholder="Seu nome completo"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="birthDate" className="text-base font-semibold">
                Data de Nascimento (DD/MM/YYYY) *
              </Label>
              <Input
                id="birthDate"
                placeholder="01/01/1990"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="sex" className="text-base font-semibold">
                Sexo Biológico *
              </Label>
              <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                <SelectTrigger id="sex" className="mt-2">
                  <SelectValue placeholder="Selecione seu sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <Label htmlFor="height" className="text-base font-semibold">
                Altura (cm) *
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="170"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="currentWeight" className="text-base font-semibold">
                Peso Atual (kg) *
              </Label>
              <Input
                id="currentWeight"
                type="number"
                step="0.1"
                placeholder="70"
                value={formData.currentWeight}
                onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="targetWeight" className="text-base font-semibold">
                Peso Desejado (kg)
              </Label>
              <Input
                id="targetWeight"
                type="number"
                step="0.1"
                placeholder="65"
                value={formData.targetWeight}
                onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                className="mt-2"
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-4 block">Qual é sua atividade física? *</Label>
              <div className="grid grid-cols-2 gap-3">
                {activityTypes.map((activity) => (
                  <button
                    key={activity.value}
                    onClick={() => handleActivityToggle(activity.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.activityTypes.includes(activity.value)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{activity.icon}</div>
                    <div className="text-sm font-medium">{activity.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {formData.activityTypes.length > 0 && !formData.activityTypes.includes("sedentary") && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">Frequência semanal por atividade</Label>
                {formData.activityTypes.map((activity) => (
                  <div key={activity} className="flex items-center gap-4">
                    <Label className="w-24">{activityTypes.find((a) => a.value === activity)?.label}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      value={formData.activityFrequencies[activity] || 3}
                      onChange={(e) => handleActivityFrequencyChange(activity, parseInt(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">dias/semana</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <Label htmlFor="mainObjective" className="text-base font-semibold">
                Qual é seu objetivo principal? *
              </Label>
              <Select value={formData.mainObjective} onValueChange={(value) => setFormData({ ...formData, mainObjective: value })}>
                <SelectTrigger id="mainObjective" className="mt-2">
                  <SelectValue placeholder="Selecione seu objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_fat">Perder Gordura</SelectItem>
                  <SelectItem value="maintain">Manter Peso</SelectItem>
                  <SelectItem value="gain_muscle">Ganhar Músculo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Resumo do seu perfil:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Nome: {formData.fullName}</li>
                      <li>• Altura: {formData.height} cm</li>
                      <li>• Peso: {formData.currentWeight} kg</li>
                      <li>• Atividades: {formData.activityTypes.join(", ")}</li>
                      <li>• Objetivo: {formData.mainObjective}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Completar Perfil</CardTitle>
          <CardDescription>Passo {currentStep} de {totalSteps}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step content */}
          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex-1"
            >
              Voltar
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={() => {
                  if (currentStep === 1 && !isStep1Valid) {
                    toast.error("Por favor, preencha todos os campos");
                    return;
                  }
                  if (currentStep === 2 && !isStep2Valid) {
                    toast.error("Por favor, preencha altura e peso");
                    return;
                  }
                  if (currentStep === 3 && !isStep3Valid) {
                    toast.error("Por favor, selecione uma atividade");
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Próximo
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving || !isStep4Valid}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Concluir
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
