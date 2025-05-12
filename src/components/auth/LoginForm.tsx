
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export default function LoginForm() {
  const [formType, setFormType] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock authentication for demo purposes
    setTimeout(() => {
      setIsLoading(false);
      
      if (formType === "login") {
        // In a real app, you'd validate credentials with a backend
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else if (formType === "register") {
        toast.success("Cadastro realizado! Verifique seu e-mail.");
        setFormType("login");
      } else if (formType === "forgot") {
        toast.success("Instruções de recuperação enviadas para seu e-mail.");
        setFormType("login");
      }
    }, 1000);
  };
  
  const renderForm = () => {
    switch (formType) {
      case "login":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  placeholder="seu@email.com"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/40 dark:bg-black/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/40 dark:bg-black/20 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Button 
              className="w-full bg-ticlin hover:bg-ticlin-dark text-black font-medium mt-6" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => setFormType("register")}
                  className="text-ticlin hover:underline font-medium"
                >
                  Cadastrar
                </button>
              </p>
              <p className="text-sm">
                <button
                  type="button"
                  onClick={() => setFormType("forgot")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Esqueceu sua senha?
                </button>
              </p>
            </div>
          </>
        );
      
      case "register":
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  placeholder="seu@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/40 dark:bg-black/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/40 dark:bg-black/20 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Button 
              className="w-full bg-ticlin hover:bg-ticlin-dark text-black font-medium mt-6" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={() => setFormType("login")}
                className="text-ticlin hover:underline font-medium"
              >
                Entrar
              </button>
            </p>
          </>
        );
      
      case "forgot":
        return (
          <>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                Digite seu e-mail e enviaremos instruções para redefinir sua senha.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  placeholder="seu@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/40 dark:bg-black/20"
                />
              </div>
            </div>
            <Button 
              className="w-full bg-ticlin hover:bg-ticlin-dark text-black font-medium mt-6" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Enviar instruções"}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => setFormType("login")}
                className="text-ticlin hover:underline font-medium"
              >
                Voltar ao login
              </button>
            </p>
          </>
        );
    }
  };
  
  return (
    <Card className="w-full max-w-md glass animate-scale-in">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <img 
            src="/lovable-uploads/ae7ddc52-d3ed-478f-af96-603a69278f3b.png" 
            alt="Ticlin Logo" 
            className="h-12 mb-2" 
          />
          <h1 className="text-2xl font-bold">
            {formType === "login" && "Bem-vindo ao Ticlin"}
            {formType === "register" && "Crie sua conta"}
            {formType === "forgot" && "Recuperar senha"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formType === "login" && "Entre com sua conta para continuar"}
            {formType === "register" && "Preencha os dados para criar sua conta"}
            {formType === "forgot" && "Receba instruções para redefinir sua senha"}
          </p>
        </div>
        
        {renderForm()}
      </form>
    </Card>
  );
}
