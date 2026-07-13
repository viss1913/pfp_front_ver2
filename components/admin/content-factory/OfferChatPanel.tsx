"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { clsx } from "clsx";
import type { ChatAttachment, ChatMessage, SseProgressEvent } from "@/types/content-factory";
import AgentProgressLine from "./AgentProgressLine";

type Props = {
  messages: ChatMessage[];
  progressHistory: SseProgressEvent[];
  currentProgress: SseProgressEvent | null;
  pendingAttachments: ChatAttachment[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onAttachClick: () => void;
  onRemoveAttachment: (ref: string) => void;
  streaming: boolean;
  disabled?: boolean;
};

export default function OfferChatPanel({
  messages,
  progressHistory,
  currentProgress,
  pendingAttachments,
  input,
  onInputChange,
  onSend,
  onAttachClick,
  onRemoveAttachment,
  streaming,
  disabled,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const fileHintRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, progressHistory, currentProgress, streaming]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!streaming && input.trim()) onSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#121820]">
      <div className="border-b border-[#2a3344] px-4 py-2.5">
        <h2 className="text-sm font-semibold text-[#e5e7eb]">Чат с AI</h2>
        <p className="text-[11px] text-[#6b7280]">
          Планировщик → БА → Программист · SSE
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !streaming && (
          <p className="text-sm text-[#6b7280]">
            Опишите правку или задачу — AI обновит A4-страницу.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={m.id ?? `msg-${i}`}
            className={clsx(
              "max-w-[92%] rounded-lg px-3 py-2 text-sm",
              m.role === "user"
                ? "ml-auto bg-[#1e3a5f] text-[#e8f0fe]"
                : m.role === "system"
                  ? "mr-auto border border-[#2a3344] bg-[#0a0e14] text-[#9ca3af]"
                  : "mr-auto bg-[#1e2633] text-[#e5e7eb]"
            )}
          >
            <div className="mb-0.5 text-[10px] uppercase tracking-wide opacity-60">
              {m.role === "user"
                ? "Вы"
                : m.role === "assistant"
                  ? "Ассистент"
                  : "Система"}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.attachments && m.attachments.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {m.attachments.map((a) => (
                  <span
                    key={a.ref}
                    className="inline-flex items-center gap-1 rounded bg-black/20 px-2 py-0.5 text-[11px]"
                  >
                    📎 {a.ref.replace(/^media:/, "")}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {(streaming || progressHistory.length > 0) && (
          <AgentProgressLine
            progress={currentProgress}
            history={progressHistory}
          />
        )}

        <div ref={endRef} />
      </div>

      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#2a3344] px-3 py-2">
          {pendingAttachments.map((a) => (
            <span
              key={a.ref}
              className="inline-flex items-center gap-1 rounded-md border border-[#2a3344] bg-[#0a0e14] px-2 py-1 text-xs text-[#c5cdd8]"
            >
              📎 {a.ref.replace(/^media:/, "")}
              <button
                type="button"
                className="ml-1 text-[#6b7280] hover:text-white"
                onClick={() => onRemoveAttachment(a.ref)}
                aria-label="Убрать вложение"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-[#2a3344] p-3">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onAttachClick}
            disabled={disabled || streaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2a3344] text-[#9ca3af] hover:bg-[#1e2633] hover:text-white disabled:opacity-40"
            title="Прикрепить файл"
            aria-label="Прикрепить файл"
          >
            📎
          </button>
          <textarea
            className="min-h-[40px] max-h-32 flex-1 resize-y rounded-lg border border-[#2a3344] bg-[#0a0e14] px-3 py-2 text-sm text-[#e5e7eb] placeholder:text-[#6b7280] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            rows={2}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Правка или задача…"
            disabled={disabled || streaming}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || streaming || !input.trim()}
            className="h-10 shrink-0 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {streaming ? "…" : "Отправить"}
          </button>
        </div>
        {/* hidden — parent can wire real file input via onAttachClick */}
        <input ref={fileHintRef} type="file" className="hidden" tabIndex={-1} />
      </div>
    </div>
  );
}
