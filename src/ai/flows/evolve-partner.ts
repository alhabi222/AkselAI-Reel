'use server';

/**
 * @fileOverview This file defines a Genkit flow for evolving an AI partner's skill.
 *
 * evolvePartner - A function that simulates the evolution of an AI partner by generating a new, more advanced skill description.
 * EvolvePartnerInput - The input type for the evolvePartner function.
 * EvolvePartnerOutput - The output type for the evolvePartner function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvolvePartnerInputSchema = z.object({
  partnerName: z.string().describe('The name of the AI partner.'),
  currentSkill: z.string().describe('The current skill description of the AI partner.'),
  currentVersion: z.number().describe('The current version of the AI partner.'),
});
export type EvolvePartnerInput = z.infer<typeof EvolvePartnerInputSchema>;

const EvolvePartnerOutputSchema = z.object({
  newSkillDescription: z
    .string()
    .describe("The new, more advanced skill description for the partner's next version."),
  newVersion: z.number().describe('The new version number.'),
});
export type EvolvePartnerOutput = z.infer<typeof EvolvePartnerOutputSchema>;

export async function evolvePartner(input: EvolvePartnerInput): Promise<EvolvePartnerOutput> {
  return evolvePartnerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evolvePartnerPrompt',
  input: {schema: EvolvePartnerInputSchema},
  output: {schema: EvolvePartnerOutputSchema},
  system: `You are a system that evolves AI assistants. Your task is to upgrade an AI partner's skill to the next level.
Based on the partner's name, current skill, and version, generate a new, more advanced skill description that reflects learning and growth.
The new version should be the current version incremented by 0.1.`,
  prompt: `AI Partner Name: {{partnerName}}
Current Skill: {{currentSkill}}
Current Version: {{currentVersion}}

Generate an evolved skill description for version {{currentVersion}} + 0.1.`,
});

const evolvePartnerFlow = ai.defineFlow(
  {
    name: 'evolvePartnerFlow',
    inputSchema: EvolvePartnerInputSchema,
    outputSchema: EvolvePartnerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to evolve partner.');
    }
    // Ensure the version is correctly incremented as a number
    output.newVersion = parseFloat((input.currentVersion + 0.1).toFixed(1));
    return output;
  }
);
