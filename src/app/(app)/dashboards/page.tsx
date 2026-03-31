'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusIcon, ShareIcon, BarChartIcon, LineChartIcon, PieChartIcon, TableIcon, Loader2Icon } from 'lucide-react';

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgetCount: number;
  updatedAt: string;
}

const chartIcons: Record<string, React.ElementType> = {
  bar: BarChartIcon,
  line: LineChartIcon,
  pie: PieChartIcon,
  table: TableIcon,
};

export default function DashboardsPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const fetchDashboards = async () => {
    try {
      const res = await fetch('/api/dashboard', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setDashboards(data.data.dashboards);
      }
    } catch (error) {
      console.error('Failed to fetch dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    if (newName.length > 100) {
      toast.error('Dashboard name must be 100 characters or less');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/dashboard?action=create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDescription }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Dashboard created');
        setCreateOpen(false);
        setNewName('');
        setNewDescription('');
        router.push(`/dashboards/${data.data.dashboard.id}`);
      } else {
        toast.error(data.error || 'Failed to create dashboard');
      }
    } catch (error) {
      toast.error('Failed to create dashboard');
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async (dashboardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/dashboard/${dashboardId}/share`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await navigator.clipboard.writeText(window.location.origin + data.data.shareUrl);
        toast.success('Link copied to clipboard');
      } else {
        toast.error(data.error || 'Failed to share');
      }
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboards</h1>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboards</h1>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Dashboard
          </Button>
        </div>

        {dashboards.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <BarChartIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No dashboards yet</h2>
              <p className="text-muted-foreground mb-4">
                Save a chart from the chat to create your first dashboard.
              </p>
              <Button onClick={() => router.push('/chat')}>
                Go to Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <Link key={dashboard.id} href={`/dashboards/${dashboard.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                    {dashboard.description && (
                      <CardDescription>{dashboard.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {dashboard.widgetCount} widget{dashboard.widgetCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(dashboard.updatedAt), { addSuffix: true })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleShare(dashboard.id, e)}
                        >
                          <ShareIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Dashboard</DialogTitle>
            <DialogDescription>
              Give your dashboard a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Dashboard"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {newName.length}/100
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="A brief description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
