// app/login/page.tsx
import LoginForm from "@/components/ui/login-form";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[420px] flex-col p-4 md:-mt-10">
        <Suspense
          fallback={
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}