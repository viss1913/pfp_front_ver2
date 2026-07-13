"use client";

type HtmlPreviewProps = {
  html?: string | null;
  title?: string;
  className?: string;
  height?: number | string;
};

export default function HtmlPreview({
  html,
  title = "Preview",
  className = "",
  height = 420,
}: HtmlPreviewProps) {
  if (!html) {
    return (
      <div
        className={`flex items-center justify-center rounded-8 border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 ${className}`}
        style={{ minHeight: height }}
      >
        Нет HTML для превью
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-8 border border-gray-200 bg-white ${className}`}>
      <div className="border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500">
        {title}
      </div>
      <iframe
        title={title}
        sandbox=""
        srcDoc={html}
        className="w-full bg-white"
        style={{ height, border: 0 }}
      />
    </div>
  );
}
