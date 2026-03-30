'use client';

import { useState } from 'react';
import type { ConversationMessage } from '@/types';
import { ResultPanel } from '@/components/ResultPanel/ResultPanel';
import { CopyIcon, ChevronDownIcon, ChevronUpIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: ConversationMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [sqlExpanded, setSqlExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const hasError = !!message.error;

  const handleCopy = async () => {
    if (message.sql) {
      await navigator.clipboard.writeText(message.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs font-medium">
            {message.role === 'user' ? 'U' : 'AI'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
        <span className="text-xs text-primary-foreground font-medium">AI</span>
      </div>

      <div className={`flex-1 rounded-lg border ${hasError ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'bg-card'} p-4`}>
        {hasError ? (
          <div className="flex items-center gap-2 text-red-600">
            <span className="text-sm">{message.content}</span>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap mb-3">{message.content}</p>

            {message.sql && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <button
                    onClick={() => setSqlExpanded(!sqlExpanded)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {sqlExpanded ? (
                      <ChevronUpIcon className="h-3 w-3" />
                    ) : (
                      <ChevronDownIcon className="h-3 w-3" />
                    )}
                    SQL Query
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 text-xs"
                  >
                    <CopyIcon className="h-3 w-3 mr-1" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                {sqlExpanded && (
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    <code>{message.sql}</code>
                  </pre>
                )}
              </div>
            )}

            {message.queryResult && message.chartRecommendation && (
              <ResultPanel
                queryResult={message.queryResult}
                chartRecommendation={message.chartRecommendation}
              />
            )}

            {message.queryResult && !message.chartRecommendation && (
              <div className="text-xs text-muted-foreground mt-2">
                {message.queryResult.rowCount} rows · {message.queryResult.executionTimeMs}ms
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
