
'use server';

/**
 * @fileOverview A Genkit flow to generate audio from text.
 *
 * This flow uses the Google AI Gemini TTS model to convert text to speech.
 * It can handle single-speaker and multi-speaker prompts.
 * - generateAudio - The main function to call the flow.
 * - GenerateAudioInput - The input type for the flow.
 * - GenerateAudioOutput - The output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

const GenerateAudioInputSchema = z.object({
  text: z.string().describe('The text to convert to speech. For multi-speaker, format as "SpeakerX: message".'),
});
export type GenerateAudioInput = z.infer<typeof GenerateAudioInputSchema>;

const GenerateAudioOutputSchema = z.object({
  audioUrl: z.string().describe('The data URI of the generated WAV audio.'),
});
export type GenerateAudioOutput = z.infer<typeof GenerateAudioOutputSchema>;

export async function generateAudio(input: GenerateAudioInput): Promise<GenerateAudioOutput> {
  return generateAudioFlow(input);
}

// Helper function to convert raw PCM audio data to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: GenerateAudioInputSchema,
    outputSchema: GenerateAudioOutputSchema,
  },
  async ({ text }) => {
    console.log('Generating audio for text:', text);

    const isMultiSpeaker = /Speaker\d+:/.test(text);

    let speechConfig: any = {
        // Default single speaker config
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
    };

    if (isMultiSpeaker) {
        // Multi-speaker config
        speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                {
                    speaker: 'Speaker1',
                    voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Algenib' },
                    },
                },
                {
                    speaker: 'Speaker2',
                    voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Achernar' },
                    },
                },
                 {
                    speaker: 'Speaker3',
                    voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Capella' },
                    },
                },
                ],
            },
        };
    }

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      prompt: text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig,
      },
    });

    if (!media?.url) {
      throw new Error('Audio generation failed to produce audio.');
    }
    
    // The model returns raw PCM data in a data URI. We need to convert it to WAV.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    const audioUrl = `data:audio/wav;base64,${wavBase64}`;

    console.log('Audio generated successfully.');
    return { audioUrl };
  }
);
