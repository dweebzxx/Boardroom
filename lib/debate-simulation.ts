"use server";

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Force the AI to return this exact JSON structure
const ResponseSchema = z.object({
  role: z.enum(['Analyst', 'Strategist', 'Professor']),
  content: z.string(),
});

export async function runDebateTurn(topic: string) {
  
  // --- TURN 1: THE ANALYST (Teal) ---
  const analyst = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ResponseSchema,
    system: `You are 'The Analyst' (Teal). 
             Personality: Skeptical, data-obsessed. 
             Mandate: Attack the topic based on sample size, bias, or cost. 
             Constraint: Keep it under 60 words. Be ruthless.`,
    prompt: `Topic: "${topic}". Give your risk assessment.`,
  });

  // --- TURN 2: THE STRATEGIST (Orange) ---
  const strategist = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ResponseSchema,
    system: `You are 'The Strategist' (Orange). 
             Personality: Visionary, warm, persuasive. 
             Mandate: Disagree with the Analyst. Argue that "Data isn't everything." 
             Constraint: Keep it under 60 words.`,
    prompt: `Topic: "${topic}". 
             The Analyst just said: "${analyst.object.content}". 
             Rebut them immediately.`,
  });

  // --- TURN 3: THE PROFESSOR (Sage) ---
  const professor = await generateObject({
    model: openai('gpt-4o'), // Smarter model for synthesis
    schema: ResponseSchema,
    system: `You are 'The Professor' (Sage). 
             Personality: Academic, rigorous. 
             Mandate: Synthesize the conflict. Mention "Testable Hypotheses". 
             Constraint: Ask the CEO (User) a difficult question to break the tie.`,
    prompt: `Topic: "${topic}". 
             Analyst argued: "${analyst.object.content}". 
             Strategist argued: "${strategist.object.content}". 
             Synthesize this.`,
  });

  // Return the 3 messages with unique IDs
  return [
    { ...analyst.object, id: Date.now() + 1 },
    { ...strategist.object, id: Date.now() + 2 },
    { ...professor.object, id: Date.now() + 3 }
  ];
}