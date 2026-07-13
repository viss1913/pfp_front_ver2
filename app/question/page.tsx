"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import StepGender from "@/components/questionnaire/StepGender";
import StepAge from "@/components/questionnaire/StepAge";
import StepGoalSelection from "@/components/questionnaire/StepGoalSelection";
import { useQuestionnaireStore } from "@/store/questionnaire-store";

function QuestionPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isCreate = searchParams.get("create") !== null;
  const { currentStep, setCurrentStep } = useQuestionnaireStore();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isCreate) {
      router.push("/");
      return;
    }
    setStep(currentStep);
  }, [isCreate, currentStep, router]);

  const handleNext = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      setCurrentStep(prevStep);
    } else {
      router.push("/");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepGender onNext={handleNext} />;
      case 1:
        return <StepAge onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <StepGoalSelection onBack={handleBack} onNext={handleNext} />;
      default:
        return null;
    }
  };

  if (!isCreate) {
    return null;
  }

  return (
    <main className="min-h-screen bg-light py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-text">Шаг {step + 1} из 3</span>
            <button
              onClick={handleBack}
              className="text-secondary hover:underline text-sm"
            >
              Назад
            </button>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}
      </div>
    </main>
  );
}

export default function QuestionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-light py-8 px-4">
          <p className="text-center text-sm text-gray-500">Загрузка…</p>
        </main>
      }
    >
      <QuestionPageInner />
    </Suspense>
  );
}
