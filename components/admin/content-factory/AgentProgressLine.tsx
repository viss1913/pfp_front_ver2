"use client";

import { IDE_AGENT_LABELS } from "@/types/content-factory";
import type { SseProgressEvent } from "@/types/content-factory";

type Props = {
  progress: SseProgressEvent | null;
  history?: SseProgressEvent[];
};

export default function AgentProgressLine({ progress, history = [] }: Props) {
  const items =
    history.length > 0
      ? history
      : progress
        ? [progress]
        : [];

  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5 font-mono text-xs">
      {items.map((p, i) => {
        const label =
          IDE_AGENT_LABELS[p.agent || ""] || p.agent || "Агент";
        const isLast = i === items.length - 1;
        return (
          <div
            key={`${p.agent}-${i}-${p.message}`}
            className="flex items-start gap-2 rounded-lg border border-[#2a3344] bg-[#0a0e14]/60 px-3 py-2 text-[#9ca3af]"
          >
            <span
              className={
                isLast
                  ? "mt-1 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-indigo-400"
                  : "mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70"
              }
            />
            <div>
              <span className="font-semibold text-indigo-300">{label}</span>
              {p.status && (
                <span className="ml-1.5 text-[10px] uppercase opacity-60">
                  {p.status}
                </span>
              )}
              {p.message && (
                <div className="mt-0.5 text-[#c5cdd8]">
                  {p.message}
                  {isLast && p.status !== "done" && p.status !== "completed" && (
                    <span className="animate-pulse">…</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
