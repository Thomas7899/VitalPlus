"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { VitalFunctionReading } from "@/hooks/useVitalFunctions";

interface VitalFunctionsTableProps {
  data: VitalFunctionReading[];
  onDelete: (id: string) => void;
}

export function VitalFunctionsTable({ data, onDelete }: VitalFunctionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Datum & Zeit</TableHead>
          <TableHead className="text-right">Herzfrequenz</TableHead>
          <TableHead className="text-right">Atemfrequenz</TableHead>
          <TableHead className="text-right">Sauerstoffsättigung</TableHead>
          <TableHead>Notizen</TableHead>
          <TableHead className="text-right">Aktion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((reading) => (
          <TableRow key={reading.id}>
            <TableCell>
              {new Date(reading.date).toLocaleDateString('de-DE')} {reading.time}
            </TableCell>
            <TableCell className="text-right">{reading.heartRate ?? '–'}</TableCell>
            <TableCell className="text-right">{reading.respirationRate ?? '–'}</TableCell>
            <TableCell className="text-right">{reading.oxygenSaturation ?? '–'}</TableCell>
            <TableCell>{reading.notes}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(reading.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}