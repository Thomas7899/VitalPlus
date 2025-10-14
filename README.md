# 🩺 Vital+

**Vital+** ist eine moderne Webanwendung zur Erfassung, Visualisierung und Verwaltung von Gesundheits- und Vitaldaten. Sie richtet sich an Nutzer:innen, die ihre körperliche Gesundheit im Blick behalten und auf smarte Weise analysieren möchten.

## ✨ Vorschau

Hier ist ein kleiner Einblick, wie Vital+ auf einem mobilen Gerät aussieht (simuliertes iPhone 15):

![Vital+ auf dem iPhone 15](docs/screenshot-iphone-15.png)

## 🚀 Features

- ✅ Benutzer-Login via **NextAuth.js** (Credentials Provider)
- 📊 Übersichtliches Dashboard für Vitaldaten
- 📱 **Mobile-Ready mit Capacitor**: Vollständig als native iOS-App lauffähig, optimiert für Geräte wie das iPhone 15.
- 🌙 Dark Mode Unterstützung
- 🗂 Sidebar-Navigation
- 📥 Integration einer PostgreSQL-Datenbank (Prisma)
- 💉 Erweiterbar für Smartwatch-/Wearable-Integrationen
- ⚙️ Modulare und erweiterbare Komponentenstruktur

## 🛠️ Tech Stack

- **Next.js** – App Router, moderne Web-Architektur
- **Tailwind CSS** – Utility-first Styling
- **ShadCN UI** – Schöne, zugängliche UI-Komponenten
- **Capacitor** – Erstellt native mobile Apps für iOS und Android
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
