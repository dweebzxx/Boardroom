'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Share your perspective as CEO...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t border-vintage-slate-blue/20 bg-vintage-charcoal/50">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className={cn(
          'flex-1 resize-none min-h-[60px]',
          'bg-vintage-slate-blue/10 border-vintage-slate-blue/30',
          'text-vintage-cream placeholder:text-vintage-cream/30',
          'focus:border-vintage-mustard/50 focus:ring-vintage-mustard/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={cn(
          'self-end px-4',
          'bg-vintage-mustard hover:bg-vintage-mustard/90',
          'text-vintage-charcoal font-medium',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
