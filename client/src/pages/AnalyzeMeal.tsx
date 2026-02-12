import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, Sparkles, Save, ChefHat, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

const HERO_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/lfdGXyjcUQOKGWLA.png";

interface AnalysisResult {
  imageUrl: string;
  analysis_chain_of_thought?: string;
  scale_reference_used?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  detectedFoods: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
    estimated_volume_cm3?: number;
    density_factor?: number;
    visual_description?: string;
  }>;
  detectedSauces: string[];
  detectedIngredients: string[];
  micronutrients: Array<{
    name: string;
    amount: number;
    unit: string;
    percentDailyValue?: number;
  }>;
  analysisNotes: string;
  user_feedback_hint?: string;
}

export default function AnalyzeMeal() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.meals.analyzeOnly.useMutation();
  const saveMutation = trpc.meals.save.useMutation();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeMutation.mutateAsync({
        imageBase64: selectedImage,
      });
      setAnalysisResult(result as AnalysisResult);
      toast.success("Análise concluída com sucesso!");
    } catch (error) {
      toast.error("Erro ao analisar a imagem. Tente novamente.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = getLoginUrl();
      return;
    }

    if (!analysisResult) return;

    try {
      await saveMutation.mutateAsync({
        imageUrl: analysisResult.imageUrl,
        mealType,
        totalCalories: analysisResult.totalCalories,
        totalProtein: analysisResult.totalProtein,
        totalCarbs: analysisResult.totalCarbs,
        totalFat: analysisResult.totalFat,
        totalFiber: analysisResult.totalFiber,
        totalSugar: analysisResult.totalSugar,
        totalSodium: analysisResult.totalSodium,
        detectedFoods: analysisResult.detectedFoods,
        detectedSauces: analysisResult.detectedSauces,
        detectedIngredients: analysisResult.detectedIngredients,
        micronutrients: analysisResult.micronutrients,
        analysisNotes: analysisResult.analysisNotes,
      });
      toast.success("Refeição salva no seu diário!");
      setLocation("/profile/data");
    } catch (error) {
      toast.error("Erro ao salvar. Faça login para continuar.");
    }
  };

  const handleSuggestNextMeal = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLocation("/profile/recommendations");
  };

  const clearImage = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left: Text + Upload */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Analise sua refeição{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  com IA
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Tire uma foto ou faça upload da sua refeição e descubra instantaneamente 
                as calorias, macros e micronutrientes. Simples, rápido e preciso.
              </p>

              {/* Upload Area */}
              <div className="space-y-4">
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!selectedImage ? (
                  <div className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.div whileHover={{ scale: 1.02 }} className="inline-block">
                          <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 rounded-2xl flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            Adicionar Refeicao
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-56">
                        <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
                          <Camera className="h-4 w-4 mr-2" />
                          <span>Tirar Foto</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          <span>Carregar da Galeria</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Refeição selecionada"
                      className="w-full h-64 object-cover rounded-2xl"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {selectedImage && !analysisResult && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 text-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Analisar Refeição
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Right: Illustration or Result */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:block"
            >
              {!analysisResult ? (
                <img
                  src={HERO_IMAGE}
                  alt="Análise de refeição"
                  className="w-full max-w-md mx-auto"
                />
              ) : null}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Analysis Result */}
      <AnimatePresence>
        {analysisResult && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-8 bg-white"
          >
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-emerald-500" />
                Resultado da Análise
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Main Macros */}
                <Card className="md:col-span-2">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-orange-50 rounded-xl">
                        <p className="text-3xl font-bold text-orange-600">{analysisResult.totalCalories}</p>
                        <p className="text-sm text-gray-600">Calorias</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-xl">
                        <p className="text-3xl font-bold text-red-600">{analysisResult.totalProtein}g</p>
                        <p className="text-sm text-gray-600">Proteína</p>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-xl">
                        <p className="text-3xl font-bold text-amber-600">{analysisResult.totalCarbs}g</p>
                        <p className="text-sm text-gray-600">Carboidratos</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-xl">
                        <p className="text-3xl font-bold text-yellow-600">{analysisResult.totalFat}g</p>
                        <p className="text-sm text-gray-600">Gordura</p>
                      </div>
                    </div>

                    {/* Scale Reference */}
                    {analysisResult.scale_reference_used && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-xl flex items-center gap-2">
                        <span className="text-blue-600 text-sm font-medium">Referência de escala:</span>
                        <span className="text-blue-800 text-sm">{analysisResult.scale_reference_used}</span>
                      </div>
                    )}

                    {/* Detected Foods */}
                    <h3 className="font-semibold text-gray-800 mb-3">Alimentos Detectados</h3>
                    <div className="space-y-3 mb-6">
                      {analysisResult.detectedFoods.map((food, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium text-gray-800">{food.name}</span>
                              <span className="text-gray-500 text-sm ml-2">({food.quantity})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-600 font-semibold">{food.calories} kcal</span>
                              {food.confidence !== undefined && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${food.confidence >= 80 ? 'bg-green-100 text-green-700' : food.confidence >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                  {food.confidence}%
                                </span>
                              )}
                            </div>
                          </div>
                          {food.visual_description && (
                            <p className="text-xs text-gray-500 italic mb-2">{food.visual_description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                            <span>P: {food.protein}g</span>
                            <span>C: {food.carbs}g</span>
                            <span>G: {food.fat}g</span>
                            {food.estimated_volume_cm3 !== undefined && (
                              <span className="text-blue-600">Vol: {food.estimated_volume_cm3}cm³</span>
                            )}
                            {food.density_factor !== undefined && (
                              <span className="text-purple-600">Dens: {food.density_factor}g/cm³</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sauces & Ingredients */}
                    {analysisResult.detectedSauces.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Molhos</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.detectedSauces.map((sauce, i) => (
                            <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                              {sauce}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Analysis Notes */}
                    {analysisResult.analysisNotes && (
                      <div className="p-4 bg-emerald-50 rounded-xl mb-3">
                        <h4 className="text-sm font-semibold text-emerald-700 mb-1">Análise Detalhada</h4>
                        <p className="text-sm text-emerald-800">{analysisResult.analysisNotes}</p>
                      </div>
                    )}

                    {/* User Feedback Hint */}
                    {analysisResult.user_feedback_hint && (
                      <div className="p-4 bg-amber-50 rounded-xl">
                        <h4 className="text-sm font-semibold text-amber-700 mb-1">💡 Dica para Melhorar</h4>
                        <p className="text-sm text-amber-800">{analysisResult.user_feedback_hint}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-gray-800 mb-4">O que deseja fazer?</h3>
                    
                    {/* Meal Type Selector */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Tipo de refeição:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "breakfast", label: "☕ Café" },
                          { value: "lunch", label: "🍽️ Almoço" },
                          { value: "dinner", label: "🌙 Jantar" },
                          { value: "snack", label: "🍎 Lanche" },
                        ].map((type) => (
                          <Button
                            key={type.value}
                            variant={mealType === type.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMealType(type.value as any)}
                            className={mealType === type.value ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                          >
                            {type.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveMeal}
                      disabled={saveMutation.isPending}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Guardar no Diário
                    </Button>

                    <Button
                      onClick={handleSuggestNextMeal}
                      variant="outline"
                      className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <ChefHat className="h-4 w-4 mr-2" />
                      Sugerir Próximo Prato
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-xs text-gray-500 text-center">
                        Faça login para salvar refeições e receber recomendações personalizadas
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Features Section (when no analysis) */}
      {!analysisResult && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
              Como funciona
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Camera,
                  title: "1. Tire uma foto",
                  description: "Fotografe sua refeição ou faça upload de uma imagem da galeria",
                },
                {
                  icon: Sparkles,
                  title: "2. IA analisa",
                  description: "Nossa IA identifica alimentos, molhos e calcula os nutrientes",
                },
                {
                  icon: Save,
                  title: "3. Salve e acompanhe",
                  description: "Guarde no seu diário e receba sugestões personalizadas",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
