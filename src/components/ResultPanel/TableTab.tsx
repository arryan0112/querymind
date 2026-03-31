'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DownloadIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface TableTabProps {
  columns: string[];
  rows: Record<string, unknown>[];
}

type SortDirection = 'asc' | 'desc' | null;

export function TableTab({ columns, rows }: TableTabProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [showAll, setShowAll] = useState(false);

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rows, sortColumn, sortDirection]);

  const displayRows = showAll ? sortedRows : sortedRows.slice(0, 100);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const headers = columns.join(',');
    const csvRows = sortedRows.map((row) =>
      columns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    );
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-center justify-between p-2 sm:p-4 border-b">
        <p className="text-sm text-muted-foreground">
          {rows.length.toLocaleString()} rows
        </p>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>
                  <button
                    onClick={() => handleSort(col)}
                    className="flex items-center gap-1 hover:text-foreground whitespace-nowrap"
                  >
                    <span className="font-mono text-xs">{col}</span>
                    {sortColumn === col && (
                      sortDirection === 'asc' ? (
                        <ArrowUpIcon className="h-3 w-3" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3" />
                      )
                    )}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col} className="font-mono text-xs whitespace-nowrap">
                    {row[col] === null ? (
                      <span className="text-muted-foreground">NULL</span>
                    ) : (
                      String(row[col])
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {rows.length > 100 && !showAll && (
        <div className="p-2 sm:p-4 border-t text-center">
          <Button variant="outline" onClick={() => setShowAll(true)}>
            Show all {rows.length.toLocaleString()} rows
          </Button>
        </div>
      )}
    </div>
  );
}
