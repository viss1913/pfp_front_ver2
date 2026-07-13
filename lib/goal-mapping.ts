import type { GoalTypeId } from "@/types";

export function getGoalTypeId(goalName: string): GoalTypeId {
  const goalTypeMap: Record<string, GoalTypeId> = {
    Пенсия: 1,
    "Пассивный доход в будущем": 2,
    "Сохранить и преумножить": 3,
    Квартира: 4,
    Дом: 4,
    "Загородная недвижимость": 4,
    "Первый взнос на ипотеку": 4,
    "Детский капитал": 4,
    "Просто капитал": 4,
    "Страхование жизни": 5,
  };

  return goalTypeMap[goalName] || 4;
}

export const goalTypes = {
  "Сохранить и преумножить": { id: 3, type: "INVESTMENT" },
  "Ежемесячный доход": { id: 2, type: "PASSIVE_INCOME" },
  Квартира: { id: 4, type: "OTHER" },
  "Недвижимость (загородная)": { id: 4, type: "OTHER" },
  "Первый взнос на ипотеку": { id: 4, type: "OTHER" },
  "Детский капитал": { id: 4, type: "OTHER" },
  "Пассивный доход в будущем": { id: 2, type: "PASSIVE_INCOME" },
  Пенсия: { id: 1, type: "PENSION" },
  "Страхование жизни": { id: 5, type: "LIFE" },
};


