import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation, Redirect } from "wouter";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Lightbulb, Settings, ArrowLeft } from "lucide-react";

const LOGO_URL = "https://manus-storage-test.oss-cn-beijing.aliyuncs.com/equilibra-ai-logo-new.png";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    return <Redirect to="/" />;
  }

  // Check if onboarding is completed
  if (!loading && user && !(user as any).onboardingCompleted) {
    return <Redirect to="/onboarding" />;
  }

  const tabs = [
    { id: "progress", label: "Progresso", icon: TrendingUp, path: "/profile/progress" },
    { id: "data", label: "Dados", icon: Calendar, path: "/profile/data" },
    { id: "recommendations", label: "Recomendações", icon: Lightbulb, path: "/profile/recommendations" },
    { id: "settings", label: "Configurações", icon: Settings, path: "/profile/settings" },
  ];

  const currentTab = tabs.find(t => location.startsWith(t.path))?.id || "progress";

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Back to Home + Logo */}
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-emerald-600">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              </Link>
              <Link href="/">
                <motion.div 
                  className="flex items-center gap-2 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <img src={LOGO_URL} alt="Equilibra AI" className="h-8 w-auto" />
                  <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hidden sm:block">
                    Equilibra AI
                  </span>
                </motion.div>
              </Link>
            </div>

            {/* User Info + Logout */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.name || user?.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Title */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-emerald-100 mt-1">Acompanhe seu progresso e gerencie suas configurações</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <Tabs value={currentTab} className="w-full">
            <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-0">
              {tabs.map((tab) => (
                <Link key={tab.id} href={tab.path}>
                  <TabsTrigger
                    value={tab.id}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-none border-b-2 transition-all
                      data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600
                      data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500
                      hover:text-emerald-600 hover:bg-emerald-50/50
                    `}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 Equilibra AI. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
