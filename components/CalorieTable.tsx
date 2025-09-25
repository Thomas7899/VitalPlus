"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

interface CalorieEntry {
  id: string;
  meal: 'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Snacks';
  food: string;
  calories: number;
  date: string;
  time: string;
  notes?: string;
}

interface CalorieTableProps {
  data: CalorieEntry[];
  onDelete: (id: string) => void;
}

const MEAL_EMOJIS = {
  'Frühstück': '🍳',
  'Mittagessen': '🍽️',
  'Abendessen': '🥘',
  'Snacks': '🍎'
};

export function CalorieTable({ data, onDelete }: CalorieTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Datum</TableHead>
            <TableHead>Zeit</TableHead>
            <TableHead>Mahlzeit</TableHead>
            <TableHead>Lebensmittel</TableHead>
            <TableHead>Kalorien</TableHead>
            <TableHead>Notizen</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{new Date(entry.date).toLocaleDateString('de-DE')}</TableCell>
              <TableCell>{entry.time}</TableCell>
              <TableCell>
                {MEAL_EMOJIS[entry.meal]} {entry.meal}
              </TableCell>
              <TableCell className="font-medium">{entry.food}</TableCell>
              <TableCell className="text-orange-600 font-semibold">{entry.calories} kcal</TableCell>
              <TableCell className="max-w-[200px] truncate">{entry.notes || '-'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(entry.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}