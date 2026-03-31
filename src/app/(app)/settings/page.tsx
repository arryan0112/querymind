'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { LLMConfigModal } from '@/components/LLMConfigModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrashIcon, Loader2Icon, DatabaseIcon, KeyIcon } from 'lucide-react';

interface SavedConnection {
  id: string;
  name: string;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { llmConfig, setLLMConfig, clearConnection, clearConversation, connectionId, schemaAnalysis } = useAppStore();
  
  const [llmModalOpen, setLLMModalOpen] = useState(false);
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/connections', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setConnections(data.data.connections);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleDisconnect = () => {
    clearConnection();
    toast.success('Disconnected from database');
    router.push('/connect');
  };

  const handleClearHistory = () => {
    setClearing(true);
    setTimeout(() => {
      clearConversation();
      setClearing(false);
      toast.success('Conversation cleared');
    }, 500);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  };

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              AI Provider
            </CardTitle>
            <CardDescription>
              Configure your AI provider for SQL generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {llmConfig ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{llmConfig.provider.toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">
                    {maskApiKey(llmConfig.apiKey)} · {llmConfig.model}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setLLMModalOpen(true)}>
                  Change
                </Button>
              </div>
            ) : (
              <Button onClick={() => setLLMModalOpen(true)}>
                Set up AI Provider
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Active Connection
            </CardTitle>
            <CardDescription>
              Your currently connected database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectionId && schemaAnalysis ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Connected</p>
                  <p className="text-sm text-muted-foreground">
                    {schemaAnalysis.tables.length} tables
                  </p>
                </div>
                <Button variant="outline" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => router.push('/connect')}>
                Connect to Database
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Connections</CardTitle>
            <CardDescription>
              Your previously saved database connections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingConnections ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : connections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved connections</p>
            ) : (
              <div className="space-y-2">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{conn.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Connected {new Date(conn.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions. Handle with care.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleClearHistory}
              disabled={clearing}
            >
              {clearing && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              <TrashIcon className="mr-2 h-4 w-4" />
              Clear Conversation History
            </Button>
          </CardContent>
        </Card>
      </div>

      <LLMConfigModal open={llmModalOpen} onOpenChange={setLLMModalOpen} />
    </div>
  );
}
