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
    <div className="mb-6 md:mb-8 relative z-20">
      <div className="flex items-center justify-center overflow-x-auto pb-2 md:pb-0 px-4 md:px-0">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-shrink-0">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleStepClick(step.number)}
                className={`
                  relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full border-2 transition-all duration-300 cursor-pointer
                  ${currentStep > step.number
                    ? 'bg-green-500 border-green-500 hover:scale-110 hover:shadow-xl'
                    : currentStep === step.number
                    ? 'bg-ticlin border-ticlin shadow-xl md:scale-110 scale-105'
                    : 'bg-white/60 border-gray-300 hover:bg-white/80 hover:scale-105'
                  }
                  ${step.number !== currentStep ? 'hover:bg-green-600' : ''}
                `}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
                ) : currentStep === step.number ? (
                  <span className="text-white font-bold text-sm md:text-base">{step.number}</span>
                ) : (
                  <span className="text-gray-600 font-bold text-sm md:text-base">{step.number}</span>
                )}
              </button>

              {/* Step Title */}
              <div className="mt-2 md:mt-3 text-center max-w-[80px] md:max-w-[120px]">
                <p
                  className={`
                    text-xs md:text-sm font-semibold transition-colors
                    ${currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'}
                  `}
                >
                  {step.title}
                </p>
                {step.subtitle && (
                  <p
                    className={`
                      text-xs transition-colors hidden md:block
                      ${currentStep >= step.number ? 'text-gray-600' : 'text-gray-400'}
                    `}
                  >
                    {step.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  h-0.5 w-12 md:w-16 mx-1 md:mx-2 mb-12 md:mb-14 transition-all duration-300
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
