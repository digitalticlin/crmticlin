
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Moon, Shield, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Personalize a aparência da sua interface Ticlin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tema</h3>
          <div className="grid grid-cols-3 gap-4">
            <div 
              className={`flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 ${theme === "light" ? "border-ticlin" : "border-transparent"}`}
              onClick={() => setTheme("light")}
            >
              <div className="h-20 w-full rounded-lg bg-white flex flex-col items-end p-2">
                <div className="w-6 h-6 rounded-full bg-black/10"></div>
                <div className="flex-grow"></div>
                <div className="w-full h-2 rounded-full bg-black/10"></div>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <span>Claro</span>
              </div>
            </div>
            
            <div 
              className={`flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 ${theme === "dark" ? "border-ticlin" : "border-transparent"}`}
              onClick={() => setTheme("dark")}
            >
              <div className="h-20 w-full rounded-lg bg-gray-800 flex flex-col items-end p-2">
                <div className="w-6 h-6 rounded-full bg-white/10"></div>
                <div className="flex-grow"></div>
                <div className="w-full h-2 rounded-full bg-white/10"></div>
              </div>
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span>Escuro</span>
              </div>
            </div>
            
            <div 
              className={`flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 ${theme === "system" ? "border-ticlin" : "border-transparent"}`}
              onClick={() => setTheme("system")}
            >
              <div className="h-20 w-full rounded-lg bg-gradient-to-r from-white to-gray-800 flex flex-col items-end p-2">
                <div className="w-6 h-6 rounded-full bg-black/10"></div>
                <div className="flex-grow"></div>
                <div className="w-full h-2 rounded-full bg-black/10"></div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Sistema</span>
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Outras Configurações</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Animações</Label>
              <p className="text-sm text-muted-foreground">
                Ativar ou desativar animações da interface
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Efeitos Glassmorphism</Label>
              <p className="text-sm text-muted-foreground">
                Ativar ou desativar efeitos de transparência
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Restaurar Padrão</Button>
          <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
            Salvar Preferências
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
