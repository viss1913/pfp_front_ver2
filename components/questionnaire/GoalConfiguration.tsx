"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Slider from "@/components/ui/Slider";
import Card from "@/components/ui/Card";
import RiskProfileSelector from "./RiskProfileSelector";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { Goal, RiskProfile } from "@/types";
import { getGoalTypeId } from "@/lib/goal-mapping";

interface GoalConfigurationProps {
  goalName: string;
  goalIndex?: number;
  initialData?: Partial<Goal>;
  onSave: (goal: Goal) => void;
  onCancel: () => void;
}

export default function GoalConfiguration({
  goalName,
  goalIndex,
  initialData,
  onSave,
  onCancel,
}: GoalConfigurationProps) {
  const goalTypeId = getGoalTypeId(goalName);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(
    (initialData?.risk_profile as RiskProfile) || "BALANCED"
  );

  const { handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      target_amount: initialData?.target_amount || 0,
      term_months: initialData?.term_months || 60,
      initial_capital: initialData?.initial_capital || 0,
      monthly_replenishment: initialData?.monthly_replenishment || 0,
    },
  });

  const targetAmount = watch("target_amount");
  const termMonths = watch("term_months");
  const initialCapital = watch("initial_capital");
  const monthlyReplenishment = watch("monthly_replenishment");

  // Определяем рекомендуемый профиль на основе возраста и срока
  const getRecommendedProfile = (): RiskProfile => {
    // Логика рекомендации (можно доработать)
    if (termMonths > 120) return "AGGRESSIVE";
    if (termMonths < 60) return "CONSERVATIVE";
    return "BALANCED";
  };

  const onSubmit = (data: any) => {
    const goal: Goal = {
      goal_type_id: goalTypeId,
      name: goalName,
      target_amount: data.target_amount,
      term_months: data.term_months,
      risk_profile: riskProfile,
      initial_capital: data.initial_capital || 0,
      monthly_replenishment: data.monthly_replenishment || 0,
    };

    onSave(goal);
  };

  // Настройки слайдеров в зависимости от типа цели
  const getSliderConfig = () => {
    switch (goalTypeId) {
      case 1: // Пенсия
        return {
          targetAmount: { min: 30000, max: 500000, step: 1000, label: "Желаемая пенсия (₽/мес)" },
          termMonths: { min: 12, max: 720, step: 12, label: "Срок до пенсии (месяцев)" },
        };
      case 2: // Пассивный доход
        return {
          targetAmount: { min: 10000, max: 1000000, step: 10000, label: "Желаемый ежемесячный доход (₽)" },
          termMonths: { min: 12, max: 720, step: 12, label: "Срок накопления (месяцев)" },
        };
      case 3: // Сохранить и преумножить
        return {
          initialCapital: { min: 0, max: 50000000, step: 50000, label: "Текущий капитал (₽)" },
          monthlyReplenishment: { min: 0, max: 1000000, step: 5000, label: "Ежемесячное пополнение (₽)" },
          termMonths: { min: 12, max: 480, step: 12, label: "Горизонт инвестирования (месяцев)" },
        };
      default: // Другие цели (квартира, детский капитал и т.д.)
        return {
          targetAmount: { min: 1000000, max: 100000000, step: 500000, label: "Стоимость цели (₽)" },
          termMonths: { min: 1, max: 720, step: 1, label: "Срок накопления (месяцев)" },
          initialCapital: { min: 0, max: 10000000, step: 100000, label: "Начальный капитал (₽)" },
        };
    }
  };

  const sliderConfig = getSliderConfig();

  return (
    <Card>
      <h2 className="text-2xl font-semibold mb-6">Настройка цели: {goalName}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Параметры цели */}
        <div className="space-y-6">
          {sliderConfig.targetAmount && (
            <Slider
              min={sliderConfig.targetAmount.min}
              max={sliderConfig.targetAmount.max}
              step={sliderConfig.targetAmount.step}
              value={targetAmount}
              onChange={(value) => setValue("target_amount", value)}
              label={sliderConfig.targetAmount.label}
              formatValue={formatCurrency}
            />
          )}

          {sliderConfig.initialCapital && (
            <Slider
              min={sliderConfig.initialCapital.min}
              max={sliderConfig.initialCapital.max}
              step={sliderConfig.initialCapital.step}
              value={initialCapital}
              onChange={(value) => setValue("initial_capital", value)}
              label={sliderConfig.initialCapital.label}
              formatValue={formatCurrency}
            />
          )}

          {sliderConfig.monthlyReplenishment && (
            <Slider
              min={sliderConfig.monthlyReplenishment.min}
              max={sliderConfig.monthlyReplenishment.max}
              step={sliderConfig.monthlyReplenishment.step}
              value={monthlyReplenishment}
              onChange={(value) => setValue("monthly_replenishment", value)}
              label={sliderConfig.monthlyReplenishment.label}
              formatValue={formatCurrency}
            />
          )}

          {sliderConfig.termMonths && (
            <Slider
              min={sliderConfig.termMonths.min}
              max={sliderConfig.termMonths.max}
              step={sliderConfig.termMonths.step}
              value={termMonths}
              onChange={(value) => setValue("term_months", value)}
              label={sliderConfig.termMonths.label}
              formatValue={(value) => `${formatNumber(value)} мес.`}
            />
          )}
        </div>

        {/* Выбор риск-профиля */}
        <RiskProfileSelector
          selected={riskProfile}
          onSelect={setRiskProfile}
          recommended={getRecommendedProfile()}
        />

        {/* Кнопки */}
        <div className="flex justify-between mt-8">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit" variant="primary">
            Сохранить цель
          </Button>
        </div>
      </form>
    </Card>
  );
}


