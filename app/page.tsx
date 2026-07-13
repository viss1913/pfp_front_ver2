import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-semibold mb-8">
          Личный кабинет финансового консультанта
        </h1>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/question?create"
            className="inline-block bg-primary text-dark px-8 py-4 rounded-8 font-semibold hover:opacity-90 transition-opacity"
          >
            Создать новый клиент
          </Link>
          <Link
            href="/admin/content-factory/offers"
            className="inline-block bg-secondary text-white px-8 py-4 rounded-8 font-semibold hover:opacity-90 transition-opacity"
          >
            Фабрика контента (admin)
          </Link>
        </div>
      </div>
    </main>
  );
}
