'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Play, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { ChatMessage as ChatMessageType } from '@/lib/types';
import { runDebateTurn } from '@/lib/debate-simulation';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { ExecutiveBriefView } from './ExecutiveBriefView';

interface BoardroomPanelProps {
  topic: string | null;
  courseId: string;
}

export function BoardroomPanel({ topic, courseId }: BoardroomPanelProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isDebating, setIsDebating] = useState(false);
  const [debateStarted, setDebateStarted] = useState(false);
  const [debateId, setDebateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'debate' | 'brief'>('debate');
  const [briefContent, setBriefContent] = useState<string | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    setDebateId(null);
    setBriefContent(null);
  };

  useEffect(() => {
    const loadLatestBrief = async () => {
      if (!debateId) {
        setBriefContent(null);
        return;
      }

      const { data, error } = await supabaseBrowser
        .from('executive_briefs')
        .select('content_markdown, created_at')
        .eq('debate_id', debateId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error) {
        setBriefContent(data?.content_markdown ?? null);
      }
    };

    loadLatestBrief();
  }, [debateId]);

  const startDebate = async () => {
    if (!topic || isDebating) return;

    setIsDebating(true);
    setDebateStarted(true);

    try {
      const response = await runDebateTurn({
        courseId,
        debateId,
        userPrompt: topic,
      });

      setDebateId(response.debateId);
      setMessages((prev) => [...prev, ...response.messages]);
    } catch (error) {
      console.error('Debate connection failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'system',
          content:
            'I apologize, CEO. Our connection to the boardroom servers seems unstable. Please check your API configuration.',
        },
      ]);
    } finally {
      setIsDebating(false);
    }
  };

  const handleCeoMessage = async (content: string) => {
    if (isDebating) return;

    const ceoMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'ceo',
      content,
      citations: [],
    };

    setMessages((prev) => [...prev, ceoMessage]);
    setIsDebating(true);

    try {
      const response = await runDebateTurn({
        courseId,
        debateId,
        userPrompt: content,
      });
      setDebateId(response.debateId);
      setMessages((prev) => [...prev, ...response.messages]);
    } catch (error) {
      console.error('Follow-up failed:', error);
    } finally {
      setIsDebating(false);
    }
  };

  const hasMessages = messages.length > 0;
  const canGenerateBrief = Boolean(debateId);

  const handleGenerateBrief = async () => {
    if (!debateId) return;
    setIsGeneratingBrief(true);

    try {
      const response = await fetch('/api/briefs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debateId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate executive brief.');
      }

      const data = await response.json();
      setBriefContent(data.content ?? null);
      setActiveTab('brief');
    } catch (error) {
      console.error('Brief generation failed:', error);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

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
            Debating: <span className="text-vintage-mustard font-medium">{topic}</span>
          </p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('debate')}
            className={cn(
              'px-3 py-1 rounded-full border',
              activeTab === 'debate'
                ? 'border-vintage-mustard text-vintage-mustard'
                : 'border-vintage-slate-blue/30 text-vintage-cream/60'
            )}
          >
            Debate
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('brief')}
            className={cn(
              'px-3 py-1 rounded-full border',
              activeTab === 'brief'
                ? 'border-vintage-mustard text-vintage-mustard'
                : 'border-vintage-slate-blue/30 text-vintage-cream/60'
            )}
          >
            Executive Brief
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {activeTab === 'debate' ? (
          <>
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
                    Choose a schedule item from the left panel to start a boardroom debate with
                    your AI advisors.
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
                  isDebating ? 'Advisors are responding...' : 'Share your perspective as CEO...'
                }
              />
            )}
          </>
        ) : (
          <div className="flex-1 p-4">
            <ExecutiveBriefView
              content={briefContent}
              isGenerating={isGeneratingBrief}
              canGenerate={canGenerateBrief}
              onGenerate={handleGenerateBrief}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
