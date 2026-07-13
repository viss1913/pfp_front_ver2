import api from "./api";
import type { CalculationRequest, ClientData } from "@/types";

export const clientApi = {
  calculate: async (data: CalculationRequest) => {
    const response = await api.post("/client/calculate", data);
    return response.data;
  },

  createClient: async (data: {
    client: ClientData;
    assets?: any[];
    liabilities?: any[];
    expenses?: any[];
    goals?: any[];
  }) => {
    const response = await api.post("/client", data);
    return response.data;
  },

  firstRun: async (data: {
    client: ClientData;
    assets?: any[];
    liabilities?: any[];
    expenses?: any[];
    goals?: any[];
  }) => {
    const response = await api.post("/client/first-run", data);
    return response.data;
  },
};


