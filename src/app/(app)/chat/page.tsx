'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { LLMConfigModal } from '@/components/LLMConfigModal';
import { SchemaExplorer } from '@/components/SchemaExplorer';
import { ChatContainer } from '@/components/Chat/ChatContainer';
import { DatabaseIcon, Loader2Icon } from 'lucide-react';

const suggestedQuestions = [
  'What were the top 5 products by revenue last month?',
  'Show me order count by day for the past 30 days',
  'Which customers placed 10+ orders but never left a review?',
  'Compare revenue by category this quarter vs last',
  'What is the average order value by customer segment?',
];

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { llmConfig, connectionId, schemaAnalysis, addMessage, conversationHistory } =
    useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setup = searchParams.get('setup');
    if (setup === 'llm' || !llmConfig) {
      setModalOpen(true);
    }
  }, [searchParams, llmConfig]);

  useEffect(() => {
    if (!llmConfig) {
      setModalOpen(true);
    } else if (!connectionId || !schemaAnalysis) {
      router.push('/connect');
    }
  }, [llmConfig, connectionId, schemaAnalysis, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  const handleSend = async () => {
    if (!input.trim() || loading || !llmConfig || !connectionId) return;

    const question = input.trim();
    setInput('');
    setLoading(true);

    addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    });

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-llm-key': llmConfig.apiKey,
          'x-llm-provider': llmConfig.provider,
          'x-llm-model': llmConfig.model,
        },
        body: JSON.stringify({
          connectionId,
          question,
          conversationHistory: conversationHistory.slice(-6),
        }),
      });

      const data = await res.json();

      if (data.success) {
        addMessage(data.data.message);
      } else {
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${data.error}`,
          error: data.error,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!llmConfig || !connectionId || !schemaAnalysis) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Toggle Button for Sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-primary text-primary-foreground p-2 rounded-r-lg shadow-lg hover:bg-primary/90 transition-all"
        style={{ left: sidebarOpen ? '272px' : '0px' }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      {/* Schema Sidebar */}
      <aside 
        className={`w-72 border-r bg-card fixed left-0 top-0 h-full z-20 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SchemaExplorer />
      </aside>

      {/* Main Chat Area - Centered */}
      <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto">
        <ChatContainer
          messages={conversationHistory}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          loading={loading}
          messagesEndRef={messagesEndRef}
          suggestedQuestions={suggestedQuestions}
        />
      </div>

      <LLMConfigModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
