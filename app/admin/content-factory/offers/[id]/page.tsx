"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/admin/Toast";
import OfferEditorLayout from "@/components/admin/content-factory/OfferEditorLayout";
import OfferChatPanel from "@/components/admin/content-factory/OfferChatPanel";
import OfferHtmlPreview, {
  type PreviewViewport,
} from "@/components/admin/content-factory/OfferHtmlPreview";
import OfferMetaPanel from "@/components/admin/content-factory/OfferMetaPanel";
import { getApiErrorMessage, offersApi, templatesApi } from "@/lib/content-factory-api";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import type {
  ChatAttachment,
  ChatMessage,
  ContentOffer,
  MediaFileKind,
  SseProgressEvent,
} from "@/types/content-factory";

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64 || "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function guessMediaKind(file: File): MediaFileKind {
  if (file.type.startsWith("image/")) {
    if (/logo/i.test(file.name)) return "logo";
    if (/hero|banner/i.test(file.name)) return "hero";
    if (/icon/i.test(file.name)) return "icon";
    return "logo";
  }
  if (/\.(csv|json|xlsx?)$/i.test(file.name)) return "chart_data";
  return "other";
}

export default function OfferEditorPage() {
  const params = useParams();
  const id = Number(params?.id);
  const router = useRouter();
  const { token, projectKey, isReady } = useAdminAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [offer, setOffer] = useState<ContentOffer | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>(
    []
  );
  const [progressHistory, setProgressHistory] = useState<SseProgressEvent[]>([]);
  const [currentProgress, setCurrentProgress] = useState<SseProgressEvent | null>(
    null
  );
  const [viewport, setViewport] = useState<PreviewViewport>("a4");
  const [metaOpenHint, setMetaOpenHint] = useState(false);

  // meta form
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("product");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [brief, setBrief] = useState("");
  const [baseTemplateTitle, setBaseTemplateTitle] = useState<string | null>(null);

  const syncForm = (o: ContentOffer) => {
    setOffer(o);
    setTitle(o.title || "");
    setKind(o.kind || "product");
    setCtaUrl(o.cta_url_base || "");
    setCtaLabel(o.cta_label || "");
    setExpiresAt(toDatetimeLocal(o.expires_at));
    setBrief(o.brief || "");
  };

  const load = useCallback(
    async (sync = false) => {
      if (!isReady() || !id) return;
      setLoading(true);
      try {
        const o = await offersApi.get(id, projectKey, token, { sync });
        syncForm(o);
        try {
          const msgs = await offersApi.getChatMessages(id, projectKey, token);
          setMessages(msgs);
        } catch {
          setMessages([]);
        }
      } catch (err) {
        toast(getApiErrorMessage(err), "error");
      } finally {
        setLoading(false);
      }
    },
    [id, isReady, projectKey, token, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isReady() || !offer?.base_template_id) return;
    let cancelled = false;
    (async () => {
      try {
        const { templates } = await templatesApi.list(projectKey, token);
        if (cancelled) return;
        const match = templates.find((t) => t.id === offer.base_template_id);
        setBaseTemplateTitle(match?.title ?? offer.base_template_id ?? null);
      } catch {
        if (!cancelled) {
          setBaseTemplateTitle(offer.base_template_id ?? null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [offer?.base_template_id, isReady, projectKey, token]);

  const onSaveMeta = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const updated = await offersApi.patch(
        id,
        {
          title: title.trim(),
          kind: kind.trim() || "product",
          brief: brief.trim() || null,
          cta_url_base: ctaUrl.trim() || null,
          cta_label: ctaLabel.trim() || null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        },
        projectKey,
        token
      );
      syncForm(updated);
      toast("Настройки сохранены", "success");
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const onSendChat = async () => {
    const content = chatInput.trim();
    if (!content || !id || streaming) return;

    const attachments = [...pendingAttachments];
    const userMsg: ChatMessage = {
      role: "user",
      content,
      attachments: attachments.length ? attachments : undefined,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setPendingAttachments([]);
    setStreaming(true);
    setProgressHistory([]);
    setCurrentProgress(null);

    try {
      await offersApi.postChatMessageStream(
        id,
        {
          content,
          attachments: attachments.length ? attachments : undefined,
        },
        projectKey,
        token,
        {
          onProgress: (p) => {
            setCurrentProgress(p);
            setProgressHistory((prev) => [...prev, p]);
          },
          onResult: (r) => {
            if (r.html) {
              setOffer((prev) =>
                prev ? { ...prev, generated_html: r.html } : prev
              );
            }
            if (r.assistant_message) {
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: r.assistant_message || "",
                  created_at: new Date().toISOString(),
                },
              ]);
            }
          },
          onError: (e) => {
            toast(e.message || e.error || "Ошибка генерации", "error");
          },
          onDone: () => {
            setCurrentProgress(null);
          },
        }
      );

      // refresh offer + history for consistency
      try {
        const o = await offersApi.get(id, projectKey, token, { sync: true });
        syncForm(o);
        const msgs = await offersApi.getChatMessages(id, projectKey, token);
        if (msgs.length) setMessages(msgs);
      } catch {
        /* keep local state */
      }
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
      // fallback non-stream once
      try {
        const res = await offersApi.postChatMessage(
          id,
          {
            content,
            attachments: attachments.length ? attachments : undefined,
          },
          projectKey,
          token
        );
        if (res.offer) syncForm(res.offer);
        else if (res.preview_html) {
          setOffer((prev) =>
            prev ? { ...prev, generated_html: res.preview_html } : prev
          );
        }
        if (res.messages?.length) setMessages(res.messages);
        else if (res.assistant_message) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: res.assistant_message || "" },
          ]);
        }
      } catch (fallbackErr) {
        toast(getApiErrorMessage(fallbackErr), "error");
      }
    } finally {
      setStreaming(false);
      setProgressHistory([]);
      setCurrentProgress(null);
    }
  };

  const onAttachFiles = async (files: FileList | null) => {
    if (!files?.length || !id) return;
    setBusy(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => ({
          name: file.name,
          content_base64: await fileToBase64(file),
          content_type: file.type || "application/octet-stream",
          kind: guessMediaKind(file),
        }))
      );
      const res = await offersApi.uploadMedia(
        id,
        { files: uploads },
        projectKey,
        token
      );
      const next: ChatAttachment[] = (res.files || []).map((f) => ({
        ref: f.ref || `media:${f.name}`,
        role: f.kind || "logo",
        instruction: "использовать во вёрстке",
      }));
      setPendingAttachments((prev) => [...prev, ...next]);
      toast(`Загружено: ${next.length} файл(ов)`, "success");
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onPublish = async () => {
    if (!offer?.generated_html) {
      toast("Сначала получите HTML через чат", "error");
      return;
    }
    setBusy(true);
    try {
      const result = await offersApi.publish(id, projectKey, token);
      syncForm(result);
      toast("Опубликовано в каталог", "success");
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const onUnpublish = async () => {
    setBusy(true);
    try {
      const result = await offersApi.unpublish(id, projectKey, token);
      syncForm(result);
      toast("Снято с публикации", "success");
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const onArchive = async () => {
    if (!confirm("Архивировать оффер?")) return;
    setBusy(true);
    try {
      await offersApi.archive(id, projectKey, token);
      toast("Архивировано", "success");
      router.push("/admin/content-factory/offers");
    } catch (err) {
      toast(getApiErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  if (!isReady()) {
    return (
      <p className="p-4 text-sm text-amber-800">
        Укажите JWT и x-project-key в шапке.
      </p>
    );
  }

  if (loading) {
    return <p className="p-4 text-sm text-gray-500">Загрузка редактора…</p>;
  }

  if (!offer) {
    return (
      <div className="p-4">
        <p className="mb-2 text-sm text-red-600">Оффер не найден</p>
        <Link
          href="/admin/content-factory/offers"
          className="text-secondary underline"
        >
          К списку
        </Link>
      </div>
    );
  }

  const hasHtml = Boolean(offer.generated_html);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,.pdf,.csv,.json,.svg"
        onChange={(e) => onAttachFiles(e.target.files)}
      />

      <OfferEditorLayout
        title={offer.title}
        status={offer.status}
        hasHtml={hasHtml}
        busy={busy || streaming}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onArchive={onArchive}
        onOpenMeta={() => setMetaOpenHint(true)}
        onSync={() => load(true)}
        childrenChat={
          <OfferChatPanel
            messages={messages}
            progressHistory={progressHistory}
            currentProgress={currentProgress}
            pendingAttachments={pendingAttachments}
            input={chatInput}
            onInputChange={setChatInput}
            onSend={onSendChat}
            onAttachClick={() => fileInputRef.current?.click()}
            onRemoveAttachment={(ref) =>
              setPendingAttachments((prev) => prev.filter((a) => a.ref !== ref))
            }
            streaming={streaming}
            disabled={busy}
          />
        }
        childrenPreview={
          <OfferHtmlPreview
            html={offer.generated_html}
            viewport={viewport}
            onViewportChange={setViewport}
          />
        }
        childrenMeta={
          <OfferMetaPanel
            title={title}
            kind={kind}
            ctaUrl={ctaUrl}
            ctaLabel={ctaLabel}
            expiresAt={expiresAt}
            brief={brief}
            baseTemplateId={offer.base_template_id}
            baseTemplateTitle={baseTemplateTitle}
            pageCount={offer.page_count}
            onTitleChange={setTitle}
            onKindChange={setKind}
            onCtaUrlChange={setCtaUrl}
            onCtaLabelChange={setCtaLabel}
            onExpiresAtChange={setExpiresAt}
            onBriefChange={setBrief}
            onSave={onSaveMeta}
            saving={busy}
            forceOpen={metaOpenHint}
          />
        }
      />
    </>
  );
}
