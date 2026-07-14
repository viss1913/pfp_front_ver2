/** Content Factory — admin types (OpenAPI: docs/content-factory/openapi/OPENAPI_SPEC.yaml) */

export type OfferStatus = "draft" | "published" | "archived";

export type IdeAgentId = "orchestrator" | "site_architect" | "code_generator";

export type TemplateOrientation = "portrait" | "landscape";
export type TemplateTheme = "light" | "dark";

export const DEFAULT_TEMPLATE_ID = "finam-a4-portrait-light";

export const MIN_PAGE_COUNT = 1;
export const MAX_PAGE_COUNT = 20;
export const DEFAULT_PAGE_COUNT = 1;

export function clampPageCount(value: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_PAGE_COUNT;
  return Math.min(MAX_PAGE_COUNT, Math.max(MIN_PAGE_COUNT, n));
}

export type ContentFactoryTemplate = {
  id: string;
  title: string;
  orientation?: TemplateOrientation;
  theme?: TemplateTheme;
  format?: string;
  page_size?: string;
  preview_url: string;
};

export type ContentOffer = {
  id: number;
  project_id: number;
  title: string;
  kind: string;
  brief?: string | null;
  base_template_id?: string | null;
  page_count?: number;
  ide_session_id?: string | null;
  cta_url_base?: string | null;
  cta_label?: string | null;
  generated_html?: string | null;
  status: OfferStatus;
  expires_at?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ContentOfferCreate = {
  title: string;
  brief?: string | null;
  base_template_id?: string;
  page_count?: number;
  kind?: string;
  cta_url_base?: string | null;
  cta_label?: string | null;
  expires_at?: string | null;
  generate?: boolean;
};

export type ContentOfferPatch = {
  title?: string;
  brief?: string | null;
  kind?: string;
  base_template_id?: string;
  cta_url_base?: string | null;
  cta_label?: string | null;
  expires_at?: string | null;
};

export type ChatMessage = {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
  attachments?: ChatAttachment[];
};

export type ChatAttachment = {
  ref: string;
  role?: string;
  instruction?: string;
};

export type ContentOfferChatRequest = {
  content: string;
  attachments?: ChatAttachment[];
};

export type ChatPostResponse = {
  offer?: ContentOffer;
  messages?: ChatMessage[];
  preview_html?: string;
  assistant_message?: string;
  validation?: {
    cta_slot_present?: boolean;
  };
};

export type MediaFileKind = "logo" | "hero" | "icon" | "chart_data" | "text" | "other";

export type MediaUploadFile = {
  name: string;
  content_base64: string;
  content_type?: string;
  kind?: MediaFileKind;
};

export type MediaUploadRequest = {
  files: MediaUploadFile[];
};

export type MediaFileRef = {
  ref: string;
  name: string;
  content_type?: string;
  kind?: string;
};

export type MediaUploadResponse = {
  ok?: boolean;
  files: MediaFileRef[];
};

export type MediaListResponse = {
  files: MediaFileRef[];
};

export type SseProgressEvent = {
  agent?: IdeAgentId | string;
  message?: string;
  status?: string;
};

export type SseResultEvent = {
  html?: string;
  assistant_message?: string;
};

export type SseErrorEvent = {
  error?: string;
  message?: string;
};

export type IdeHealth = {
  ok?: boolean;
  service?: string;
  version?: string;
  llm?: string;
  grokTerminal?: boolean;
};

/** RU labels for SSE agent progress */
export const IDE_AGENT_LABELS: Record<string, string> = {
  orchestrator: "Планировщик",
  site_architect: "Бизнес-аналитик",
  code_generator: "Программист",
};
