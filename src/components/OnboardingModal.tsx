'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EyeIcon, EyeOffIcon, DatabaseIcon, Loader2Icon } from 'lucide-react';
import type { LLMProvider } from '@/types';

const STORAGE_KEY = 'querymind_onboarding_complete';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const router = useRouter();
  const { llmConfig, setLLMConfig, setConnection, connectionId } = useAppStore();
  
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<LLMProvider>('groq');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed === 'true' && llmConfig) {
      onOpenChange(false);
    }
  }, [llmConfig, onOpenChange]);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onOpenChange(false);
  };

  const handleLLMSave = () => {
    if (!apiKey.trim()) return;
    
    const model = provider === 'anthropic' ? 'claude-sonnet-4-5' :
                  provider === 'openai' ? 'gpt-4o' : 'llama-3.3-70b-versatile';
    
    setLLMConfig({ provider, apiKey, model });
    setStep(3);
  };

  const handleConnectDemo = async () => {
    if (!llmConfig) return;
    
    setConnecting(true);
    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
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
        handleComplete();
        router.push('/chat');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setConnecting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Welcome to QueryMind</DialogTitle>
              <DialogDescription>
                Ask questions about your data in plain English and get instant visualizations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Connect to your database and use AI to generate SQL queries, build charts, and create dashboards.
                </p>
              </div>
              <Button onClick={() => setStep(2)} className="w-full">
                Get Started
              </Button>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Set up your AI</DialogTitle>
              <DialogDescription>
                Choose an AI provider to generate SQL queries from your questions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-2">
                {(['anthropic', 'openai', 'groq'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      provider === p
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={provider === 'anthropic' ? 'sk-ant-...' : provider === 'openai' ? 'sk-...' : 'gsk_...'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showApiKey ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and sent directly to the AI provider.
              </p>

              <Button onClick={handleLLMSave} disabled={!apiKey.trim()} className="w-full">
                Continue
              </Button>
            </div>
          </>
        );

      case 3:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Choose your data</DialogTitle>
              <DialogDescription>
                Start with our demo database or connect your own.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Button
                onClick={handleConnectDemo}
                disabled={connecting}
                className="w-full"
              >
                {connecting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                <DatabaseIcon className="mr-2 h-4 w-4" />
                Try Demo Database
              </Button>
              
              <Button
                variant="outline"
                onClick={handleComplete}
                className="w-full"
              >
                Connect My Own Database
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
