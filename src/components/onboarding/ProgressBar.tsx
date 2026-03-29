interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="relative">
      <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-[#FFC62C] to-[#FF9500] transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-[#6a6e76]">
        <span>Schritt {currentStep} von {totalSteps}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}
