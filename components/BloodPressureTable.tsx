"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  date: string;
  time: string;
  notes?: string;
}

interface BloodPressureTableProps {
  data: BloodPressureReading[];
  onDelete: (id: string) => void;
}

export function BloodPressureTable({ data, onDelete }: BloodPressureTableProps) {
  const getBloodPressureCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { category: "Normal", color: "text-green-600" };
    if (systolic < 130 && diastolic < 80) return { category: "Erhöht", color: "text-yellow-600" };
    if (systolic < 140 || diastolic < 90) return { category: "Stufe 1", color: "text-orange-600" };
    if (systolic < 180 || diastolic < 120) return { category: "Stufe 2", color: "text-red-600" };
    return { category: "Krise", color: "text-red-800" };
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Datum</TableHead>
            <TableHead>Zeit</TableHead>
            <TableHead>Systolisch</TableHead>
            <TableHead>Diastolisch</TableHead>
            <TableHead>Puls</TableHead>
            <TableHead>Kategorie</TableHead>
            <TableHead>Notizen</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((reading) => {
            const category = getBloodPressureCategory(reading.systolic, reading.diastolic);
            return (
              <TableRow key={reading.id}>
                <TableCell>{new Date(reading.date).toLocaleDateString('de-DE')}</TableCell>
                <TableCell>{reading.time}</TableCell>
                <TableCell className="font-medium text-red-600">{reading.systolic}</TableCell>
                <TableCell className="font-medium text-blue-600">{reading.diastolic}</TableCell>
                <TableCell>{reading.pulse || '-'}</TableCell>
                <TableCell className={category.color}>
                  <span className="text-sm font-medium">{category.category}</span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{reading.notes || '-'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(reading.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          )}
        </TableBody>
      </Table>
    </div>
  );
}