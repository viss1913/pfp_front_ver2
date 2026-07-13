"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import type { OfferStatus } from "@/types/content-factory";
import { StatusBadge } from "@/components/admin/StatusBadge";

type Props = {
  title: string;
  status: OfferStatus;
  hasHtml: boolean;
  busy: boolean;
  childrenChat: ReactNode;
  childrenPreview: ReactNode;
  childrenMeta?: ReactNode;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
  onOpenMeta?: () => void;
  onSync?: () => void;
};

export default function OfferEditorLayout({
  title,
  status,
  hasHtml,
  busy,
  childrenChat,
  childrenPreview,
  childrenMeta,
  onPublish,
  onUnpublish,
  onArchive,
  onOpenMeta,
  onSync,
}: Props) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-[520px] flex-col bg-[#0f1419] text-[#e5e7eb]">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#2a3344] bg-[#1a1f2e] px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin/content-factory/offers"
            className="shrink-0 text-sm text-[#9ca3af] hover:text-white"
          >
            ← Офферы
          </Link>
          <StatusBadge status={status} variant="dark" />
          <h1 className="truncate text-sm font-semibold sm:text-base" title={title}>
            {title || "Без названия"}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onSync && (
            <button
              type="button"
              onClick={onSync}
              disabled={busy}
              className="rounded-lg border border-[#2a3344] px-3 py-1.5 text-xs font-medium text-[#9ca3af] hover:bg-[#121820] hover:text-white disabled:opacity-40"
            >
              Sync IDE
            </button>
          )}
          {onOpenMeta && (
            <button
              type="button"
              onClick={onOpenMeta}
              className="rounded-lg border border-[#2a3344] px-3 py-1.5 text-xs font-medium text-[#c5cdd8] hover:bg-[#121820] sm:text-sm"
            >
              Настройки CTA
            </button>
          )}
          {status === "published" ? (
            <button
              type="button"
              onClick={onUnpublish}
              disabled={busy}
              className="rounded-lg border border-[#2a3344] px-3 py-1.5 text-sm font-semibold text-[#e5e7eb] hover:bg-[#121820] disabled:opacity-40"
            >
              Снять с публикации
            </button>
          ) : (
            <button
              type="button"
              onClick={onPublish}
              disabled={busy || !hasHtml || status === "archived"}
              className={clsx(
                "rounded-lg px-4 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40",
                "bg-[#111827] text-white hover:bg-black border border-[#374151]"
              )}
              title={!hasHtml ? "Нужен generated_html" : undefined}
            >
              Опубликовать
            </button>
          )}
          <button
            type="button"
            onClick={onArchive}
            disabled={busy || status === "archived"}
            className="rounded-lg px-2 py-1.5 text-xs text-red-400 hover:bg-red-950/40 disabled:opacity-40"
          >
            Архив
          </button>
        </div>
      </header>

      {/* Split 45/55 */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,45%)_minmax(0,55%)]">
        <section className="min-h-[280px] border-b border-[#2a3344] lg:min-h-0 lg:border-b-0 lg:border-r">
          {childrenChat}
        </section>
        <section className="min-h-[320px] lg:min-h-0">{childrenPreview}</section>
      </div>

      {childrenMeta}
    </div>
  );
}
