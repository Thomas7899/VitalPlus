export function DashboardHeader() {
  return (
    <div className="flex flex-col space-y-2 mb-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Willkommen zurück!
      </h1>
      <p className="text-slate-600 text-lg">
        Hier ist deine Gesundheitsübersicht für heute
      </p>
    </div>
  );
}
