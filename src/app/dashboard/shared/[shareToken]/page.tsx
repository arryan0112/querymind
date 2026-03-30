'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartRenderer } from '@/components/ResultPanel/ChartRenderer';
import { Loader2Icon } from 'lucide-react';
import type { Dashboard, QueryResult, ChartRecommendation } from '@/types';

interface SharedDashboardProps {
  params: Promise<{ shareToken: string }>;
}

export default function SharedDashboardPage({ params }: SharedDashboardProps) {
  const { shareToken } = use(params);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [shareToken]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboard/shared?shareToken=${shareToken}`);
      const data = await res.json();
      if (data.success) {
        setDashboard(data.data.dashboard);
      } else {
        setError(data.error || 'Dashboard not found');
      }
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-8">
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

  if (error || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard not found</h2>
            <p className="text-muted-foreground mb-4">
              This dashboard may not exist or has been removed.
            </p>
            <Link href="/">
              <Button>Go to QueryMind</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{dashboard.name}</h1>
          <div className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold">QueryMind</span>
          </div>
        </div>

        {(!dashboard.widgets || dashboard.widgets.length === 0) ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                This dashboard has no widgets.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dashboard.widgets.map((widget) => (
              <Card key={widget.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{widget.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartRenderer
                    type={widget.chartType}
                    columns={widget.chartConfig?.columns as string[] || []}
                    rows={widget.chartConfig?.rows as Record<string, unknown>[] || []}
                    title={widget.title}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/login">
            <Button variant="outline">
              Sign up to create your own
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
