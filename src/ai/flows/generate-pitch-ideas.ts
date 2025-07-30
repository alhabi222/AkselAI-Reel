
'use server';

/**
 * @fileOverview A Genkit flow to generate strategic advice for a startup idea.
 *
 * It provides ideas for competitions to enter and key pitch points.
 * - generatePitchIdeas - The main function to call the flow.
 * - GeneratePitchIdeasInput - The input type for the flow.
 * - GeneratePitchIdeasOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePitchIdeasInputSchema = z.object({
  appName: z.string().describe('The name of the application.'),
  appDescription: z.string().describe('A brief description of what the application does.'),
  targetAudience: z.string().describe('The target audience for the application.'),
});
export type GeneratePitchIdeasInput = z.infer<typeof GeneratePitchIdeasInputSchema>;

const GeneratePitchIdeasOutputSchema = z.object({
  competitionSuggestions: z.array(z.object({
    category: z.string().describe('Kategori kompetisi (misalnya, Startup Umum, AI/ML, Dampak Sosial).'),
    justification: z.string().describe('Alasan mengapa kategori ini cocok untuk aplikasi tersebut.'),
  })).describe('Daftar saran kategori kompetisi.'),
  pitchPoints: z.array(z.object({
    point: z.string().describe('Poin penjualan utama untuk presentasi (pitch).'),
    elaboration: z.string().describe('Penjelasan singkat mengenai poin penjualan tersebut.'),
  })).describe('Poin-poin kunci untuk disertakan dalam pitch deck atau presentasi.'),
});
export type GeneratePitchIdeasOutput = z.infer<typeof GeneratePitchIdeasOutputSchema>;


export async function generatePitchIdeas(input: GeneratePitchIdeasInput): Promise<GeneratePitchIdeasOutput> {
  return generatePitchIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePitchIdeasPrompt',
  input: {schema: GeneratePitchIdeasInputSchema},
  output: {schema: GeneratePitchIdeasOutputSchema},
  system: `Anda adalah seorang penasihat startup kelas dunia. Tugas Anda adalah memberikan saran strategis yang konkret dan dapat ditindaklanjuti untuk proyek perangkat lunak tahap awal dalam Bahasa Indonesia.
Berdasarkan nama aplikasi, deskripsi, dan target audiens yang diberikan, Anda akan:
1.  Menyarankan 3-4 kategori kompetisi atau hackathon yang berbeda yang bisa diikuti oleh proyek tersebut. Untuk masing-masing, berikan justifikasi singkat.
2.  Menghasilkan 3-4 poin presentasi (pitch) yang kuat yang menyoroti kekuatan dan potensi proyek. Untuk setiap poin, berikan elaborasi singkat.
Fokus pada kreativitas, potensi pasar, dan inovasi. Saran harus bersifat mendorong dan praktis. Seluruh output harus dalam Bahasa Indonesia.`,
  prompt: `
Nama Aplikasi: {{appName}}
Deskripsi: {{appDescription}}
Target Audiens: {{targetAudience}}

Harap hasilkan saran kompetisi dan poin-poin presentasi utama berdasarkan informasi ini dalam Bahasa Indonesia.
`,
});

const generatePitchIdeasFlow = ai.defineFlow(
  {
    name: 'generatePitchIdeasFlow',
    inputSchema: GeneratePitchIdeasInputSchema,
    outputSchema: GeneratePitchIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate strategic advice.');
    }
    return output;
  }
);
