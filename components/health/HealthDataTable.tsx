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
import { toast } from "sonner";

interface HealthDataTableProps {
  data: any[];
  metrics: { key: string; label: string; unit?: string }[];
}

export function HealthDataTable({ data, metrics }: HealthDataTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = (id: string) => {
    toast.info("Löschfunktion ist noch nicht implementiert.");
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Datum</TableHead>
          {metrics.map(metric => <TableHead key={metric.key}>{metric.label} ({metric.unit})</TableHead>)}
          <TableHead className="text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{formatDate(entry.date)}</TableCell>
            {metrics.map(metric => <TableCell key={metric.key}>{entry[metric.key] ?? '–'}</TableCell>)}
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}