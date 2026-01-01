// app/erfassen/page.tsx
// Kombinierte Gesundheitsdaten-Erfassungsseite
// Ermöglicht das Erfassen aller Gesundheitsdaten auf einer Seite durch Scrollen

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LogIn, Activity, Utensils, HeartPulse, Scale, Bed, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BloodPressureForm } from "@/components/health/BloodPressureForm";
import { CalorieEntryForm } from "@/components/health/CalorieEntryForm";
import { VitalFunctionsForm } from "@/components/health/VitalFunctionsForm";
import { BodyCompositionForm } from "@/components/health/BodyCompositionForm";
import { SleepForm } from "@/components/health/SleepForm";
import { useSWRConfig } from "swr";

// Abschnitts-Konfiguration mit Icons und Farben
const SECTIONS = [
  { 
    id: "blutdruck", 
    label: "Blutdruck", 
    icon: Activity, 
    color: "from-purple-500 to-violet-600",
    description: "Systolisch/Diastolisch und Puls"
  },
  { 
    id: "kalorien", 
    label: "Ernährung", 
    icon: Utensils, 
    color: "from-orange-500 to-amber-600",
    description: "Mahlzeiten und Kalorien"
  },
  { 
    id: "vitalfunktionen", 
    label: "Vitalfunktionen", 
    icon: HeartPulse, 
    color: "from-red-500 to-rose-600",
    description: "Herzfrequenz, Atmung, SpO2"
  },
  { 
    id: "koerper", 
    label: "Körper", 
    icon: Scale, 
    color: "from-blue-500 to-cyan-600",
    description: "Gewicht und Körperwerte"
  },
  { 
    id: "schlaf", 
    label: "Schlaf", 
    icon: Bed, 
    color: "from-indigo-500 to-purple-600",
    description: "Schlafdauer und Qualität"
  },
];

export default function ErfassenPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const { mutate } = useSWRConfig();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll-to-top Button anzeigen
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDataSaved = () => {
    // Globales Refresh der Gesundheitsdaten
    if (userId) {
      mutate(`/api/health?userId=${userId}`);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p className="text-muted-foreground">Sitzung wird geladen...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !userId) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <LogIn className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Bitte melde dich an</h3>
              <p className="text-muted-foreground">
                Um Gesundheitsdaten zu erfassen, musst du angemeldet sein.
              </p>
              <Button asChild>
                <Link href="/login">Zum Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-8 pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Gesundheitsdaten erfassen
        </h1>
        <p className="text-muted-foreground">
          Erfasse alle deine Gesundheitsdaten auf einer Seite durch Scrollen
        </p>
      </div>

      {/* Schnellnavigation */}
      <div className="sticky top-4 z-10">
        <Card className="border border-border/50 bg-card/95 backdrop-blur-lg shadow-lg">
          <CardContent className="py-3">
            <div className="flex flex-wrap justify-center gap-2">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant="outline"
                    size="sm"
                    onClick={() => scrollToSection(section.id)}
                    className="rounded-full border-border hover:border-primary/50 transition-all"
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">{section.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blutdruck Sektion */}
      <section id="blutdruck" className="scroll-mt-24">
        <SectionHeader
          icon={Activity}
          label="Blutdruck"
          description="Systolisch/Diastolisch und Puls erfassen"
          color="from-purple-500 to-violet-600"
        />
        <BloodPressureForm userId={userId} />
      </section>

      {/* Ernährung Sektion */}
      <section id="kalorien" className="scroll-mt-24">
        <SectionHeader
          icon={Utensils}
          label="Ernährung"
          description="Mahlzeiten und Kalorien tracken"
          color="from-orange-500 to-amber-600"
        />
        <CalorieEntryForm userId={userId} onEntrySaved={handleDataSaved} />
      </section>

      {/* Vitalfunktionen Sektion */}
      <section id="vitalfunktionen" className="scroll-mt-24">
        <SectionHeader
          icon={HeartPulse}
          label="Vitalfunktionen"
          description="Herzfrequenz, Atemfrequenz, Sauerstoffsättigung"
          color="from-red-500 to-rose-600"
        />
        <VitalFunctionsForm userId={userId} onEntrySaved={handleDataSaved} />
      </section>

      {/* Körperzusammensetzung Sektion */}
      <section id="koerper" className="scroll-mt-24">
        <SectionHeader
          icon={Scale}
          label="Körperzusammensetzung"
          description="Gewicht, BMI, Muskelmasse, Körperfett"
          color="from-blue-500 to-cyan-600"
        />
        <BodyCompositionForm userId={userId} onEntrySaved={handleDataSaved} />
      </section>

      {/* Schlaf Sektion */}
      <section id="schlaf" className="scroll-mt-24">
        <SectionHeader
          icon={Bed}
          label="Schlaf & Regeneration"
          description="Schlafdauer erfassen"
          color="from-indigo-500 to-purple-600"
        />
        <SleepForm userId={userId} onEntrySaved={handleDataSaved} />
      </section>

      {/* Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
          aria-label="Nach oben scrollen"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// Abschnitts-Header Komponente
function SectionHeader({ 
  icon: Icon, 
  label, 
  description, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  description: string; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${color} shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">{label}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
