
import LoginForm from "@/components/auth/LoginForm";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <h1 className="text-4xl font-bold text-ticlin">ticlin</h1>
        </div>
        
        <LoginForm />
        
        <p className="text-center text-xs text-gray-500 mt-6">
          Ticlin CRM © {new Date().getFullYear()} - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default Index;
