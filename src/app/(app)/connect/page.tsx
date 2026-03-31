'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { getLLMHeaders } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatabaseIcon, Loader2Icon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

const demoTables = [
  'categories (12 rows)',
  'products (500 rows)',
  'customers (2,000 rows)',
  'orders (12,000 rows)',
  'order_items (36,000 rows)',
  'reviews (3,782 rows)',
];

const suggestedQuestions = [
  'What were the top 5 products by revenue last month?',
  'Show me order count by day for the past 30 days',
  'Which customers placed 10+ orders but never left a review?',
  'Compare revenue by category this quarter vs last',
  'What is the average order value by customer segment?',
];

export default function ConnectPage() {
  const router = useRouter();
  const { llmConfig, setConnection } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 5432,
    database: '',
    user: '',
    password: '',
    ssl: false,
  });

  const [testing, setTesting] = useState(false);
  const [testingResult, setTestingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestingResult(null);

    const connectionString = `postgresql://${formData.user}:${formData.password}@${formData.host}:${formData.port}/${formData.database}`;

    try {
      const res = await fetch('/api/validate-connection', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionString }),
      });

      const data = await res.json();

      if (data.success) {
        setTestingResult({
          success: true,
          message: `Connected! PostgreSQL ${data.data.postgresVersion}`,
        });
      } else {
        setTestingResult({
          success: false,
          message: data.error || 'Connection failed',
        });
      }
    } catch (error) {
      setTestingResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleConnectDemo = async () => {
    if (!llmConfig) {
      router.push('/chat?setup=llm');
      return;
    }

    setConnecting(true);

    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-llm-key': llmConfig.apiKey,
          'x-llm-provider': llmConfig.provider,
          'x-llm-model': llmConfig.model,
        },
        body: JSON.stringify({ type: 'demo' }),
      });

      const data = await res.json();

      if (data.success) {
        setConnection(data.data.connectionId, data.data.schemaAnalysis);
        router.push('/chat');
      } else {
        alert(data.error || 'Failed to connect');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectCustom = async () => {
    if (!llmConfig) {
      router.push('/chat?setup=llm');
      return;
    }

    if (!formData.name || !formData.database || !formData.user) {
      alert('Please fill in all required fields');
      return;
    }

    setConnecting(true);

    const connectionString = `postgresql://${formData.user}:${formData.password}@${formData.host}:${formData.port}/${formData.database}`;

    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-llm-key': llmConfig.apiKey,
          'x-llm-provider': llmConfig.provider,
          'x-llm-model': llmConfig.model,
        },
        body: JSON.stringify({
          type: 'custom',
          connectionString,
          name: formData.name,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setConnection(data.data.connectionId, data.data.schemaAnalysis);
        router.push('/chat');
      } else {
        alert(data.error || 'Failed to connect');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  if (!llmConfig) {
    return (
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Configure AI Provider</CardTitle>
              <CardDescription>
                Before connecting to a database, you need to set up an AI provider to generate SQL queries.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/chat?setup=llm')}>
                Set up AI Provider
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Connect to a Database</h1>
          <p className="text-muted-foreground mt-2">
            Connect to the demo database or your own PostgreSQL database.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="size-5" />
                Try the Demo Database
              </CardTitle>
              <CardDescription>
                Explore our sample e-commerce dataset with realistic data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Tables included:</p>
                <div className="flex flex-wrap gap-2">
                  {demoTables.map((table) => (
                    <span
                      key={table}
                      className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                    >
                      {table}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Try asking:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {suggestedQuestions.slice(0, 3).map((q, i) => (
                    <li key={i} className="list-disc list-inside">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={handleConnectDemo}
                disabled={connecting}
                className="w-full"
              >
                {connecting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                Connect to Demo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connect Your Own Database</CardTitle>
              <CardDescription>
                Connect to any PostgreSQL database you have access to.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  placeholder="My Production DB"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="database">Database</Label>
                <Input
                  id="database"
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">Username</Label>
                <Input
                  id="user"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="ssl"
                  checked={formData.ssl}
                  onCheckedChange={(checked: boolean | string) => setFormData({ ...formData, ssl: Boolean(checked) })}
                />
                <Label htmlFor="ssl" className="text-sm font-normal">
                  Use SSL
                </Label>
              </div>

              {testingResult && (
                <div
                  className={`flex items-center gap-2 text-sm ${
                    testingResult.success ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {testingResult.success ? (
                    <CheckCircleIcon className="size-4" />
                  ) : (
                    <XCircleIcon className="size-4" />
                  )}
                  {testingResult.message}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.database || !formData.user}
                  className="flex-1"
                >
                  {testing && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  Test
                </Button>
                <Button
                  onClick={handleConnectCustom}
                  disabled={connecting || !formData.database || !formData.user}
                  className="flex-1"
                >
                  {connecting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
