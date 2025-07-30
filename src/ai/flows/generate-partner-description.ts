'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a description of an AI partner.
 *
 * generatePartnerDescription - A function that generates a description of an AI partner.
 * GeneratePartnerDescriptionInput - The input type for the generatePartnerDescription function.
 * GeneratePartnerDescriptionOutput - The output type for the generatePartnerDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePartnerDescriptionInputSchema = z.object({
  partnerName: z.string().describe('The name of the AI partner.'),
  partnerSkill: z.string().describe('The specific skill or expertise of the AI partner.'),
});
export type GeneratePartnerDescriptionInput = z.infer<typeof GeneratePartnerDescriptionInputSchema>;

const GeneratePartnerDescriptionOutputSchema = z.object({
  description: z.string().describe('A short description of the AI partner and its capabilities, under 25 words.'),
});
export type GeneratePartnerDescriptionOutput = z.infer<typeof GeneratePartnerDescriptionOutputSchema>;

export async function generatePartnerDescription(
  input: GeneratePartnerDescriptionInput
): Promise<GeneratePartnerDescriptionOutput> {
  return generatePartnerDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePartnerDescriptionPrompt',
  input: {schema: GeneratePartnerDescriptionInputSchema},
  output: {schema: GeneratePartnerDescriptionOutputSchema},
  prompt: `Generate a very short, catchy description for an AI assistant. The description must be under 25 words.

Partner Name: {{partnerName}}
Partner's Main Skill: {{partnerSkill}}`,
});

const generatePartnerDescriptionFlow = ai.defineFlow(
  {
    name: 'generatePartnerDescriptionFlow',
    inputSchema: GeneratePartnerDescriptionInputSchema,
    outputSchema: GeneratePartnerDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate partner description.');
    }
    return output;
  }
);
