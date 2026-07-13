export type Gender = "male" | "female";
export type RiskProfile = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";

export type {
  OfferStatus,
  IdeAgentId,
  ContentOffer,
  ContentOfferCreate,
  ContentOfferPatch,
  ChatMessage,
  ChatAttachment,
  ContentOfferChatRequest,
  ChatPostResponse,
  MediaFileKind,
  MediaUploadFile,
  MediaUploadRequest,
  MediaFileRef,
  MediaUploadResponse,
  MediaListResponse,
  SseProgressEvent,
  SseResultEvent,
  SseErrorEvent,
  IdeHealth,
} from "./content-factory";

export { IDE_AGENT_LABELS } from "./content-factory";

export type GoalTypeId = 1 | 2 | 3 | 4 | 5;

export interface Goal {
  goal_type_id: GoalTypeId;
  name: string;
  target_amount: number;
  term_months: number;
  risk_profile: RiskProfile;
  initial_capital?: number;
  inflation_rate?: number;
  avg_monthly_income?: number;
  start_date?: string;
  monthly_replenishment?: number;
  payment_variant?: 0 | 1 | 2 | 4 | 12;
  program?: string;
}

export interface ClientData {
  sex: Gender;
  birth_date: string;
  fio?: string;
  name?: string;
  phone?: string;
  email?: string;
  avg_monthly_income?: number;
}

export interface CalculationRequest {
  goals: Goal[];
  client?: ClientData;
}

export interface QuestionnaireData {
  gender: Gender;
  age: number;
  goals: Goal[];
  assets?: any[];
  liabilities?: any[];
}
