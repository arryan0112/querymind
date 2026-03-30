'use client';

import { useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import type { ConversationMessage } from '@/types';
import { MessageBubble } from './MessageBubble';
import { QueryInput } from './QueryInput';

interface ChatContainerProps {
  messages: ConversationMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  suggestedQuestions: string[];
}

export function ChatContainer({
  messages,
  input,
  onInputChange,
  onSend,
  onKeyDown,
  loading,
  messagesEndRef,
  suggestedQuestions,
}: ChatContainerProps) {
  const { clearConversation } = useAppStore();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <h2 className="text-2xl font-bold">Ask questions about your data</h2>
              <p className="text-muted-foreground">
                Try these sample queries or type your own question
              </p>
              <div className="grid gap-2 pt-4">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onInputChange(q)}
                    className="text-left p-3 rounded-lg border hover:bg-accent transition-colors text-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-medium">AI</span>
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <QueryInput
          value={input}
          onChange={onInputChange}
          onSend={onSend}
          onKeyDown={onKeyDown}
          disabled={loading}
          onClear={clearConversation}
        />
      </div>
    </div>
  );
}
