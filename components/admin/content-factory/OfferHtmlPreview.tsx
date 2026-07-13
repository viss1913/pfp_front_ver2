"use client";

import type { CSSProperties } from "react";
import { clsx } from "clsx";

export type PreviewViewport = "desktop" | "tablet" | "a4";

type Props = {
  html?: string | null;
  viewport: PreviewViewport;
  onViewportChange: (v: PreviewViewport) => void;
};

const VIEWPORTS: { id: PreviewViewport; label: string }[] = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "a4", label: "A4" },
];

function frameStyle(viewport: PreviewViewport): CSSProperties {
  if (viewport === "desktop") {
    return { width: "100%", maxWidth: 1280, height: "100%" };
  }
  if (viewport === "tablet") {
    return { width: 768, maxWidth: "100%", height: "100%" };
  }
  // A4: 210×297 aspect, white paper card
  return {
    width: "min(100%, 420px)",
    aspectRatio: "210 / 297",
    height: "auto",
    maxHeight: "100%",
  };
}

export default function OfferHtmlPreview({
  html,
  viewport,
  onViewportChange,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0a0e14]">
      <div className="flex items-center justify-between border-b border-[#2a3344] px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
          Preview
        </span>
        <div className="inline-flex rounded-lg border border-[#2a3344] bg-[#121820] p-0.5">
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewportChange(v.id)}
              className={clsx(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                viewport === v.id
                  ? "bg-[#2a3344] text-white"
                  : "text-[#9ca3af] hover:text-white"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-4">
        {!html ? (
          <div className="flex h-full min-h-[240px] w-full items-center justify-center rounded-lg border border-dashed border-[#2a3344] text-sm text-[#6b7280]">
            Создайте оффер или отправьте первую правку в чат
          </div>
        ) : (
          <div
            className={clsx(
              "overflow-hidden bg-white shadow-2xl shadow-black/40",
              viewport === "a4" ? "rounded-sm" : "rounded-lg h-full"
            )}
            style={frameStyle(viewport)}
          >
            <iframe
              title="preview"
              sandbox="allow-same-origin"
              srcDoc={html}
              className="h-full w-full border-0 bg-white"
              style={
                viewport === "a4"
                  ? { minHeight: "100%", height: "100%" }
                  : { minHeight: 480 }
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
