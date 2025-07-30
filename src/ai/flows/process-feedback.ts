'use server';

/**
 * @fileOverview This file defines a Genkit flow for processing user feedback.
 *
 * processFeedback - A function that receives and logs user feedback about the AI partners.
 * ProcessFeedbackInput - The input type for the processFeedback function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { logFeedback } from '@/services/notion';

const ProcessFeedbackInputSchema = z.object({
  feedback: z.string().describe('The user\'s feedback text.'),
});
export type ProcessFeedbackInput = z.infer<typeof ProcessFeedbackInputSchema>;

// The output is just a confirmation, so we can use a simple object.
const ProcessFeedbackOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ProcessFeedbackOutput = z.infer<typeof ProcessFeedbackOutputSchema>;

export async function processFeedback(input: ProcessFeedbackInput): Promise<ProcessFeedbackOutput> {
  return processFeedbackFlow(input);
}

// This flow now logs the feedback to the console and to Notion.
const processFeedbackFlow = ai.defineFlow(
  {
    name: 'processFeedbackFlow',
    inputSchema: ProcessFeedbackInputSchema,
    outputSchema: ProcessFeedbackOutputSchema,
  },
  async (input) => {
    console.log('New user feedback received:');
    console.log(`"""\n${input.feedback}\n"""`);
    
    // Asynchronously log to Notion without blocking the response to the user.
    logFeedback(input.feedback);
    
    return {
      success: true,
      message: 'Feedback received successfully.',
    };
  }
);
