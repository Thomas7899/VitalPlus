import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { VitalPlusLogo } from "@/components/VitalPlusLogo";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
    <VitalPlusLogo />
    <h1 className="text-4xl font-bold text-gray-800 mt-4 mb-8">Willkommen bei Vital+</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
        <Link href="/user">
          <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-2">Benutzerbereich</h2>
              <p className="text-gray-600">Verwalte deine persönlichen Daten und Einstellungen.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/gesundheit">
          <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-2">Gesundheitsdaten</h2>
              <p className="text-gray-600">Behalte deinen Gesundheitszustand im Blick.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
