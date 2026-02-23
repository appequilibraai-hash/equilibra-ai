import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token de verificação não encontrado na URL");
      return;
    }

    // Verify email
    const verify = async () => {
      try {
        await verifyMutation.mutateAsync({ token });
        setStatus("success");
        setMessage("Email verificado com sucesso!");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation("/login");
        }, 3000);
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Erro ao verificar email. O token pode ter expirado.");
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Verificar Email</CardTitle>
          <CardDescription>
            Estamos verificando seu endereço de email
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-600">Verificando email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-semibold text-green-700">{message}</p>
                <p className="text-sm text-slate-600">
                  Você será redirecionado para a página de login em alguns segundos...
                </p>
              </div>
              <Button
                onClick={() => setLocation("/login")}
                className="w-full mt-4"
              >
                Ir para Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Se o token expirou, você pode solicitar um novo email de verificação:
                </p>
                <Button
                  onClick={() => setLocation("/register")}
                  variant="outline"
                  className="w-full"
                >
                  Voltar para Registro
                </Button>
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full"
                >
                  Ir para Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
