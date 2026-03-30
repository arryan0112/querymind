'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/app-store';
import { LLMConfigModal } from '@/components/LLMConfigModal';
import { PROVIDER_INFO } from '@/lib/constants';
import { SettingsIcon, LayoutDashboardIcon, DatabaseIcon } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { llmConfig } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !llmConfig) {
      setModalOpen(true);
    }
  }, [mounted, llmConfig]);

  const getModelShortName = (model: string) => {
    const parts = model.split('-');
    if (parts[0] === 'llama') return 'Llama 3.3 70B';
    if (parts[0] === 'gpt') return model.toUpperCase();
    if (parts[0] === 'claude') return 'Claude';
    return model;
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">QueryMind</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent"
          >
            <LayoutDashboardIcon className="size-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/connections"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent"
          >
            <DatabaseIcon className="size-4" />
            Connections
          </Link>
        </nav>

        <div className="p-4 border-t">
          {mounted && llmConfig ? (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: PROVIDER_INFO[llmConfig.provider].color }}
              />
              <span>
                {PROVIDER_INFO[llmConfig.provider].name} · {getModelShortName(llmConfig.model)}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
            >
              ⚠ No AI provider set
            </button>
          )}
          
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent mt-4"
          >
            <SettingsIcon className="size-4" />
            Settings
          </Link>
        </div>
      </aside>

      <main className="flex-1">{children}</main>

      <LLMConfigModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
