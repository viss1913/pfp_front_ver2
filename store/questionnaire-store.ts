import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { QuestionnaireData, Goal } from "@/types";

interface QuestionnaireStore {
  data: Partial<QuestionnaireData>;
  currentStep: number;
  setGender: (gender: "male" | "female") => void;
  setAge: (age: number) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (index: number, goal: Partial<Goal>) => void;
  removeGoal: (index: number) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

const initialState = {
  gender: undefined as "male" | "female" | undefined,
  age: 39,
  goals: [] as Goal[],
  assets: [] as any[],
  liabilities: [] as any[],
};

export const useQuestionnaireStore = create<QuestionnaireStore>()(
  persist(
    (set) => ({
      data: initialState,
      currentStep: 0,
      setGender: (gender) =>
        set((state) => ({
          data: { ...state.data, gender },
        })),
      setAge: (age) =>
        set((state) => ({
          data: { ...state.data, age },
        })),
      addGoal: (goal) =>
        set((state) => ({
          data: {
            ...state.data,
            goals: [...(state.data.goals || []), goal],
          },
        })),
      updateGoal: (index, goal) =>
        set((state) => {
          const goals = [...(state.data.goals || [])];
          goals[index] = { ...goals[index], ...goal };
          return {
            data: { ...state.data, goals },
          };
        }),
      removeGoal: (index) =>
        set((state) => {
          const goals = [...(state.data.goals || [])];
          goals.splice(index, 1);
          return {
            data: { ...state.data, goals },
          };
        }),
      setCurrentStep: (step) => set({ currentStep: step }),
      reset: () =>
        set({
          data: initialState,
          currentStep: 0,
        }),
    }),
    {
      name: "questionnaire-storage",
      storage: createJSONStorage(() => 
        typeof window !== "undefined" ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    }
  )
);

