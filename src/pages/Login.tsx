
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { BackgroundGradient } from "@/components/ui/BackgroundGradient";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <BackgroundGradient className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200">
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <img
              src="/lovable-uploads/68c955d6-5aab-40d3-9018-c372a8f3faf6.png"
              alt="Ticlin CRM"
              className="h-14 transition-transform duration-300 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ticlin-400 to-ticlin-600 opacity-10 rounded-lg blur-lg"></div>
          </div>
        </div>
        
        <div className="w-full rounded-3xl bg-white/30 backdrop-blur-lg border border-white/20 shadow-2xl p-8 space-y-8 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:bg-white/35">
          <div className="space-y-2 text-center animate-scale-in">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-gray-700 font-medium">
              Acesse sua conta para continuar
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-800">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 rounded-full bg-white/50 backdrop-blur-sm border-white/30 text-gray-900 placeholder:text-gray-600 focus:bg-white/60 focus:border-ticlin-400 transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-800">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 rounded-full bg-white/50 backdrop-blur-sm border-white/30 text-gray-900 placeholder:text-gray-600 focus:bg-white/60 focus:border-ticlin-400 transition-all duration-300 pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-600" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 rounded-full bg-gradient-to-r from-ticlin-500 to-ticlin-600 hover:from-ticlin-600 hover:to-ticlin-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
          
          <div className="text-center space-y-4 animate-fade-in-delayed">
            <Link
              to="/forgot-password"
              className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
            >
              Esqueceu sua senha?
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/30 px-4 text-gray-600 font-medium backdrop-blur-sm rounded-full">
                  Ou
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 font-medium">
              Não tem uma conta?{" "}
              <Link
                to="/register"
                className="text-ticlin-600 hover:text-ticlin-700 font-semibold transition-colors duration-200"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-700 mt-8 font-medium">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </BackgroundGradient>
  );
}
