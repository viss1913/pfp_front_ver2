"use client";

import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import Slider from "@/components/ui/Slider";
import Card from "@/components/ui/Card";
import { useQuestionnaireStore } from "@/store/questionnaire-store";
import { formatNumber } from "@/lib/utils";

interface FormData {
  age: number;
}

interface StepAgeProps {
  onNext: () => void;
  onBack: () => void;
}

export default function StepAge({ onNext, onBack }: StepAgeProps) {
  const { data, setAge } = useQuestionnaireStore();
  const { handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      age: data.age || 39,
    },
  });

  const age = watch("age");

  const onSubmit = (formData: FormData) => {
    setAge(formData.age);
    onNext();
  };

  return (
    <Card>
      <h2 className="text-2xl font-semibold mb-6">Укажите возраст клиента</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="py-8">
          <Slider
            min={0}
            max={99}
            step={1}
            value={age}
            onChange={(value) => setValue("age", value)}
            label="Возраст"
            formatValue={(value) => `${formatNumber(value)} лет`}
          />
        </div>
        <div className="flex justify-between mt-8">
          <Button type="button" variant="ghost" onClick={onBack}>
            Назад
          </Button>
          <Button type="submit" variant="primary">
            Далее
          </Button>
        </div>
      </form>
    </Card>
  );
}


