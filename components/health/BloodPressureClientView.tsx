"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BloodPressureForm } from "@/components/health/BloodPressureForm";
import { BloodPressureHistory } from "@/components/health/BloodPressureHistory";

export function BloodPressureClientView() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <p>Sitzung wird geladen...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !userId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <LogIn className="h-12 w-12 text-slate-400" />
            <h3 className="text-xl font-semibold">Bitte melden Sie sich an</h3>
            <p className="text-muted-foreground">
              Um Ihre Blutdruckdaten zu sehen und zu verwalten, müssen Sie
              angemeldet sein.
            </p>
            <Button asChild>
              <Link href="/login">Zum Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <BloodPressureForm userId={userId} />
      <BloodPressureHistory userId={userId} />
    </>
  );
}