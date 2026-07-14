"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage, templatesApi } from "@/lib/content-factory-api";
import {
  DEFAULT_TEMPLATE_ID,
  type ContentFactoryTemplate,
  type TemplateOrientation,
} from "@/types/content-factory";
import TemplatePreviewCard from "./TemplatePreviewCard";

type Props = {
  selectedTemplateId: string;
  onSelect: (id: string) => void;
  projectKey: string;
  token: string;
};

function sortTemplates(templates: ContentFactoryTemplate[]) {
  const order: Record<string, number> = {
    "portrait-light": 0,
    "portrait-dark": 1,
    "landscape-light": 2,
    "landscape-dark": 3,
  };

  return [...templates].sort((a, b) => {
    const keyA = `${a.orientation ?? ""}-${a.theme ?? ""}`;
    const keyB = `${b.orientation ?? ""}-${b.theme ?? ""}`;
    return (order[keyA] ?? 99) - (order[keyB] ?? 99);
  });
}

function groupByOrientation(templates: ContentFactoryTemplate[]) {
  const sorted = sortTemplates(templates);
  const portrait = sorted.filter((t) => t.orientation === "portrait");
  const landscape = sorted.filter((t) => t.orientation === "landscape");
  return { portrait, landscape };
}

export default function TemplatePicker({
  selectedTemplateId,
  onSelect,
  projectKey,
  token,
}: Props) {
  const [templates, setTemplates] = useState<ContentFactoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const { templates: list } = await templatesApi.list(projectKey, token);
      setTemplates(list);
      if (list.length && !list.some((t) => t.id === selectedTemplateId)) {
        const fallback =
          list.find((t) => t.id === DEFAULT_TEMPLATE_ID) ?? list[0];
        onSelect(fallback.id);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectKey, token]);

  const groups = useMemo(() => groupByOrientation(templates), [templates]);

  const renderRow = (
    label: string,
    orientation: TemplateOrientation,
    items: ContentFactoryTemplate[]
  ) => (
    <div key={orientation}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <TemplatePreviewCard
            key={t.id}
            template={t}
            selected={selectedTemplateId === t.id}
            onSelect={onSelect}
            projectKey={projectKey}
            token={token}
          />
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
        <span className="ml-3 text-sm text-gray-500">Загрузка шаблонов…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={loadTemplates}
          className="mt-2 text-xs font-medium underline hover:no-underline"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!templates.length) {
    return (
      <p className="text-sm text-gray-500">Шаблоны не найдены на backend.</p>
    );
  }

  return (
    <div className="space-y-5">
      {groups.portrait.length > 0 &&
        renderRow("A4 вертикально", "portrait", groups.portrait)}
      {groups.landscape.length > 0 &&
        renderRow("A4 горизонтально", "landscape", groups.landscape)}
    </div>
  );
}
