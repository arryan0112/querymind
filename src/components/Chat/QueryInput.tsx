'use client';

import { useRef, useEffect } from 'react';
import { SendIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  onClear: () => void;
}

export function QueryInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  disabled,
  onClear,
}: QueryInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask a question about your data..."
        disabled={disabled}
        className="min-h-[44px] max-h-[200px] resize-none"
        rows={1}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onClear}
          disabled={disabled}
          title="Clear conversation"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
        <Button onClick={onSend} disabled={disabled || !value.trim()}>
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
