import Link from "next/link";
import Card from "@/components/ui/Card";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-dark">Админ-панель</h1>
      <p className="mb-6 text-sm text-gray-600">
        API Immers:{" "}
        <code className="text-xs">https://pfp-api.bank-future.com/api</code>
        . Спека:{" "}
        <code className="text-xs">
          docs/content-factory/openapi/OPENAPI_SPEC.yaml
        </code>
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/content-factory/offers">
          <Card className="h-full transition-shadow hover:shadow-md">
            <h2 className="mb-1 text-lg font-semibold">Фабрика контента</h2>
            <p className="text-sm text-gray-600">
              IDE-редактор: brief + чат с AI, preview A4, publish в каталог
              агентов
            </p>
          </Card>
        </Link>
        <Link href="/admin/content-factory/offers/new">
          <Card className="h-full transition-shadow hover:shadow-md">
            <h2 className="mb-1 text-lg font-semibold">Новый оффер</h2>
            <p className="text-sm text-gray-600">
              Title + brief → генерация HTML через IDE
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
