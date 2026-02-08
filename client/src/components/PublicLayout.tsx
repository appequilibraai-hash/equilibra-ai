import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/ZMDCqRyCaIYlOHQd.png";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <motion.div 
                className="flex items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img src={LOGO_URL} alt="Equilibra AI" className="h-10 w-auto" />
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Equilibra AI
                </span>
              </motion.div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <Link href="/about">
                <span className={`text-sm font-medium transition-colors hover:text-emerald-600 cursor-pointer ${
                  location === "/about" ? "text-emerald-600" : "text-gray-600"
                }`}>
                  Sobre
                </span>
              </Link>
              
              <Link href="/">
                <span className={`text-sm font-medium transition-colors hover:text-emerald-600 cursor-pointer ${
                  location === "/" || location === "/analyze" ? "text-emerald-600" : "text-gray-600"
                }`}>
                  Analisar Refeição
                </span>
              </Link>

              {/* Login/Profile Button */}
              {loading ? (
                <div className="w-20 h-9 bg-gray-200 animate-pulse rounded-lg" />
              ) : isAuthenticated ? (
                <Link href="/profile">
                  <Button 
                    variant="default" 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  >
                    Meu Perfil
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button 
                    variant="default" 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  >
                    Login
                  </Button>
                </a>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content with top padding for fixed header */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Equilibra AI" className="h-8 w-auto" />
              <span className="text-lg font-semibold">Equilibra AI</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2026 Equilibra AI. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
