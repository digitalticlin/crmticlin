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
    <div className="mb-8 relative z-20">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleStepClick(step.number)}
                className={`
                  relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer
                  ${currentStep > step.number
                    ? 'bg-green-500 border-green-500 hover:scale-110 hover:shadow-xl'
                    : currentStep === step.number
                    ? 'bg-ticlin border-ticlin shadow-xl scale-110'
                    : 'bg-white/60 border-gray-300 hover:bg-white/80 hover:scale-105'
                  }
                  ${step.number !== currentStep ? 'hover:bg-green-600' : ''}
                `}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : currentStep === step.number ? (
                  <span className="text-white font-bold text-base">{step.number}</span>
                ) : (
                  <span className="text-gray-600 font-bold text-base">{step.number}</span>
                )}
              </button>

              {/* Step Title */}
              <div className="mt-3 text-center max-w-[120px]">
                <p
                  className={`
                    text-sm font-semibold transition-colors
                    ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'}
                  `}
                >
                  {step.title}
                </p>
                <p
                  className={`
                    text-xs transition-colors
                    ${currentStep >= step.number ? 'text-gray-600' : 'text-gray-400'}
                  `}
                >
                  {step.subtitle}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  h-0.5 w-16 mx-2 mb-14 transition-all duration-300
                  ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
