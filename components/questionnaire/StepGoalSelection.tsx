"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { useQuestionnaireStore } from "@/store/questionnaire-store";
import { getGoalTypeId } from "@/lib/goal-mapping";
import GoalConfiguration from "./GoalConfiguration";
import type { Goal, RiskProfile } from "@/types";

interface StepGoalSelectionProps {
  onBack: () => void;
  onNext?: () => void;
}

const goalCards = [
  {
    name: "Сохранить и преумножить",
    description: "Инвестируйте свой капитал с умом",
    icon: "📈",
  },
  {
    name: "Ежемесячный доход",
    description: "Получайте стабильный доход с капитала",
    icon: "💰",
  },
  {
    name: "Квартира",
    description: "Накопите на собственное жилье",
    icon: "🏠",
  },
  {
    name: "Пенсия",
    description: "Обеспечьте достойную пенсию",
    icon: "👴",
  },
  {
    name: "Детский капитал",
    description: "Создайте финансовую подушку для детей",
    icon: "👶",
  },
];

export default function StepGoalSelection({ onBack, onNext }: StepGoalSelectionProps) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [configuringGoal, setConfiguringGoal] = useState(false);
  const { addGoal, updateGoal, data } = useQuestionnaireStore();

  const handleGoalSelect = (goalName: string) => {
    setSelectedGoal(goalName);
  };

  const handleConfigure = () => {
    if (selectedGoal) {
      setConfiguringGoal(true);
    }
  };

  const handleSaveGoal = (goal: Goal) => {
    const existingGoalIndex = data.goals?.findIndex((g) => g.name === selectedGoal);
    
    if (existingGoalIndex !== undefined && existingGoalIndex >= 0) {
      updateGoal(existingGoalIndex, goal);
    } else {
      addGoal(goal);
    }
    
    setConfiguringGoal(false);
    if (onNext) {
      onNext();
    }
  };

  const handleCancelConfigure = () => {
    setConfiguringGoal(false);
    setSelectedGoal(null);
  };

  if (configuringGoal && selectedGoal) {
    const existingGoal = data.goals?.find((g) => g.name === selectedGoal);
    
    return (
      <GoalConfiguration
        goalName={selectedGoal}
        initialData={existingGoal}
        onSave={handleSaveGoal}
        onCancel={handleCancelConfigure}
      />
    );
  }

  return (
    <Card>
      <h2 className="text-2xl font-semibold mb-2">
        Выберите вашу первоначальную цель
      </h2>
      <p className="text-gray-600 mb-8">
        Выберите основную финансовую цель для планирования
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {goalCards.map((goal) => (
          <button
            key={goal.name}
            onClick={() => handleGoalSelect(goal.name)}
            className={`p-6 rounded-12 border-2 transition-all text-left hover:shadow-md ${
              selectedGoal === goal.name
                ? "border-primary bg-primary/10"
                : "border-gray-200 hover:border-primary/50"
            }`}
          >
            <div className="text-4xl mb-4">{goal.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{goal.name}</h3>
            <p className="text-sm text-gray-600">{goal.description}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Button type="button" variant="ghost" onClick={onBack}>
          Назад
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleConfigure}
          disabled={!selectedGoal}
        >
          Далее
        </Button>
      </div>
    </Card>
  );
}

