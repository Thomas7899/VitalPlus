// components/ui/login-form.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { authenticate } from "@/lib/actions";
import { lusitana } from "@/components/ui/fonts";
import { Button } from "./button";
import {
  AtSymbolIcon,
  KeyIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-[0_0_60px_rgba(168,85,247,0.25)] backdrop-blur-xl">
        <div className="mb-6 text-center">
          <h1
            className={`${lusitana.className} text-3xl font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent`}
          >
            Willkommen zurück
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Melde dich an, um deine Gesundheitsübersicht zu sehen.
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          <div>
            <label
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-300"
              htmlFor="email"
            >
              E‑Mail
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <AtSymbolIcon className="h-4 w-4 text-slate-400" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="max.mueller@example.com"
                className="block w-full rounded-2xl border border-slate-700 bg-slate-900/60 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none ring-0 transition focus:border-purple-400 focus:bg-slate-900 focus:shadow-[0_0_25px_rgba(168,85,247,0.35)]"
              />
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-300"
              htmlFor="password"
            >
              Passwort
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <KeyIcon className="h-4 w-4 text-slate-400" />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="block w-full rounded-2xl border border-slate-700 bg-slate-900/60 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none ring-0 transition focus:border-purple-400 focus:bg-slate-900 focus:shadow-[0_0_25px_rgba(168,85,247,0.35)]"
              />
            </div>
          </div>

          <input type="hidden" name="redirectTo" value={callbackUrl} />

          <Button
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-sm font-semibold shadow-[0_10px_40px_rgba(59,130,246,0.45)] hover:brightness-110"
            aria-disabled={isPending}
          >
            Einloggen
            <ArrowRightIcon className="ml-auto h-4 w-4 text-slate-50" />
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900/80 px-3 text-[10px] tracking-[0.18em] text-slate-400">
              Oder Schnellzugriff
            </span>
          </div>
        </div>

        <form action={formAction}>
          <input type="hidden" name="email" value="max.mueller@example.com" />
          <input type="hidden" name="password" value="password123" />
          <input type="hidden" name="redirectTo" value={callbackUrl} />
          <Button
            variant="outline"
            className="w-full rounded-2xl border-slate-700 bg-slate-900/60 text-sm font-medium text-slate-100 hover:border-purple-400 hover:bg-slate-900"
            aria-disabled={isPending}
          >
            Demo‑Login (1‑Klick)
          </Button>
        </form>

        <div
          className="mt-3 flex min-h-[1.5rem] items-center space-x-2 text-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-4 w-4 text-red-400" />
              <p className="text-xs text-red-400">{errorMessage}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}