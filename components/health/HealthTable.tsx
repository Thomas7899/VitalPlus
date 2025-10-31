// Die Typen HealthEntry und Metric werden jetzt direkt hier definiert:
interface Metric {
  key: string; // Der Schlüssel, um auf den Wert in HealthEntry zuzugreifen
  label: string; // Die Beschriftung für die Tabellenspalte
}

interface HealthEntry {
  id: string | number; // Eindeutige ID für jedes HealthEntry-Objekt
  timestamp: string;   // Zeitstempel als String, der von formatDate erwartet wird
  // Indexsignatur, um dynamische Schlüssel basierend auf metric.key zu ermöglichen.
  // Die Werte können Zahlen, Strings oder undefiniert/null sein.
  [key: string]: any; // Oder spezifischer: string | number | undefined | null;
}

// Die Props-Schnittstelle verwendet nun die oben lokal definierten Typen
interface HealthTableProps {
  data: HealthEntry[];
  metric: Metric;
}

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export function HealthTable({ data, metric }: HealthTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="border-b bg-muted">
          <tr>
            <th className="px-4 py-2">Datum</th>
            <th className="px-4 py-2">{metric.label}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.id} className="border-b">
              <td className="px-4 py-2">{formatDate(entry.timestamp)}</td>
              {/* Hier wird angenommen, dass entry[metric.key] einen renderbaren Wert liefert (string, number etc.) */}
              <td className="px-4 py-2">{entry[metric.key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

