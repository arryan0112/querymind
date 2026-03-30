'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { DatabaseIcon, SearchIcon } from 'lucide-react';

const dataTypeColors: Record<string, string> = {
  uuid: 'bg-purple-500',
  varchar: 'bg-blue-500',
  text: 'bg-gray-500',
  integer: 'bg-green-500',
  bigint: 'bg-green-600',
  numeric: 'bg-yellow-500',
  decimal: 'bg-yellow-600',
  boolean: 'bg-red-500',
  timestamp: 'bg-orange-500',
  timestamptz: 'bg-orange-600',
  date: 'bg-amber-500',
  jsonb: 'bg-pink-500',
  array: 'bg-cyan-500',
};

function getDataTypeColor(dataType: string): string {
  const key = Object.keys(dataTypeColors).find((k) => dataType.includes(k));
  return key ? dataTypeColors[key] : 'bg-gray-400';
}

export function SchemaExplorer() {
  const { schemaAnalysis } = useAppStore();
  const [search, setSearch] = useState('');

  const filteredTables = useMemo(() => {
    if (!schemaAnalysis?.tables) return [];
    if (!search) return schemaAnalysis.tables;
    return schemaAnalysis.tables.filter((t) =>
      t.tableName.toLowerCase().includes(search.toLowerCase())
    );
  }, [schemaAnalysis?.tables, search]);

  if (!schemaAnalysis) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <DatabaseIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No database connected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <DatabaseIcon className="size-4" />
          <span className="font-medium text-sm">Schema</span>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
      </div>

      {schemaAnalysis.summary && (
        <div className="p-4 border-b bg-muted/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {schemaAnalysis.summary}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-auto p-2">
        <Accordion type="multiple" className="w-full" defaultValue={[]}>
          {filteredTables.map((table) => (
            <AccordionItem key={table.tableName} value={table.tableName}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{table.tableName}</span>
                  <Badge variant="secondary" className="text-xs">
                    {table.rowCount.toLocaleString()}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 pt-1">
                  {table.columns.map((col) => {
                    const fk = table.foreignKeys.find(
                      (f) => f.columnName === col.columnName
                    );
                    return (
                      <div
                        key={col.columnName}
                        className="flex items-center gap-2 text-xs py-1"
                      >
                        <span className="font-mono text-foreground">
                          {col.columnName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] text-white ${getDataTypeColor(
                            col.dataType
                          )}`}
                        >
                          {col.dataType}
                        </span>
                        {!col.isNullable && (
                          <span className="text-[10px] text-red-500">NOT NULL</span>
                        )}
                        {fk && (
                          <span className="text-muted-foreground">
                            → {fk.referencedTable}.{fk.referencedColumn}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {Object.keys(table.sampleValues).length > 0 && (
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Sample values:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(table.sampleValues)
                        .slice(0, 3)
                        .map(([colName, values]) =>
                          values.slice(0, 3).map((v, i) => (
                            <span
                              key={`${colName}-${i}`}
                              className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-[10px] rounded"
                            >
                              {String(v).slice(0, 20)}
                            </span>
                          ))
                        )}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredTables.length === 0 && search && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No tables match &quot;{search}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
