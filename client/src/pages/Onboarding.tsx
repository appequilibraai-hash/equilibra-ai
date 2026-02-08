import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Redirect } from "wouter";
import { 
  User, 
  Calendar, 
  Ruler, 
  Scale, 
  Target, 
  Dumbbell,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check
} from "lucide-react";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/ZMDCqRyCaIYlOHQd.png";

const activityTypes = [
  { value: "sedentary", label: "Sedentário", icon: "🛋️", description: "Pouca ou nenhuma atividade" },
  { value: "football", label: "Futebol", icon: "⚽", description: "Jogos regulares de futebol" },
  { value: "gym", label: "Academia", icon: "🏋️", description: "Musculação e treinos" },
  { value: "basketball", label: "Basquete", icon: "🏀", description: "Jogos de basquete" },
  { value: "dance", label: "Dança", icon: "💃", description: "Aulas de dança" },
  { value: "running", label: "Corrida", icon: "🏃", description: "Corrida regular" },
  { value: "swimming", label: "Natação", icon: "🏊", description: "Natação regular" },
  { value: "cycling", label: "Ciclismo", icon: "🚴", description: "Ciclismo regular" },
  { value: "other", label: "Outro", icon: "🎯", description: "Outra atividade física" },
];

export default function Onboarding() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    sex: "" as "male" | "female" | "other" | "",
    birthDate: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
    activityType: "" as string,
  });

  const completeMutation = trpc.onboarding.complete.useMutation();

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Redirect if already completed onboarding
  if (!loading && user && (user as any).onboardingCompleted) {
    return <Redirect to="/profile" />;
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.username.length >= 3;
      case 2:
        return formData.sex !== "" && formData.birthDate !== "";
      case 3:
        return formData.height !== "" && formData.currentWeight !== "" && formData.targetWeight !== "";
      case 4:
        return formData.activityType !== "";
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      await completeMutation.mutateAsync({
        username: formData.username,
        sex: formData.sex as "male" | "female" | "other",
        birthDate: formData.birthDate,
        height: Number(formData.height),
        currentWeight: Number(formData.currentWeight),
        targetWeight: Number(formData.targetWeight),
        activityType: formData.activityType as any,
      });
      toast.success("Perfil configurado com sucesso!");
      setLocation("/profile");
    } catch (error) {
      toast.error("Erro ao salvar perfil. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="Equilibra AI" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Configure seu Perfil</h1>
          <p className="text-gray-600 mt-2">
            Precisamos de algumas informações para personalizar suas metas nutricionais
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  s < step
                    ? "bg-emerald-500 text-white"
                    : s === step
                    ? "bg-emerald-500 text-white ring-4 ring-emerald-200"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s < step ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 rounded ${
                    s < step ? "bg-emerald-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <Card className="shadow-xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Username */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-emerald-500" />
                    Como podemos te chamar?
                  </CardTitle>
                  <CardDescription>
                    Escolha um nome de usuário único
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="username">Nome de Usuário</Label>
                    <Input
                      id="username"
                      placeholder="ex: joao_fitness"
                      value={formData.username}
                      onChange={(e) => updateField("username", e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">Mínimo de 3 caracteres</p>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {/* Step 2: Personal Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Usamos esses dados para calcular suas necessidades calóricas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Sexo</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {[
                        { value: "male", label: "Masculino", icon: "👨" },
                        { value: "female", label: "Feminino", icon: "👩" },
                        { value: "other", label: "Outro", icon: "🧑" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField("sex", option.value)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.sex === option.value
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-emerald-300"
                          }`}
                        >
                          <span className="text-2xl block mb-1">{option.icon}</span>
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateField("birthDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </motion.div>
            )}

            {/* Step 3: Body Metrics */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-emerald-500" />
                    Medidas Corporais
                  </CardTitle>
                  <CardDescription>
                    Essas informações ajudam a calcular suas metas de macros
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="height">Altura (cm)</Label>
                    <div className="relative mt-1">
                      <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="height"
                        type="number"
                        placeholder="175"
                        value={formData.height}
                        onChange={(e) => updateField("height", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
                      <div className="relative mt-1">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="currentWeight"
                          type="number"
                          step="0.1"
                          placeholder="70"
                          value={formData.currentWeight}
                          onChange={(e) => updateField("currentWeight", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="targetWeight">Peso Desejado (kg)</Label>
                      <div className="relative mt-1">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="targetWeight"
                          type="number"
                          step="0.1"
                          placeholder="65"
                          value={formData.targetWeight}
                          onChange={(e) => updateField("targetWeight", e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}

            {/* Step 4: Activity Type */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-emerald-500" />
                    Atividade Física
                  </CardTitle>
                  <CardDescription>
                    Qual é sua principal atividade física?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {activityTypes.map((activity) => (
                      <button
                        key={activity.value}
                        type="button"
                        onClick={() => updateField("activityType", activity.value)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          formData.activityType === activity.value
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <span className="text-3xl block mb-2">{activity.icon}</span>
                        <span className="text-sm font-medium block">{activity.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="p-6 pt-0 flex justify-between">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || completeMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Concluir
                    <Check className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
