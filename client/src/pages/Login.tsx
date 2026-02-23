import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export function Login() {
  const [, setLocation] = useLocation();
  const { refetch: refetchAuth } = trpc.auth.me.useQuery();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const sendVerificationMutation = trpc.auth.sendVerificationEmail.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await loginMutation.mutateAsync({ email, password });
        // Refetch auth and redirect
        await refetchAuth();
        setLocation("/");
      } else {
        // Validar confirmação de senha
        if (password !== confirmPassword) {
          setError("As senhas não coincidem");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres");
          setIsLoading(false);
          return;
        }
        
        await registerMutation.mutateAsync({ email, password, name });
        // After registration, show verification prompt
        setRegistrationEmail(email);
        setShowVerificationPrompt(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setName("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Um erro ocorreu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setError("");
    setIsLoading(true);
    try {
      await sendVerificationMutation.mutateAsync({ email: registrationEmail });
      setError("");
      setShowVerificationPrompt(false);
      setIsLogin(true);
      setError("Um email de verificação foi enviado. Por favor, verifique seu email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar email de verificação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Entrar" : "Criar Conta"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Digite seu email e senha para entrar"
              : "Crie uma nova conta para começar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium">Nome Completo</label>
                <Input
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm font-medium">Confirmar Senha</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            )}

            {error && (
              <div className={`border rounded p-3 text-sm ${
                showVerificationPrompt
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {error}
              </div>
            )}

            {!showVerificationPrompt && (
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700"
                disabled={isLoading}
              >
                {isLoading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
              </Button>
            )}

            {isLogin && (
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setLocation("/forgot-password")}
                  className="text-teal-600 hover:underline font-medium"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {!showVerificationPrompt && (
              <div className="text-center text-sm">
                {isLogin ? "Não tem uma conta? " : "Já tem uma conta? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-teal-600 hover:underline font-medium"
                >
                  {isLogin ? "Criar conta" : "Entrar"}
                </button>
              </div>
            )}

            {showVerificationPrompt && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm text-slate-600">
                  Um email de verificação foi enviado para <strong>{registrationEmail}</strong>
                </p>
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={handleSendVerification}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Enviando..." : "Reenviar Email de Verificação"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowVerificationPrompt(false);
                      setIsLogin(true);
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Voltar para Login
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
