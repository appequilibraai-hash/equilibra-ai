import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X, Loader2, Check, AlertCircle, Sparkles, Zap, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
};

const mealTypeIcons: Record<MealType, string> = {
  breakfast: "☕",
  lunch: "🍽️",
  dinner: "🌙",
  snack: "🍎",
};

const FEATURE_CAMERA = "https://private-us-east-1.manuscdn.com/sessionFile/zzBJEAWa6t4bzzUkBdknzk/sandbox/kw1I1FeG3weE1NSxH7ImVi_1770344056442_na1fn_ZmVhdHVyZS1jYW1lcmE.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvenpCSkVBV2E2dDRienpVa0Jka256ay9zYW5kYm94L2t3MUkxRmVHM3dlRTFOU3hIN0ltVmlfMTc3MDM0NDA1NjQ0Ml9uYTFmbl9abVZoZEhWeVpTMWpZVzFsY21FLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Q5JpLpT1AZoJIzXZuUUjvmj5-7F8M8il~ntcuKLpJLIEY5sDWap849cNO7PprR2yTZlp-sHnUkMe3sEzASDoaco-nt7fjs9IcwbSwnQKvoB6WlFsNpcY6vdtB4IVuQRHrW1WMacDwEYeD~BihZpHn9SBymSOWS0v87r3fOFtE0FLbKGRxW591HunfpHjItkKlYd8xORZjig5w~3mCNZ~5bmG2G6w1ejmtWYl1upIHzzG0h6vWL8mwOp4ymbNCTXIMmPxiBgmHvOAWAIHLidkRNMXCKKD8dDaVv4d7tKKOUMxyfKL4nhbYGz3iyJ60GrKxP4KS1qicndG7nd9Jxd6yg__";

export default function Analyze() {
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [isCapturing, setIsCapturing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const analyzeMutation = trpc.meals.analyze.useMutation({
    onSuccess: (data) => {
      toast.success("Refeição analisada com sucesso!");
      setLocation(`/meal/${data?.id}`);
    },
    onError: (error) => {
      toast.error("Erro ao analisar refeição: " + error.message);
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
    } catch (error) {
      toast.error("Não foi possível acessar a câmera");
      console.error(error);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setImagePreview(dataUrl);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!imagePreview) {
      toast.error("Por favor, selecione ou tire uma foto primeiro");
      return;
    }
    analyzeMutation.mutate({
      imageBase64: imagePreview,
      mealType,
    });
  }, [imagePreview, mealType, analyzeMutation]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
          <Sparkles className="h-4 w-4" />
          Análise por IA
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Nova Refeição
        </h1>
        <p className="text-gray-500 mt-2">
          Tire uma foto ou faça upload da sua refeição para análise nutricional completa
        </p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Image Preview or Camera */}
            <div
              className={`relative aspect-[4/3] rounded-2xl overflow-hidden transition-all ${
                dragActive 
                  ? "border-4 border-emerald-500 bg-emerald-50" 
                  : "border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <AnimatePresence mode="wait">
                {isCapturing ? (
                  <motion.div
                    key="camera"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-8 border-2 border-white/50 rounded-2xl" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/70 rounded-full" />
                    </div>
                  </motion.div>
                ) : imagePreview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full h-full relative"
                  >
                    <img
                      src={imagePreview}
                      alt="Preview da refeição"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-3 right-3 rounded-full shadow-lg"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium text-gray-700">Imagem pronta</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center"
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <img 
                        src={FEATURE_CAMERA} 
                        alt="Câmera" 
                        className="w-32 h-32 object-contain opacity-80"
                      />
                    </motion.div>
                    <div>
                      <p className="font-semibold text-gray-700">Arraste uma imagem aqui</p>
                      <p className="text-sm text-gray-400 mt-1">
                        ou use os botões abaixo para tirar uma foto
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isCapturing ? (
                <>
                  <Button 
                    onClick={capturePhoto} 
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                    size="lg"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Capturar
                  </Button>
                  <Button variant="outline" onClick={stopCamera} className="flex-1" size="lg">
                    <X className="h-5 w-5 mr-2" />
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    onClick={startCamera} 
                    className="flex-1 border-2 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                    size="lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Tirar Foto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                    size="lg"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Upload
                  </Button>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Meal Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">
                Tipo de Refeição
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(mealTypeLabels) as [MealType, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setMealType(value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      mealType === value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 hover:border-gray-200 text-gray-600"
                    }`}
                  >
                    <span className="text-2xl">{mealTypeIcons[value]}</span>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!imagePreview || analyzeMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none"
              size="lg"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analisando com IA...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Analisar Refeição
                </>
              )}
            </Button>

            {/* Loading State */}
            <AnimatePresence>
              {analyzeMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-800">Analisando sua refeição...</p>
                    <p className="text-sm text-emerald-600">
                      A IA está identificando os alimentos e calculando os nutrientes
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { icon: "📸", text: "Boa iluminação" },
          { icon: "🎯", text: "Foto de cima" },
          { icon: "✨", text: "Mostre tudo" },
        ].map((tip, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <span className="text-2xl">{tip.icon}</span>
            <span className="text-xs font-medium text-gray-600 text-center">{tip.text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
