
'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate a suggested prompt for a given AI partner skill.
 *
 * The flow takes the AI partner's skill as input and returns a suggested prompt that users can use to quickly get value from the AI partner.
 *
 * @param {string} skill - The AI partner's skill.
 * @returns {string} - A suggested prompt for the AI partner.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSuggestedPromptInputSchema = z.object({
  skill: z.string().describe("The AI partner's skill."),
});

export type GenerateSuggestedPromptInput = z.infer<
  typeof GenerateSuggestedPromptInputSchema
>;

const GenerateSuggestedPromptOutputSchema = z.object({
  suggestedPrompt: z.string().describe('A suggested prompt for the AI partner.'),
});

export type GenerateSuggestedPromptOutput = z.infer<
  typeof GenerateSuggestedPromptOutputSchema
>;

export async function generateSuggestedPrompt(
  input: GenerateSuggestedPromptInput
): Promise<GenerateSuggestedPromptOutput> {
  return generateSuggestedPromptFlow(input);
}

const generateSuggestedPromptPrompt = ai.definePrompt({
  name: 'generateSuggestedPromptPrompt',
  input: {schema: GenerateSuggestedPromptInputSchema},
  output: {schema: GenerateSuggestedPromptOutputSchema},
  prompt: `You are an AI prompt generator. You will generate a suggested prompt for a given AI partner skill. The prompt should be simple and easy to use, so that users can quickly get value from the AI partner.

Skill: {{{skill}}}

Suggested Prompt:`,
});

const generateSuggestedPromptFlow = ai.defineFlow(
  {
    name: 'generateSuggestedPromptFlow',
    inputSchema: GenerateSuggestedPromptInputSchema,
    outputSchema: GenerateSuggestedPromptOutputSchema,
  },
  async (input) => {
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const { output } = await generateSuggestedPromptPrompt(input);
        if (!output) {
          throw new Error('Failed to generate suggested prompt: No output from model.');
        }
        return output;
      } catch (e: any) {
        // Definitive fix: Only retry on 503. Throw all other errors immediately.
        if (e.message?.includes('503 Service Unavailable') && retries > 1) {
          console.warn(`Service unavailable, retrying in ${delay}ms... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          retries--;
        } else {
          // For any other error (like 429 quota, or if retries are exhausted), throw immediately.
          throw e;
        }
      }
    }

    // This part is only reached if all retries fail for 503 errors.
    throw new Error('Failed to generate suggested prompt after multiple retries for service unavailability.');
  }
);
