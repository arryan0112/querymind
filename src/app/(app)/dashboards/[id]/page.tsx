'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartRenderer } from '@/components/ResultPanel/ChartRenderer';
import { TableTab } from '@/components/ResultPanel/TableTab';
import { 
  ArrowLeftIcon, 
  ShareIcon, 
  RefreshCwIcon, 
  TrashIcon, 
  Loader2Icon, 
  PlusIcon,
  Grid3X3Icon,
  LayoutIcon,
  BarChartIcon,
  Table2Icon,
  EditIcon
} from 'lucide-react';
import type { Dashboard, DashboardWidget, QueryResult, ChartRecommendation } from '@/types';

interface DashboardDetailProps {
  params: Promise<{ id: string }>;
}

export default function DashboardDetailPage({ params }: DashboardDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [widgetData, setWidgetData] = useState<Record<string, { queryResult: QueryResult; chartRecommendation: ChartRecommendation; loading: boolean; error: string | null }>>({});
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(2);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboard/${id}`);
      const data = await res.json();
      if (data.success) {
        setDashboard(data.data.dashboard);
        setName(data.data.dashboard.name);
        loadWidgetData(data.data.dashboard.widgets || []);
      } else {
        toast.error(data.error || 'Failed to load dashboard');
        router.push('/dashboards');
      }
    } catch (error) {
      toast.error('Failed to load dashboard');
      router.push('/dashboards');
    } finally {
      setLoading(false);
    }
  };

  const loadWidgetData = async (widgets: DashboardWidget[]) => {
    const newWidgetData: typeof widgetData = {};
    
    for (const widget of widgets) {
      if (widget.columns && widget.rows && widget.rows.length > 0) {
        newWidgetData[widget.id] = { 
          queryResult: { 
            columns: widget.columns, 
            rows: widget.rows, 
            rowCount: widget.rows.length, 
            executionTimeMs: 0, 
            sql: widget.sql 
          }, 
          chartRecommendation: { type: widget.chartType, title: widget.title, reasoning: '' }, 
          loading: false, 
          error: null 
        };
      } else {
        newWidgetData[widget.id] = { 
          queryResult: { columns: [], rows: [], rowCount: 0, executionTimeMs: 0, sql: widget.sql }, 
          chartRecommendation: { type: widget.chartType, title: widget.title, reasoning: '' }, 
          loading: true, 
          error: null 
        };
        setWidgetData(prev => ({ ...prev, [widget.id]: newWidgetData[widget.id] }));
      }
    }
    
    setWidgetData(prev => ({ ...prev, ...newWidgetData }));

    const widgetsNeedingQuery = widgets.filter(w => !w.columns || !w.rows || w.rows.length === 0);
    
    for (const widget of widgetsNeedingQuery) {
      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionId: localStorage.getItem('connectionId'),
            question: widget.naturalLanguageQuery,
            conversationHistory: [],
          }),
        });
        const data = await res.json();
        if (data.success) {
          setWidgetData(prev => ({
            ...prev,
            [widget.id]: {
              queryResult: data.data.message.queryResult,
              chartRecommendation: data.data.message.chartRecommendation,
              loading: false,
              error: null,
            },
          }));
        } else {
          setWidgetData(prev => ({
            ...prev,
            [widget.id]: { ...prev[widget.id], loading: false, error: data.error },
          }));
        }
      } catch (error) {
        setWidgetData(prev => ({
          ...prev,
          [widget.id]: { ...prev[widget.id], loading: false, error: 'Failed to load widget' },
        }));
      }
    }
  };

  const handleNameSave = async () => {
    if (!name.trim() || name.length > 100) {
      toast.error('Name must be 1-100 characters');
      return;
    }
    setEditingName(false);
    toast.success('Dashboard updated');
  };

  const handleShare = async () => {
    try {
      const res = await fetch(`/api/dashboard/${id}/share`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await navigator.clipboard.writeText(window.location.origin + data.data.shareUrl);
        toast.success('Link copied to clipboard');
      }
    } catch {
      toast.error('Failed to share');
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      const res = await fetch(`/api/dashboard?action=removeWidget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardId: id, widgetId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Widget removed');
        fetchDashboard();
      }
    } catch {
      toast.error('Failed to remove widget');
    }
  };

  const handleRefresh = (widgetId: string) => {
    setWidgetData(prev => ({ ...prev, [widgetId]: { ...prev[widgetId], loading: true } }));
    loadWidgetData(dashboard?.widgets?.filter(w => w.id === widgetId) || []);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboards">
              <Button variant="ghost" size="icon">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            {editingName ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="h-8 w-64"
                autoFocus
              />
            ) : (
              <h1 
                className="text-xl sm:text-2xl font-bold cursor-pointer hover:text-primary"
                onClick={() => setEditingName(true)}
              >
                {dashboard.name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-md">
              <Button
                variant={gridCols === 1 ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setGridCols(1)}
              >
                <LayoutIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={gridCols === 2 ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setGridCols(2)}
              >
                <Grid3X3Icon className="h-4 w-4" />
              </Button>
              <Button
                variant={gridCols === 3 ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setGridCols(3)}
              >
                <span className="text-xs">3</span>
              </Button>
            </div>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'chart' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('chart')}
              >
                <BarChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('table')}
              >
                <Table2Icon className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={handleShare}>
              <ShareIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>

        {(!dashboard.widgets || dashboard.widgets.length === 0) ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <BarChartIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                No widgets yet. Go to chat to create your first visualization.
              </p>
              <Button onClick={() => router.push('/chat')}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Go to Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid grid-cols-1 ${gridCols === 1 ? '' : gridCols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4 sm:gap-6`}>
            {dashboard.widgets.map((widget) => {
              const data = widgetData[widget.id];
              return (
                <Card key={widget.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base truncate">{widget.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRefresh(widget.id)}
                          disabled={data?.loading}
                          title="Refresh"
                        >
                          <RefreshCwIcon className={`h-3 w-3 ${data?.loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteWidget(widget.id)}
                          title="Delete"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {data?.loading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8" />
                        <Skeleton className="h-48" />
                      </div>
                    ) : data?.error ? (
                      <div className="h-48 flex items-center justify-center text-red-500 text-sm">
                        {data.error}
                      </div>
                    ) : data?.queryResult ? (
                      viewMode === 'chart' ? (
                        <ChartRenderer
                          type={data.chartRecommendation.type}
                          columns={data.queryResult.columns}
                          rows={data.queryResult.rows}
                          title={data.chartRecommendation.title}
                        />
                      ) : (
                        <TableTab
                          columns={data.queryResult.columns}
                          rows={data.queryResult.rows}
                        />
                      )
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                        No data
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
