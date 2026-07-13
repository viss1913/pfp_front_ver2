"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { ExpiringBadge, StatusBadge } from "@/components/admin/StatusBadge";
import { useToast } from "@/components/admin/Toast";
import { getApiErrorMessage, offersApi } from "@/lib/content-factory-api";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import type { ContentOffer, OfferStatus } from "@/types/content-factory";
import { clsx } from "clsx";

const FILTERS: { value: OfferStatus | ""; label: string }[] = [
  { value: "", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "published", label: "Опубликованные" },
  { value: "archived", label: "Архив" },
];

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU");
  } catch {
    return iso;
  }
}

export default function OffersListPage() {
  const { token, projectKey, isReady } = useAdminAuthStore();
  const { toast } = useToast();
  const [status, setStatus] = useState<OfferStatus | "">("");
  const [items, setItems] = useState<ContentOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!isReady()) return;
    setLoading(true);
    try {
      const data = await offersApi.list(projectKey, token, status);
      setItems(data);
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }, [isReady, projectKey, token, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const onPublish = async (o: ContentOffer) => {
    if (!o.generated_html) {
      toast("Нет HTML — откройте редактор и сгенерируйте через чат", "error");
      return;
    }
    setBusyId(o.id);
    try {
      await offersApi.publish(o.id, projectKey, token);
      toast("Опубликовано", "success");
      await load();
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const onUnpublish = async (o: ContentOffer) => {
    setBusyId(o.id);
    try {
      await offersApi.unpublish(o.id, projectKey, token);
      toast("Снято с публикации", "success");
      await load();
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const onArchive = async (o: ContentOffer) => {
    if (!confirm(`Архивировать «${o.title}»?`)) return;
    setBusyId(o.id);
    try {
      await offersApi.archive(o.id, projectKey, token);
      toast("В архиве", "success");
      await load();
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-dark">Офферы</h1>
          <p className="text-sm text-gray-600">
            Brief + чат с AI → preview A4 → publish в каталог агентов
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={load} disabled={!isReady() || loading}>
            Обновить
          </Button>
          <Link href="/admin/content-factory/offers/new">
            <Button disabled={!isReady()}>+ Создать оффер</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setStatus(f.value)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              status === f.value
                ? "bg-secondary text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!isReady() && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">
            Укажите JWT и x-project-key выше, чтобы загрузить список.
          </p>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Загрузка…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  <p className="mb-2 font-medium text-gray-700">Нет офферов</p>
                  <p className="mx-auto max-w-md text-sm">
                    Создайте первый оффер — опишите продукт в brief, AI соберёт
                    A4-страницу
                  </p>
                  <Link
                    href="/admin/content-factory/offers/new"
                    className="mt-3 inline-block text-secondary hover:underline"
                  >
                    + Создать оффер
                  </Link>
                </td>
              </tr>
            )}
            {!loading &&
              items.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-gray-100 hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                  <td className="px-4 py-3 font-medium">
                    {o.title}
                    <ExpiringBadge expiresAt={o.expires_at} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.kind || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(o.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(o.published_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/admin/content-factory/offers/${o.id}`}
                        className="text-secondary hover:underline"
                      >
                        Открыть
                      </Link>
                      {o.status === "draft" && (
                        <button
                          type="button"
                          className="text-xs text-green-700 hover:underline disabled:opacity-40"
                          disabled={busyId === o.id}
                          onClick={() => onPublish(o)}
                        >
                          Publish
                        </button>
                      )}
                      {o.status === "published" && (
                        <button
                          type="button"
                          className="text-xs text-gray-600 hover:underline disabled:opacity-40"
                          disabled={busyId === o.id}
                          onClick={() => onUnpublish(o)}
                        >
                          Unpublish
                        </button>
                      )}
                      {o.status !== "archived" && (
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline disabled:opacity-40"
                          disabled={busyId === o.id}
                          onClick={() => onArchive(o)}
                        >
                          Архив
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
