import type { ChatMessage, AgentRole } from './types';
import { getInitialResponses, getFollowUpResponse } from './agent-responses';

export interface DebateStep {
  role: AgentRole;
  content: string;
  delay: number;
}

export function generateDebateSequence(topic: string): DebateStep[] {
  const responses = getInitialResponses(topic);

  return [
    { role: 'analyst', content: responses.analyst, delay: 1500 },
    { role: 'strategist', content: responses.strategist, delay: 2000 },
    { role: 'professor', content: responses.professor, delay: 1800 },
  ];
}

export function generateFollowUpSequence(
  userMessage: string,
  recentRoles: AgentRole[] = []
): DebateStep[] {
  const steps: DebateStep[] = [];
  const usedRoles: AgentRole[] = [...recentRoles];

  const numResponses = Math.random() > 0.5 ? 2 : 1;

  for (let i = 0; i < numResponses; i++) {
    const response = getFollowUpResponse(userMessage, usedRoles);
    if (response) {
      steps.push({
        role: response.role,
        content: response.content,
        delay: 1200 + Math.random() * 800,
      });
      usedRoles.push(response.role);
    }
  }

  return steps;
}

export function createChatMessage(
  role: AgentRole,
  content: string,
  isTyping = false
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
    isTyping,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
