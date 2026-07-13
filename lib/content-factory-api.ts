import axios, { AxiosError, type AxiosInstance } from "axios";
import type {
  ChatMessage,
  ChatPostResponse,
  ContentOffer,
  ContentOfferChatRequest,
  ContentOfferCreate,
  ContentOfferPatch,
  IdeHealth,
  MediaListResponse,
  MediaUploadRequest,
  MediaUploadResponse,
  OfferStatus,
  SseErrorEvent,
  SseProgressEvent,
  SseResultEvent,
} from "@/types/content-factory";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "https://pfp-api.bank-future.com/api";

export const contentFactoryApi: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function adminHeaders(projectKey: string, token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "x-project-key": projectKey,
  };
}

function headers(projectKey: string, token: string) {
  return { headers: adminHeaders(projectKey, token) };
}

/** Parse API error for UI toasts */
export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{
      detail?: string | { msg?: string }[];
      message?: string;
      error?: string;
    }>;
    const status = ax.response?.status;
    const data = ax.response?.data;

    if (status === 422) {
      return "AI удалил кнопку CTA — попросите вернуть <a data-cta-slot>";
    }
    if (status === 503) {
      return "IDE не настроен на backend";
    }
    if (status === 504) {
      return "Таймаут генерации — повторите";
    }
    if (status === 400) {
      const detail =
        typeof data?.detail === "string"
          ? data.detail
          : data?.message || "Некорректный запрос (400)";
      return detail;
    }
    if (status === 401) {
      return "Не авторизован — проверьте JWT";
    }
    if (status === 403) {
      return "Нет доступа — проверьте x-project-key и роль";
    }

    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
    }
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (ax.message) return ax.message;
  }
  if (err instanceof Error) return err.message;
  return "Неизвестная ошибка";
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.files)) return obj.files as T[];
  }
  return [];
}

export type ChatStreamHandlers = {
  onHello?: () => void;
  onProgress?: (event: SseProgressEvent) => void;
  onResult?: (event: SseResultEvent) => void;
  onDone?: () => void;
  onError?: (event: SseErrorEvent) => void;
};

function parseSseChunk(
  buffer: string,
  handlers: ChatStreamHandlers
): string {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const block of parts) {
    if (!block.trim()) continue;
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    const raw = dataLines.join("\n");
    let data: Record<string, unknown> = {};
    if (raw) {
      try {
        data = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        data = { message: raw };
      }
    }

    switch (eventName) {
      case "hello":
        handlers.onHello?.();
        break;
      case "progress":
        handlers.onProgress?.(data as SseProgressEvent);
        break;
      case "result":
        handlers.onResult?.(data as SseResultEvent);
        break;
      case "done":
        handlers.onDone?.();
        break;
      case "error":
        handlers.onError?.(data as SseErrorEvent);
        break;
      default:
        break;
    }
  }

  return rest;
}

// ─── Offers ──────────────────────────────────────────────────

