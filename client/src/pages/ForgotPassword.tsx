import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Mail, ArrowLeft } from "lucide-react";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [, setLocation] = useLocation();

  const requestReset = trpc.auth.requestPasswordReset.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Por favor, insira seu email");
      return;
    }

    setIsLoading(true);
    try {
      await requestReset.mutateAsync({ email });
      setIsSubmitted(true);
      toast.success("Email de recuperação enviado!");
    } catch (error) {
      toast.error("Erro ao enviar email de recuperação");
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
                <Mail className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Esqueci Minha Senha</CardTitle>
            <CardDescription className="text-center">
              {isSubmitted
                ? "Verifique seu email para as instruções de recuperação"
                : "Insira seu email para receber um link de recuperação de senha"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="border-gray-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Você receberá um email com instruções para redefinir sua senha em poucos minutos.
                </p>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <p className="text-sm text-gray-700 mb-2">
                    Enviamos um link de recuperação para:
                  </p>
                  <p className="font-medium text-gray-900">{email}</p>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ Verifique sua caixa de entrada</p>
                  <p>✓ Procure por um email de "Equilibra AI"</p>
                  <p>✓ Clique no link para redefinir sua senha</p>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    💡 O link expira em 1 hora. Se não receber o email, verifique sua pasta de spam.
                  </p>
                </div>

                <Button
                  onClick={() => setLocation("/login")}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Voltar para Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Lembrou sua senha?{" "}
          <button
            onClick={() => setLocation("/login")}
            className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
}
