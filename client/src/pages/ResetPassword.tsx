import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenEmail, setTokenEmail] = useState("");

  const validateToken = trpc.auth.validateResetToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const resetPasswordMutation = trpc.auth.resetPasswordWithToken.useMutation();

  useEffect(() => {
    if (validateToken.data) {
      setTokenValid(validateToken.data.valid);
      if (validateToken.data.email) {
        setTokenEmail(validateToken.data.email);
      }
    }
  }, [validateToken.data]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-8">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Link Inválido</h2>
            <p className="text-gray-600 text-center mb-6">
              O link de recuperação está faltando. Por favor, solicite um novo link.
            </p>
            <Button
              onClick={() => setLocation("/forgot-password")}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              Solicitar Novo Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (validateToken.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-8">
            <div className="flex justify-center mb-4">
              <div className="animate-spin">
                <Lock className="w-8 h-8 text-teal-600" />
              </div>
            </div>
            <p className="text-center text-gray-600">Validando link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-8">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Link Expirado</h2>
            <p className="text-gray-600 text-center mb-6">
              O link de recuperação expirou. Por favor, solicite um novo link.
            </p>
            <Button
              onClick={() => setLocation("/forgot-password")}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              Solicitar Novo Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPasswordMutation.mutateAsync({
        token: token || "",
        newPassword: password,
      });

      if (result.success) {
        setIsSuccess(true);
        toast.success("Senha redefinida com sucesso!");
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      } else {
        toast.error("Erro ao redefinir senha");
      }
    } catch (error) {
      toast.error("Erro ao redefinir senha");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header com botão voltar */}
        <div className="mb-8">
          <button
            onClick={() => setLocation("/login")}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Voltar para Login</span>
          </button>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-teal-100 p-3 rounded-full">
                <Lock className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Redefinir Senha</CardTitle>
            <CardDescription className="text-center">
              {isSuccess
                ? "Sua senha foi redefinida com sucesso!"
                : `Crie uma nova senha para ${tokenEmail}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Nova Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmar Senha
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-gray-200"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    💡 Use uma senha forte com pelo menos 6 caracteres.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <p className="text-gray-700">
                  Sua senha foi redefinida com sucesso! Você será redirecionado para o login em breve.
                </p>
                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Ir para Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
