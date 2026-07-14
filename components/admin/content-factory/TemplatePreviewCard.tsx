"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { templatesApi } from "@/lib/content-factory-api";
import type { ContentFactoryTemplate } from "@/types/content-factory";

type Props = {
  template: ContentFactoryTemplate;
  selected: boolean;
  onSelect: (id: string) => void;
  projectKey: string;
  token: string;
};

const ORIENTATION_LABELS: Record<string, string> = {
  portrait: "Вертикальный",
  landscape: "Горизонтальный",
};

const THEME_LABELS: Record<string, string> = {
  light: "Светлый",
  dark: "Тёмный",
};

function previewDimensions(template: ContentFactoryTemplate) {
  const isLandscape = template.orientation === "landscape";
  return {
    width: isLandscape ? "297mm" : "210mm",
    height: isLandscape ? "210mm" : "297mm",
    scale: isLandscape ? 0.28 : 0.35,
  };
}

export default function TemplatePreviewCard({
  template,
  selected,
  onSelect,
  projectKey,
  token,
}: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const content = await templatesApi.fetchPreviewHtml(
        template.preview_url,
        projectKey,
        token
      );
      setHtml(content);
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 404 ? "Шаблон не найден" : "Не удалось загрузить превью"
      );
      setHtml(null);
    } finally {
      setLoading(false);
    }
  }, [template.preview_url, projectKey, token]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const dims = previewDimensions(template);

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className={clsx(
        "group relative flex w-full flex-col overflow-hidden rounded-lg border-2 text-left transition-all",
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/30"
          : "border-[#2a3344] hover:border-[#4b5563]"
      )}
    >
      {selected && (
        <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white shadow">
          ✓
        </span>
      )}

      <div className="relative h-[200px] overflow-hidden bg-[#0a0e14]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
            <p className="text-xs text-red-400">{error}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadPreview();
              }}
              className="rounded border border-[#2a3344] px-2 py-1 text-xs text-[#9ca3af] hover:bg-[#121820] hover:text-white"
            >
              Повторить
            </button>
          </div>
        )}

        {html && !loading && (
          <div
            className="pointer-events-none absolute left-0 top-0 origin-top-left overflow-hidden bg-white shadow-lg shadow-black/40"
            style={{
              width: dims.width,
              height: dims.height,
              transform: `scale(${dims.scale})`,
            }}
          >
            <iframe
              title={`preview-${template.id}`}
              sandbox="allow-same-origin"
              srcDoc={html}
              className="h-full w-full border-0 bg-white"
            />
          </div>
        )}
      </div>

      <div className="border-t border-[#2a3344] bg-[#121820] px-3 py-2.5">
        <p className="text-sm font-medium text-[#e5e7eb]">{template.title}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {template.orientation && (
            <span className="rounded bg-[#1e2633] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#9ca3af]">
              {ORIENTATION_LABELS[template.orientation] ?? template.orientation}
            </span>
          )}
          {template.theme && (
            <span
              className={clsx(
                "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                template.theme === "dark"
                  ? "bg-[#0a0e14] text-[#c5cdd8]"
                  : "bg-white/10 text-[#e5e7eb]"
              )}
            >
              {THEME_LABELS[template.theme] ?? template.theme}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
