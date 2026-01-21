'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Play, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { runDebateTurn } from '@/lib/debate-simulation'; // Connecting the Real Brain

interface BoardroomPanelProps {
  topic: string | null;
  courseId: string;
}

export function BoardroomPanel({ topic, courseId }: BoardroomPanelProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [debateStarted, setDebateStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const clearChat = () => {
    setMessages([]);
    setDebateStarted(false);
  };

  const startDebate = async () => {
    if (!topic || isDebating) return;

    setIsDebating(true);
    setDebateStarted(true);

    try {
      // CALL THE REAL AI BACKEND
      // The server returns 3 messages (Analyst, Strategist, Professor)
      const newMessages = await runDebateTurn(topic);
      
      // Cast the response to ensure it matches our frontend types if needed
      // (The AI SDK returns objects compatible with our message structure)
      setMessages((prev) => [...prev, ...newMessages as any[]]);
    } catch (error) {
      console.error("Debate connection failed:", error);
      // Fallback error message for the UI
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'Professor',
        content: "I apologize, CEO. Our connection to the boardroom servers seems unstable. Please check your API configuration.",
      } as any]);
    } finally {
      setIsDebating(false);
    }
  };

  const handleCeoMessage = async (content: string) => {
    if (isDebating) return;

    // 1. Immediately show the CEO's message
    const ceoMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'ceo', // Assuming your types allow 'ceo'
      content: content,
      // Add other required fields if your type requires them (like createdAt)
    } as any;

    setMessages((prev) => [...prev, ceoMessage]);
    setIsDebating(true);

    try {
      // 2. Treat the CEO's argument as a new "Topic" for the advisors to react to
      // This allows for a continuous debate loop!
      const newMessages = await runDebateTurn(content);
      setMessages((prev) => [...prev, ...newMessages as any[]]);
    } catch (error) {
      console.error("Follow-up failed:", error);
    } finally {
      setIsDebating(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <Card className="h-full flex flex-col bg-vintage-slate-blue/10 border-vintage-slate-blue/20">
      <CardHeader className="pb-3 border-b border-vintage-slate-blue/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-vintage-cream font-serif">
            <MessageSquare className="w-5 h-5 text-vintage-mustard" />
            The Boardroom
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-vintage-cream/60 hover:text-vintage-cream hover:bg-vintage-slate-blue/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        {topic && (
          <p className="text-xs text-vintage-cream/60 mt-2">
            Debating:{' '}
            <span className="text-vintage-mustard font-medium">{topic}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-vintage p-4 space-y-4"
        >
          {!hasMessages && !topic && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-vintage-slate-blue/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-vintage-cream/30" />
              </div>
              <h3 className="text-lg font-serif text-vintage-cream/70 mb-2">
                Select a Topic
              </h3>
              <p className="text-sm text-vintage-cream/50 max-w-[250px]">
                Choose a schedule item from the left panel to start a boardroom
                debate with your AI advisors.
              </p>
            </div>
          )}

          {!hasMessages && topic && !debateStarted && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-vintage-mustard/20 flex items-center justify-center mb-4">
                <Play className="w-8 h-8 text-vintage-mustard" />
              </div>
              <h3 className="text-lg font-serif text-vintage-cream mb-2">
                Ready to Debate
              </h3>
              <p className="text-sm text-vintage-cream/60 max-w-[250px] mb-6">
                Your advisors are ready to discuss{' '}
                <span className="text-vintage-mustard">{topic}</span>
              </p>
              <Button
                onClick={startDebate}
                disabled={isDebating}
                className={cn(
                  'bg-vintage-mustard hover:bg-vintage-mustard/90',
                  'text-vintage-charcoal font-medium px-6'
                )}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Debate
              </Button>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          
          {isDebating && (
             <div className="flex items-center gap-2 text-vintage-cream/40 text-xs px-4 animate-pulse">
                <span>The advisors are deliberating...</span>
             </div>
          )}
        </div>

        {(debateStarted || hasMessages) && (
          <ChatInput
            onSend={handleCeoMessage}
            disabled={isDebating || !topic}
            placeholder={
              isDebating
                ? 'Advisors are responding...'
                : 'Share your perspective as CEO...'
            }
          />
        )}
      </CardContent>
    </Card>
  );
}