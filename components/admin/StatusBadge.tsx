"use client";

import { clsx } from "clsx";
import type { OfferStatus } from "@/types/content-factory";

const STATUS_LABEL: Record<OfferStatus, string> = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "Архив",
};

export function StatusBadge({
  status,
  variant = "light",
}: {
  status: OfferStatus;
  variant?: "light" | "dark";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "light" && {
          "bg-amber-100 text-amber-900": status === "draft",
          "bg-green-100 text-green-800": status === "published",
          "bg-orange-100 text-orange-800": status === "archived",
        },
        variant === "dark" && {
          "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30":
            status === "draft",
          "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30":
            status === "published",
          "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30":
            status === "archived",
        }
      )}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function ExpiringBadge({ expiresAt }: { expiresAt?: string | null }) {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  if (Number.isNaN(exp)) return null;
  const days = (exp - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0 || days >= 7) return null;
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
      Скоро истекает
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      )}
    >
      {active ? "Да" : "Нет"}
    </span>
  );
}
