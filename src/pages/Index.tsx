
import LoginForm from "@/components/auth/LoginForm";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-ticlin-300 via-ticlin-400 to-ticlin-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-ticlin-light/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] opacity-30"></div>
      </div>
      
      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <LoginForm />
        
        <p className="text-center text-xs text-white/70 mt-8 font-medium">
          Ticlin CRM &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default Index;
