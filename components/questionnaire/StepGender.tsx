"use client";

import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import Radio from "@/components/ui/Radio";
import Card from "@/components/ui/Card";
import { useQuestionnaireStore } from "@/store/questionnaire-store";
import type { Gender } from "@/types";

interface FormData {
  gender: Gender;
}

interface StepGenderProps {
  onNext: () => void;
}

export default function StepGender({ onNext }: StepGenderProps) {
  const { data, setGender } = useQuestionnaireStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      gender: data.gender,
    },
  });

  const onSubmit = (formData: FormData) => {
    setGender(formData.gender);
    onNext();
  };

  return (
    <Card>
      <h2 className="text-2xl font-semibold mb-6">Выберите пол клиента</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <Radio
            label="Мужской"
            value="male"
            {...register("gender", { required: "Выберите пол" })}
          />
          <Radio
            label="Женский"
            value="female"
            {...register("gender", { required: "Выберите пол" })}
          />
        </div>
        {errors.gender && (
          <p className="text-red-500 text-sm">{errors.gender.message}</p>
        )}
        <div className="flex justify-end mt-8">
          <Button type="submit" variant="primary">
            Далее
          </Button>
        </div>
      </form>
    </Card>
  );
}


