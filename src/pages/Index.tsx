
import LoginForm from "@/components/auth/LoginForm";

const Index = () => {
  console.log('[Index] Componente renderizado');
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-ticlin/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-ticlin/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <LoginForm />
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default Index;
