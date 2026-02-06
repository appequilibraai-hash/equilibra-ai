import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
};

export default function Analyze() {
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [isCapturing, setIsCapturing] = useState(false);
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
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Refeição</h1>
        <p className="text-muted-foreground mt-1">
          Tire uma foto ou faça upload da sua refeição para análise nutricional
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Foto da Refeição</CardTitle>
          <CardDescription>
            A IA irá analisar os alimentos e calcular as informações nutricionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Preview or Camera */}
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border">
            {isCapturing ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Preview da refeição"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Nenhuma imagem selecionada</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use os botões abaixo para tirar uma foto ou fazer upload
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isCapturing ? (
              <>
                <Button onClick={capturePhoto} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Capturar
                </Button>
                <Button variant="outline" onClick={stopCamera} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={startCamera} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Tirar Foto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Tipo de Refeição
            </label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(mealTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!imagePreview || analyzeMutation.isPending}
            className="w-full"
            size="lg"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Analisar Refeição
              </>
            )}
          </Button>

          {analyzeMutation.isPending && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
              <AlertCircle className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                A análise pode levar alguns segundos. A IA está identificando os alimentos e calculando os nutrientes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
