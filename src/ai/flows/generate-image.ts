
'use server';

/**
 * @fileOverview A Genkit flow to generate an image from a text prompt.
 *
 * This flow uses the Google AI Gemini 2.0 Flash experimental image generation model.
 * - generateImage - The main function to call the flow.
 * - GenerateImageInput - The input type for the flow.
 * - GenerateImageOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt }) => {
    console.log('Generating image with prompt:', prompt);

    const { media } = await ai.generate({
      // IMPORTANT: This specific model is required for image generation.
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        // IMPORTANT: Both TEXT and IMAGE modalities are required.
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const imageUrl = media?.url;
    if (!imageUrl) {
      throw new Error('Image generation failed to produce an image.');
    }

    console.log('Image generated successfully.');
    return { imageUrl };
  }
);
