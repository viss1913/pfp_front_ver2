"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ToastProvider } from "@/components/admin/Toast";
import AdminCredentialsBar from "@/components/admin/AdminCredentialsBar";

const NAV = [
  {
    href: "/admin/content-factory/offers",
    label: "Офферы",
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditor =
    Boolean(pathname?.match(/^\/admin\/content-factory\/offers\/\d+/)) &&
    !pathname?.endsWith("/new");

  return (
    <ToastProvider>
      <div className={clsx("min-h-screen", isEditor ? "bg-[#0f1419]" : "bg-light")}>
        <header
          className={clsx(
            "border-b",
            isEditor
              ? "border-[#2a3344] bg-[#1a1f2e]"
              : "border-gray-200 bg-white"
          )}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className={clsx(
                  "text-lg font-semibold",
                  isEditor ? "text-white" : "text-dark"
                )}
              >
                PFP Admin
              </Link>
              <nav className="hidden items-center gap-1 sm:flex">
                <span
                  className={clsx(
                    "mr-2 text-xs font-medium uppercase tracking-wide",
                    isEditor ? "text-[#6b7280]" : "text-gray-400"
                  )}
                >
                  Фабрика контента
                </span>
                {NAV.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "rounded-8 px-3 py-2 text-sm font-medium transition-colors",
                        isEditor
                          ? active
                            ? "bg-[#2a3344] text-white"
                            : "text-[#9ca3af] hover:bg-[#121820] hover:text-white"
                          : active
                            ? "bg-primary/30 text-dark"
                            : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <Link
              href="/"
              className={clsx(
                "text-sm hover:underline",
                isEditor ? "text-indigo-300" : "text-secondary"
              )}
            >
              ← На главную
            </Link>
          </div>
          {/* mobile nav */}
          <div
            className={clsx(
              "flex gap-2 border-t px-4 py-2 sm:hidden",
              isEditor ? "border-[#2a3344]" : "border-gray-100"
            )}
          >
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-8 px-3 py-1.5 text-sm font-medium",
                    isEditor
                      ? active
                        ? "bg-[#2a3344] text-white"
                        : "bg-[#121820] text-[#9ca3af]"
                      : active
                        ? "bg-primary/30 text-dark"
                        : "bg-gray-100 text-gray-600"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          {!isEditor && (
            <div className="mx-auto max-w-7xl px-4 pb-3">
              <AdminCredentialsBar />
            </div>
          )}
          {isEditor && (
            <div className="border-t border-[#2a3344] px-4 py-2">
              <AdminCredentialsBar />
            </div>
          )}
        </header>

        <main
          className={clsx(
            isEditor ? "p-0" : "mx-auto max-w-7xl px-4 py-6"
          )}
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
