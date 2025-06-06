
interface QRCodeProgressProps {
  currentAttempt: number;
  maxAttempts: number;
}

export const QRCodeProgress = ({ currentAttempt, maxAttempts }: QRCodeProgressProps) => {
  const progressPercentage = maxAttempts > 0 ? Math.min((currentAttempt / maxAttempts) * 100, 100) : 0;

  return (
    <div className="text-center">
      <p className="text-sm text-blue-700 mb-3">
        Tentativa {currentAttempt} de {maxAttempts}
      </p>
      
      {/* Progress bar */}
      <div className="w-48 bg-blue-200 rounded-full h-2 mb-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <p className="text-xs text-blue-600">
        Estimativa: {Math.max(0, (maxAttempts - currentAttempt) * 2)}s restantes
      </p>
    </div>
  );
};
