'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import type { LLMProvider, LLMConfig } from '@/types';
import { DEFAULT_MODELS } from '@/types';
import {
  GROQ_MODELS,
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  PROVIDER_INFO,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EyeIcon, EyeOffIcon, ExternalLinkIcon } from 'lucide-react';

interface LLMConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LLMConfigModal({ open, onOpenChange }: LLMConfigModalProps) {
  const { llmConfig, setLLMConfig } = useAppStore();
  const [provider, setProvider] = useState<LLMProvider>('groq');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (llmConfig) {
      setProvider(llmConfig.provider);
      setApiKey(llmConfig.apiKey);
      setModel(llmConfig.model);
    } else {
      setProvider('groq');
      setModel(DEFAULT_MODELS.groq);
    }
  }, [llmConfig, open]);

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setModel(DEFAULT_MODELS[newProvider]);
  };

  const getModels = () => {
    switch (provider) {
      case 'anthropic':
        return ANTHROPIC_MODELS;
      case 'openai':
        return OPENAI_MODELS;
      case 'groq':
        return GROQ_MODELS;
    }
  };

  const handleSave = () => {
    const config: LLMConfig = {
      provider,
      apiKey,
      model,
    };
    setLLMConfig(config);
    onOpenChange(false);
  };

  const providerInfo = PROVIDER_INFO[provider];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure AI Provider</DialogTitle>
          <DialogDescription>
            Choose an AI provider to generate SQL queries from natural language.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {(['anthropic', 'openai', 'groq'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleProviderChange(p)}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-3 text-center transition-all ${
                  provider === p
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <span className="font-semibold">{PROVIDER_INFO[p].name}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {PROVIDER_INFO[p].tagline}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end text-xs">
            <a
              href={providerInfo.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Get API key <ExternalLinkIcon className="size-3" />
            </a>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {getModels().map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">{providerInfo.name} API key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder={providerInfo.placeholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your key is stored in your browser only and never sent to our servers.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
