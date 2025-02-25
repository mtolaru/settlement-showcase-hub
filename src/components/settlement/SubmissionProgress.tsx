
interface SubmissionProgressProps {
  currentStep: number;
}

export const SubmissionProgress = ({ currentStep }: SubmissionProgressProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex items-center ${step < 3 ? "flex-1" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step <= currentStep ? "bg-primary-500 text-white" : "bg-neutral-200"
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`flex-1 h-1 mx-4 ${
                  step < currentStep ? "bg-primary-500" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm text-neutral-600">
        <span>Settlement Details</span>
        <span>Attorney Information</span>
        <span>Review & Submit</span>
      </div>
    </div>
  );
};
