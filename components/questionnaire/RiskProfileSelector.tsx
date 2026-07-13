"use client";

import Card from "@/components/ui/Card";
import type { RiskProfile } from "@/types";

interface RiskProfileOption {
  type: RiskProfile;
  name: string;
  description: string;
  yield: string;
  volatility: string;
  icon: string;
  color: string;
}

const riskProfiles: RiskProfileOption[] = [
  {
    type: "CONSERVATIVE",
    name: "Консервативный",
    description: "Минимальный риск, стабильный доход",
    yield: "6-8% годовых",
    volatility: "Низкая",
    icon: "🛡️",
    color: "green",
  },
  {
    type: "BALANCED",
    name: "Умеренный",
    description: "Баланс между риском и доходностью",
    yield: "10-12% годовых",
    volatility: "Средняя",
    icon: "⚖️",
    color: "yellow",
  },
  {
    type: "AGGRESSIVE",
    name: "Агрессивный",
    description: "Высокий риск, максимальная доходность",
    yield: "15-20% годовых",
    volatility: "Высокая",
    icon: "🚀",
    color: "red",
  },
];

interface RiskProfileSelectorProps {
  selected?: RiskProfile;
  onSelect: (profile: RiskProfile) => void;
  recommended?: RiskProfile;
}

export default function RiskProfileSelector({
  selected,
  onSelect,
  recommended,
}: RiskProfileSelectorProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Выберите риск-профиль</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {riskProfiles.map((profile) => (
          <Card
            key={profile.type}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selected === profile.type
                ? "ring-2 ring-primary ring-offset-2"
                : ""
            }`}
            onClick={() => onSelect(profile.type)}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{profile.icon}</div>
              <h4 className="font-semibold text-lg mb-2">{profile.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{profile.description}</p>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Доходность: </span>
                  <span className="text-primary">{profile.yield}</span>
                </div>
                <div>
                  <span className="font-medium">Волатильность: </span>
                  <span>{profile.volatility}</span>
                </div>
              </div>
              {recommended === profile.type && (
                <span className="inline-block mt-3 px-3 py-1 bg-primary text-dark text-xs font-semibold rounded-full">
                  Рекомендуем
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


