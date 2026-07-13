"use client";

import { useState } from "react";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminCredentialsBar() {
  const { token, projectKey, setCredentials, clear, isReady } = useAdminAuthStore();
  const [localToken, setLocalToken] = useState(token);
  const [localKey, setLocalKey] = useState(projectKey);
  const [open, setOpen] = useState(!isReady());

  const save = () => {
    setCredentials(localToken.trim(), localKey.trim());
    setOpen(false);
  };

  if (!open && isReady()) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-8 border border-green-200 bg-green-50 px-4 py-2 text-sm">
        <span className="text-green-800">
          Auth: JWT + <code className="text-xs">x-project-key</code> заданы
          {projectKey ? (
            <span className="ml-2 text-green-700/80">
              ({projectKey.slice(0, 12)}…)
            </span>
          ) : null}
        </span>
        <button
          type="button"
          className="text-secondary underline"
          onClick={() => {
            setLocalToken(token);
            setLocalKey(projectKey);
            setOpen(true);
          }}
        >
          Изменить
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-12 border border-amber-200 bg-amber-50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-dark">
        Admin credentials (JWT + x-project-key)
      </h3>
      <p className="mb-3 text-xs text-gray-600">
        Без <code>x-project-key</code> tenant не переключится — данные будут не те.
        Base: <code>{process.env.NEXT_PUBLIC_API_URL || "https://pfp-api.bank-future.com/api"}</code>
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label="Admin JWT"
          type="password"
          value={localToken}
          onChange={(e) => setLocalToken(e.target.value)}
          placeholder="Bearer token без префикса"
        />
        <Input
          label="x-project-key"
          value={localKey}
          onChange={(e) => setLocalKey(e.target.value)}
          placeholder="pk_..."
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" onClick={save} disabled={!localToken.trim() || !localKey.trim()}>
          Сохранить
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            clear();
            setLocalToken("");
            setLocalKey("");
          }}
        >
          Очистить
        </Button>
      </div>
    </div>
  );
}
