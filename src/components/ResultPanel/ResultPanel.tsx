'use client';

import { useState } from 'react';
import type { QueryResult, ChartRecommendation } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartRenderer } from './ChartRenderer';
import { TableTab } from './TableTab';
import { Button } from '@/components/ui/button';
import { SaveIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

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
  const [saving, setSaving] = useState(false);

  const handleSaveToDashboard = async () => {
    console.log('[ResultPanel] Save button clicked');
    setSaving(true);
    try {
      const widgetData = {
        title: chartRecommendation.title || 'Chart',
        sql: queryResult.sql,
        naturalLanguageQuery: '',
        chartType: chartType,
        chartConfig: {},
        position: { x: 0, y: 0, w: 6, h: 4 },
        columns: queryResult.columns,
        rows: queryResult.rows,
      };
      console.log('[ResultPanel] Widget data:', JSON.stringify(widgetData).slice(0, 200));
      
      const res = await fetch('/api/dashboard?action=addWidget', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widget: widgetData }),
      });
      console.log('[ResultPanel] Response status:', res.status);
      const data = await res.json();
      console.log('[ResultPanel] Response data:', data);
      if (data.success) {
        toast.success('Chart saved to dashboard');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 border rounded-lg overflow-hidden w-full">
      <Tabs defaultValue="chart" className="w-full">
        <div className="flex items-center justify-between px-4 border-b">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveToDashboard}
            disabled={saving}
          >
            {saving ? (
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <SaveIcon className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>

        <TabsContent value="chart" className="mt-0">
          <div className="p-2 sm:p-4 overflow-x-auto">
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
          <div className="p-2 sm:p-4">
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-w-full">
              <code className="break-all">{queryResult.sql}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
