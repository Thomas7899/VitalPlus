"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: string;
  name?: string;
  email: string;
};

type Props = {
  users: User[];
  selectedUser: string | null;
  setSelectedUser: (id: string) => void;
  from: string | null;
  to: string | null;
  setFrom: (date: string | null) => void;
  setTo: (date: string | null) => void;
};

const dateRanges = [
  { label: "1 Tag", value: "1d" },
  { label: "1 Woche", value: "1w" },
  { label: "1 Monat", value: "1m" },
  { label: "1 Jahr", value: "1y" },
];

function getDateRange(value: string): [string, string] {
  const to = new Date();
  let from = new Date(to);

  switch (value) {
    case "1d":
      from.setDate(to.getDate() - 1);
      break;
    case "1w":
      from.setDate(to.getDate() - 7);
      break;
    case "1m":
      from.setMonth(to.getMonth() - 1);
      break;
    case "1y":
      from.setFullYear(to.getFullYear() - 1);
      break;
    default:
      break;
  }

  return [
    from.toISOString().split("T")[0],
    to.toISOString().split("T")[0],
  ];
}

export function HealthFilters({
  users,
  selectedUser,
  setSelectedUser,
  from,
  to,
  setFrom,
  setTo,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-end gap-4">
      <div className="max-w-sm w-full">
        <label className="block text-sm font-medium mb-1">Nutzer</label>
        <Select
          onValueChange={setSelectedUser}
          defaultValue={selectedUser ?? undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nutzer wählen..." />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(users) && users.length > 0 ? (
              users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </SelectItem>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Keine Nutzer verfügbar
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="block text-sm font-medium">Zeitraum</label>
        <div className="flex flex-wrap gap-2">
          {dateRanges.map((range) => (
            <button
              key={range.value}
              className="bg-gray-200 dark:bg-gray-700 text-sm px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => {
                const [newFrom, newTo] = getDateRange(range.value);
                setFrom(newFrom);
                setTo(newTo);
              }}
              type="button"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
