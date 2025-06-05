# 🩺 Vital+

**Vital+** ist eine moderne Webanwendung zur Erfassung, Visualisierung und Verwaltung von Gesundheits- und Vitaldaten. Sie richtet sich an Nutzer:innen, die ihre körperliche Gesundheit im Blick behalten und auf smarte Weise analysieren möchten.

## 🚀 Features

- ✅ Benutzer-Login via **NextAuth.js** (Credentials Provider)
- 📊 Übersichtliches Dashboard für Vitaldaten
- 🌙 Dark Mode Unterstützung
- 🗂 Sidebar-Navigation
- 📥 Integration einer PostgreSQL-Datenbank (Prisma)
- 💉 Erweiterbar für Smartwatch-/Wearable-Integrationen
- ⚙️ Modulare und erweiterbare Komponentenstruktur

## 🛠️ Tech Stack

- **Next.js** – App Router, moderne Web-Architektur
- **Tailwind CSS** – Utility-first Styling
- **ShadCN UI** – Schöne, zugängliche UI-Komponenten
- **NextAuth.js** – Sichere Authentifizierung
- **PostgreSQL** – Datenbank für Vitaldaten
- **TypeScript** – Typensicherheit im gesamten Projekt

## 📦 Installation

```bash
# Repository klonen
git clone https://github.com/thomas7899/vital+.git
cd vitalcheck

# Abhängigkeiten installieren
pnpm install

# .env Datei anlegen und konfigurieren
cp .env.example .env

# Entwicklungsserver starten
pnpm dev

🔐 .env Konfiguration

POSTGRES_URL=postgresql://user:password@host:port/database
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

📁 Projektstruktur

.
├── components/
├── lib/
├── app/
│   ├── login/
│   ├── gesundheit/
│   └── api/
├── hooks/
└── ...
