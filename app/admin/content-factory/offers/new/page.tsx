"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/admin/Toast";
import TemplatePicker from "@/components/admin/content-factory/TemplatePicker";
import { getApiErrorMessage, offersApi } from "@/lib/content-factory-api";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { DEFAULT_TEMPLATE_ID, clampPageCount, DEFAULT_PAGE_COUNT, MAX_PAGE_COUNT, MIN_PAGE_COUNT } from "@/types/content-factory";

export default function NewOfferPage() {
  const router = useRouter();
  const { token, projectKey, isReady } = useAdminAuthStore();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] =
    useState(DEFAULT_TEMPLATE_ID);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [kind, setKind] = useState("product");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Оформить");
  const [expiresAt, setExpiresAt] = useState("");
  const [pageCount, setPageCount] = useState(String(DEFAULT_PAGE_COUNT));

  const willGenerate = brief.trim().length > 0;
  const canSubmit = Boolean(title.trim() && selectedTemplateId);
  const parsedPageCount = clampPageCount(Number(pageCount));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady()) {
      toast("Укажите JWT и x-project-key", "error");
      return;
    }
    if (!title.trim()) {
      toast("Укажите название", "error");
      return;
    }
    if (!selectedTemplateId) {
      toast("Выберите базовый шаблон A4", "error");
      return;
    }

    setSubmitting(true);
    try {
      const created = await offersApi.create(
        {
          title: title.trim(),
          brief: brief.trim() || null,
          base_template_id: selectedTemplateId,
          page_count: parsedPageCount,
          kind: kind.trim() || "product",
          cta_url_base: ctaUrl.trim() || null,
          cta_label: ctaLabel.trim() || null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          generate: willGenerate,
        },
        projectKey,
        token
      );
      toast(
        willGenerate ? "Оффер создан, HTML готов" : "Черновик создан",
        "success"
      );
      router.push(`/admin/content-factory/offers/${created.id}`);
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {submitting && willGenerate && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f1419]/90 px-6 text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <p className="text-lg font-semibold text-white">
            AI генерирует страницу…
          </p>
          <p className="mt-2 max-w-md text-sm text-[#9ca3af]">
            Обычно 1–10 минут. Не закрывайте вкладку — после ответа откроется
            редактор.
          </p>
        </div>
      )}

      <div className="mb-6">
        <Link
          href="/admin/content-factory/offers"
          className="text-sm text-secondary hover:underline"
        >
          ← К списку офферов
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-dark">Новый оффер</h1>
        <p className="mt-1 text-sm text-gray-600">
          Выберите корпоративный шаблон Finam, затем задайте параметры оффера.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-6">
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-dark">
              Шаг 1. Базовый шаблон A4
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Шаблон задаёт ориентацию и тему. Контент правится в редакторе через
              чат.
            </p>
          </div>

          {isReady() ? (
            <TemplatePicker
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
              projectKey={projectKey}
              token={token}
            />
          ) : (
            <p className="text-sm text-amber-700">
              Укажите JWT и x-project-key в шапке, чтобы загрузить превью
              шаблонов.
            </p>
          )}
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-dark">
              Шаг 2. Параметры оффера
            </h2>
          </div>

          <Input
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Подушка безопасности"
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Brief
            </label>
            <textarea
              className="w-full rounded-8 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              rows={6}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Одна страница A4, продукт НСЖ, логотип в шапке, CTA внизу…"
            />
            <p className="mt-1 text-xs text-gray-500">
              {willGenerate
                ? "generate: true — полная генерация через IDE"
                : "Пустой brief → generate: false (шаблон без LLM)"}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              Страниц A4 ({MIN_PAGE_COUNT}–{MAX_PAGE_COUNT})
            </label>
            <input
              type="number"
              min={MIN_PAGE_COUNT}
              max={MAX_PAGE_COUNT}
              step={1}
              className="w-full rounded-8 border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              onBlur={() => setPageCount(String(parsedPageCount))}
            />
            <p className="mt-1 text-xs text-gray-500">
              Сколько A4-листов в одном HTML-документе (IDE constraints.page_count)
            </p>
          </div>
          <Input
            label="Kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            placeholder="product"
          />
          <Input
            label="CTA URL (опционально)"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://partner.example/offer"
          />
          <Input
            label="CTA label"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Оформить"
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-text">
              expires_at
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-8 border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            isLoading={submitting}
            disabled={!canSubmit}
          >
            {willGenerate ? "Создать и сгенерировать" : "Создать черновик"}
          </Button>
        </Card>
      </form>
    </div>
  );
}