export const offersApi = {
  list: async (
    projectKey: string,
    token: string,
    status?: OfferStatus | ""
  ): Promise<ContentOffer[]> => {
    const { data } = await contentFactoryApi.get(
      "/admin/content-factory/offers",
      {
        ...headers(projectKey, token),
        params: status ? { status } : undefined,
      }
    );
    return unwrapList<ContentOffer>(data);
  },

  get: async (
    id: number,
    projectKey: string,
    token: string,
    opts?: { sync?: boolean }
  ): Promise<ContentOffer> => {
    const { data } = await contentFactoryApi.get(
      `/admin/content-factory/offers/${id}`,
      {
        ...headers(projectKey, token),
        params: opts?.sync ? { sync: "1" } : undefined,
      }
    );
    return data;
  },

  create: async (
    body: ContentOfferCreate,
    projectKey: string,
    token: string
  ): Promise<ContentOffer> => {
    const { data } = await contentFactoryApi.post(
      "/admin/content-factory/offers",
      body,
      headers(projectKey, token)
    );
    return data;
  },

  patch: async (
    id: number,
    body: ContentOfferPatch,
    projectKey: string,
    token: string
  ): Promise<ContentOffer> => {
    const { data } = await contentFactoryApi.patch(
      `/admin/content-factory/offers/${id}`,
      body,
      headers(projectKey, token)
    );
    return data;
  },

  publish: async (
    id: number,
    projectKey: string,
    token: string
  ): Promise<ContentOffer> => {
    const { data } = await contentFactoryApi.post(
      `/admin/content-factory/offers/${id}/publish`,
      {},
      headers(projectKey, token)
    );
    return data;
  },

  unpublish: async (
    id: number,
    projectKey: string,
    token: string
  ): Promise<ContentOffer> => {
    const { data } = await contentFactoryApi.post(
      `/admin/content-factory/offers/${id}/unpublish`,
      {},
      headers(projectKey, token)
    );
    return data;
  },

  archive: async (
    id: number,
    projectKey: string,
    token: string
  ): Promise<void> => {
    await contentFactoryApi.delete(
      `/admin/content-factory/offers/${id}`,
      headers(projectKey, token)
    );
  },

  getChatMessages: async (
    id: number,
    projectKey: string,
    token: string
  ): Promise<ChatMessage[]> => {
    const { data } = await contentFactoryApi.get(
      `/admin/content-factory/offers/${id}/chat/messages`,
      headers(projectKey, token)
    );
    return unwrapList<ChatMessage>(data);
  },

  /** JSON fallback (no stream) */
  postChatMessage: async (
    id: number,
    body: ContentOfferChatRequest,
    projectKey: string,
    token: string
  ): Promise<ChatPostResponse> => {
    const { data } = await contentFactoryApi.post(
      `/admin/content-factory/offers/${id}/chat/messages`,
      body,
      headers(projectKey, token)
    );
    return data;
  },

  /** SSE chat turn — primary path */
  postChatMessageStream: async (
    id: number,
    body: ContentOfferChatRequest,
    projectKey: string,
    token: string,
    handlers: ChatStreamHandlers
  ): Promise<void> => {
    const url = `${baseURL}/admin/content-factory/offers/${id}/chat/messages?stream=1`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...adminHeaders(projectKey, token),
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        if (res.status === 422) {
          message =
            "AI удалил кнопку CTA — попросите вернуть <a data-cta-slot>";
        } else if (res.status === 503) {
          message = "IDE не настроен на backend";
        } else if (res.status === 504) {
          message = "Таймаут генерации — повторите";
        } else if (typeof errBody?.detail === "string") {
          message = errBody.detail;
        } else if (errBody?.message) {
          message = errBody.message;
        }
      } catch {
        /* ignore parse */
      }
      handlers.onError?.({ error: String(res.status), message });
      throw new Error(message);
    }

    if (!res.body) {
      const message = "Пустой SSE stream";
      handlers.onError?.({ message });
      throw new Error(message);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = parseSseChunk(buffer, handlers);
    }
    if (buffer.trim()) {
      parseSseChunk(buffer + "\n\n", handlers);
    }
    handlers.onDone?.();
  },

  listMedia: async (
    id: number,
    projectKey: string,
    token: string
  ): Promise<MediaListResponse> => {
    const { data } = await contentFactoryApi.get(
      `/admin/content-factory/offers/${id}/media`,
      headers(projectKey, token)
    );
    if (data && Array.isArray(data.files)) return data as MediaListResponse;
    return { files: unwrapList(data) };
  },

  uploadMedia: async (
    id: number,
    body: MediaUploadRequest,
    projectKey: string,
    token: string
  ): Promise<MediaUploadResponse> => {
    const { data } = await contentFactoryApi.post(
      `/admin/content-factory/offers/${id}/media`,
      body,
      headers(projectKey, token)
    );
    if (data && Array.isArray(data.files)) return data as MediaUploadResponse;
    return { ok: true, files: unwrapList(data) };
  },

  healthIde: async (
    projectKey: string,
    token: string
  ): Promise<IdeHealth> => {
    const { data } = await contentFactoryApi.get(
      "/admin/content-factory/health/ide",
      headers(projectKey, token)
    );
    return data;
  },
};
