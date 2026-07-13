"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

type Props = {
  title: string;
  kind: string;
  ctaUrl: string;
  ctaLabel: string;
  expiresAt: string;
  brief: string;
  onTitleChange: (v: string) => void;
  onKindChange: (v: string) => void;
  onCtaUrlChange: (v: string) => void;
  onCtaLabelChange: (v: string) => void;
  onExpiresAtChange: (v: string) => void;
  onBriefChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  forceOpen?: boolean;
};

const fieldClass =
  "w-full rounded-lg border border-[#2a3344] bg-[#0a0e14] px-3 py-2 text-sm text-[#e5e7eb] placeholder:text-[#6b7280] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function OfferMetaPanel({
  title,
  kind,
  ctaUrl,
  ctaLabel,
  expiresAt,
  brief,
  onTitleChange,
  onKindChange,
  onCtaUrlChange,
  onCtaLabelChange,
  onExpiresAtChange,
  onBriefChange,
  onSave,
  saving,
  forceOpen = false,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <div className="border-t border-[#2a3344] bg-[#0f1419]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-[#c5cdd8] hover:bg-[#121820]"
      >
        <span>▼ Настройки оффера</span>
        <span className="text-xs text-[#6b7280]">{open ? "свернуть" : "развернуть"}</span>
      </button>

      <div
        className={clsx(
          "grid gap-3 border-t border-[#2a3344] px-4 py-3 sm:grid-cols-2 lg:grid-cols-3",
          !open && "hidden"
        )}
      >
        <div>
          <label className="mb-1 block text-xs text-[#6b7280]">Title</label>
          <input
            className={fieldClass}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#6b7280]">Kind</label>
          <input
            className={fieldClass}
            value={kind}
            onChange={(e) => onKindChange(e.target.value)}
            placeholder="product"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#6b7280]">CTA URL</label>
          <input
            className={fieldClass}
            value={ctaUrl}
            onChange={(e) => onCtaUrlChange(e.target.value)}
            placeholder="https://partner.example/offer"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#6b7280]">CTA label</label>
          <input
            className={fieldClass}
            value={ctaLabel}
            onChange={(e) => onCtaLabelChange(e.target.value)}
            placeholder="Оформить"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#6b7280]">Срок публикации</label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={expiresAt}
            onChange={(e) => onExpiresAtChange(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs text-[#6b7280]">Brief</label>
          <textarea
            className={clsx(fieldClass, "min-h-[64px]")}
            rows={2}
            value={brief}
            onChange={(e) => onBriefChange(e.target.value)}
            placeholder="Краткое ТЗ (метаданные; правки — через чат)"
          />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-[#1e2633] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a3344] disabled:opacity-50"
          >
            {saving ? "Сохранение…" : "Сохранить настройки"}
          </button>
        </div>
      </div>
    </div>
  );
}
