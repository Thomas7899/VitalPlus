# 🩺 Vital+

**Vital+** ist eine Fullstack-Gesundheitsanwendung zur intelligenten Analyse und Verwaltung von Vitaldaten. Sie kombiniert modernes Tracking mit KI-gestützten Handlungsempfehlungen.

![Vital+ App Preview](docs/screenshot-iphone-15.png)

## ✨ Highlights & Tech-Stack

Dieses Projekt demonstriert moderne Web-Architektur mit Fokus auf **Typsicherheit**, **Datenbank-Performance** und **KI-Integration**.

| Bereich | Technologie |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React, Tailwind CSS, ShadCN UI, Recharts |
| **Backend** | Node.js (Next.js API Routes), Server-Side Logic |
| **Datenbank** | **PostgreSQL** (Neon Serverless) mit **pgvector** |
| **ORM** | **Drizzle ORM** (migriert von Prisma für bessere Performance & SQL-Kontrolle) |
| **AI / ML** | OpenAI API (GPT-4o), Vector Embeddings (RAG) für kontextbezogene Analysen |
| **Mobile** | Capacitor (iOS/Android Runtime) |
| **Auth** | NextAuth.js v5 |

## 🚀 Features

### 🧠 KI-Health-Coach (RAG)
Die App nutzt **Vector Embeddings**, um historische Gesundheitsdaten des Nutzers semantisch zu durchsuchen.
* **Intelligente Analyse:** "Warum schlafe ich schlecht?" – Die KI analysiert Korrelationen zwischen Schritten, Kalorien und Schlaf.
* **Tagespläne:** Generierung personalisierter Ernährungs- und Trainingspläne basierend auf Live-Daten.

### 📊 Datenvisualisierung & Tracking
* Interaktive Charts für Herzfrequenz, Gewicht und Schlaf (Recharts).
* Berechnung von Trends (z.B. "Schlafdauer sinkt um 10%").
* **Alert-System:** Automatische Warnung bei Anomalien (z.B. Ruhepuls zu hoch).

### 🛠 Technische Besonderheiten
* **Fullstack Typesafety:** Durchgängige Typisierung vom Datenbank-Schema bis zur UI-Komponente.
* **Optimistic UI:** Schnelle Interaktionen durch SWR und optimierte API-Calls.
* **Skeleton Loading:** Verbesserte UX durch moderne Ladestatus-Anzeigen.

## 📸 Demo-Zugang

Du kannst die Anwendung direkt testen (Live-Deployment auf Vercel):

* **URL:** [Link zu deiner Vercel App einfügen]
* **Email:** `john.doe@example.com`
* **Passwort:** `password123`

## 📦 Installation (Lokal)

Voraussetzungen: Node.js 18+, PostgreSQL Datenbank.

```bash
# Repository klonen
git clone [https://github.com/thomas7899/VitalPlus.git](https://github.com/thomas7899/VitalPlus.git)
cd VitalPlus

# Abhängigkeiten installieren
pnpm install

# Umgebungsvariablen setzen
cp .env.example .env.local

# Datenbank-Schema synchronisieren (Drizzle)
pnpm drizzle-kit push

# Entwicklungsserver starten
pnpm dev