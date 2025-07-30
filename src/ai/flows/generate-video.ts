
'use server';

/**
 * @fileOverview A Genkit flow to generate video from a text prompt using Veo.
 * - generateVideo - The main function to call the flow.
 * - GenerateVideoInput - The input type for the flow.
 * - GenerateVideoOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { MediaPart } from 'genkit';


const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate a video from.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}


async function getVideoAsBase64(video: MediaPart): Promise<string> {
  const fetch = (await import('node-fetch')).default;
  
  // Add API key before fetching the video.
  const videoDownloadResponse = await fetch(
    `${video.media!.url}&key=${process.env.GOOGLE_API_KEY}`
  );

  if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
    throw new Error('Failed to fetch video');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of videoDownloadResponse.body) {
    chunks.push(chunk as Buffer);
  }
  const buffer = Buffer.concat(chunks);
  
  return buffer.toString('base64');
}


const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({ prompt }) => {
    console.log('Generating video with prompt:', prompt);

    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: prompt,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      console.log('Checking video generation status...');
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      console.error('Video generation failed:', operation.error);
      throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video in the operation result.');
    }
    
    const videoBase64 = await getVideoAsBase64(video);
    const videoUrl = `data:video/mp4;base64,${videoBase64}`;

    console.log('Video generated successfully.');
    return { videoUrl };
  }
);
