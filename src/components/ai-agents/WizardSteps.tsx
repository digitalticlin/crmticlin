import { CheckCircle2, Circle } from "lucide-react";

interface WizardStepsProps {
  currentStep: number;
  steps: {
    number: number;
    title: string;
    subtitle: string;
  }[];
  onStepClick?: (stepNumber: number) => void;
}

export const WizardSteps = ({ currentStep, steps, onStepClick }: WizardStepsProps) => {
  const handleStepClick = (stepNumber: number) => {
    // Permite navegar para qualquer etapa (para teste/conferência)
    if (onStepClick) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="mb-8 md:mb-10 relative z-20 max-w-2xl mx-auto px-4">
      {/* Barra de Progresso */}
      <div className="relative">
        {/* Linha de fundo */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/20 rounded-full" />

        {/* Linha de progresso */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-ticlin to-green-500 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
          }}
        />

        {/* Steps - Bolinhas Minimalistas */}
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => handleStepClick(step.number)}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-500 cursor-pointer backdrop-blur-xl z-10
                ${currentStep > step.number
                  ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-md hover:scale-110'
                  : currentStep === step.number
                  ? 'bg-gradient-to-br from-ticlin to-orange-500 border-white/50 shadow-lg scale-110'
                  : 'bg-white/20 border-white/40 hover:bg-white/30 hover:scale-105'
                }
              `}
            >
              {currentStep > step.number ? (
                <CheckCircle2 className="h-4 w-4 text-white" />
              ) : (
                <span className={`font-semibold text-xs ${currentStep >= step.number ? 'text-white' : 'text-gray-600'}`}>
                  {step.number}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
