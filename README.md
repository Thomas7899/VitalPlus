# Vital+

Eine intelligente Fullstack-Gesundheitsplattform zur Analyse und Verwaltung von Vitaldaten. Sie kombiniert modernes Tracking mit einem **KI-Health-Coach (RAG)** für personalisierte Handlungsempfehlungen.

<div align="center">
  <img src="docs/screenshot-iphone-15.png" alt="Vital+ App Preview" width="300">
</div>

## ✨ Highlights & Tech-Stack

| Bereich | Technologie |
| :--- | :--- |
| **Frontend** | **Next.js 15** (App Router, Turbopack), **React 19**, **Tailwind CSS 4** |
| **UI / UX** | ShadCN UI, Framer Motion, Recharts, Lucide Icons |
| **Backend** | Server Actions, Next.js API Routes |
| **Datenbank** | **PostgreSQL** (Neon Serverless) mit **pgvector** |
| **ORM** | **Drizzle ORM** (für maximale Typsicherheit & SQL-Performance) |
| **AI / ML** | **OpenAI API (GPT-4o)**, Vercel AI SDK, RAG (Vector Embeddings) |
| **Mobile** | **Capacitor 7** (Native iOS/Android Runtime) |
| **Auth** | NextAuth.js v5 (Auth.js) |

## 🚀 Features

### 🧠 KI-Health-Coach (RAG)
Die App nutzt **Vector Embeddings** (gespeichert in Postgres), um historische Gesundheitsdaten semantisch zu analysieren.
* **Kontext-Analyse:** Der Coach erkennt Zusammenhänge (z.B. „Schlechter Schlaf nach hohem Kalorienkonsum“).
* **Tagespläne:** Generierung von personalisierten Ernährungs- und Trainingsplänen in Echtzeit.

### 📊 Datenvisualisierung & Tracking
* **Interaktive Charts:** Visualisierung von Herzfrequenz, Gewicht, Schlaf und Kalorien.
* **Smart Alerts:** Automatische Warnung bei Anomalien (z.B. Ruhepuls zu hoch, Sauerstoffsättigung niedrig).
* **Trend-Erkennung:** Berechnung von langfristigen Entwicklungen (z.B. „Gewicht sinkt stabil“).

### 🛠 Technische Besonderheiten
* **Fullstack Typesafety:** Durchgängige Typisierung vom Datenbank-Schema bis zur UI-Komponente.
* **Optimistic UI:** Sofortiges Feedback bei User-Interaktionen (keine Ladezeiten spürbar).
* **Skeleton Loading:** Moderne Ladestatus-Anzeigen für optimale UX.
* **Dark Mode:** Vollständige Unterstützung für Hell- und Dunkelmodus (next-themes).

## 📸 Demo-Zugang

Du kannst die Anwendung direkt testen (Live-Deployment auf Vercel):

* **Email:** `john.doe@example.com`
* **Passwort:** `password123`

### 🗂 Datenmodell (ER-Diagramm)

```mermaid
erDiagram
    USERS ||--o{ HEALTH_DATA : has
    USERS ||--o| HEALTH_EMBEDDINGS : has

    USERS {
        uuid id PK
        string email
        string name
        timestamp date_of_birth
    }

    HEALTH_DATA {
        uuid id PK
        uuid user_id FK
        timestamp date
        int steps
        int heart_rate
        float sleep_hours
        float weight
        string meal_type
    }

    HEALTH_EMBEDDINGS {
        uuid id PK
        uuid user_id FK
        text content
        text embedding
    }
```
