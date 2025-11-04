import { auth } from "@/lib/auth";

export async function DashboardHeader() {
  const session = await auth();
  const userName = session?.user?.name || "Nutzer";

  return (
    <div className="flex flex-col items-center text-center space-y-2 mb-8">
      <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Willkommen zurück, {userName}!
      </h1>
      <p className="text-slate-600 text-lg">
        Hier ist deine Gesundheitsübersicht für heute
      </p>
    </div>
  );
}
