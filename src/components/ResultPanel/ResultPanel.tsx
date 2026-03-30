'use client';

import { useState } from 'react';
import type { QueryResult, ChartRecommendation } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartRenderer } from './ChartRenderer';
import { TableTab } from './TableTab';
import { Button } from '@/components/ui/button';
import { SaveIcon } from 'lucide-react';

interface ResultPanelProps {
  queryResult: QueryResult;
  chartRecommendation: ChartRecommendation;
  onSaveToDashboard?: () => void;
}

export function ResultPanel({
  queryResult,
  chartRecommendation,
}: ResultPanelProps) {
  const [chartType, setChartType] = useState<ChartRecommendation['type']>(
    chartRecommendation.type
  );

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <Tabs defaultValue="chart" className="w-full">
        <div className="flex items-center justify-between px-4 border-b">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chart" className="mt-0">
          <div className="p-4">
            <ChartRenderer
              type={chartType}
              columns={queryResult.columns}
              rows={queryResult.rows}
              title={chartRecommendation.title}
              onTypeChange={setChartType}
            />
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <TableTab columns={queryResult.columns} rows={queryResult.rows} />
        </TabsContent>

        <TabsContent value="sql" className="mt-0">
          <div className="p-4">
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
              <code>{queryResult.sql}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
