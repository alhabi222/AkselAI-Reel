
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lightbulb, Rocket } from 'lucide-react';
import { generatePitchIdeas, GeneratePitchIdeasOutput } from '@/ai/flows/generate-pitch-ideas';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function StrategicAdvisorCard() {
  const [advice, setAdvice] = useState<GeneratePitchIdeasOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetAdvice = async () => {
    setIsLoading(true);
    setAdvice(null);
    try {
      const result = await generatePitchIdeas({
        appName: 'AkselAI',
        appDescription: 'Platform AI-sebagai-Layanan (AIaaS) untuk akselerasi inovasi keuangan dan layanan publik. Memberdayakan pengguna untuk membangun, melatih, dan men-deploy Partner AI khusus.',
        targetAudience: 'Institusi Keuangan, UMKM, Lembaga Pemerintah, dan Developer.',
      });
      setAdvice(result);
    } catch (error: any) {
      console.error('Failed to get strategic advice:', error);
      let description = 'Terjadi kesalahan saat meminta saran. Silakan coba lagi.';
       if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
        description = "Layanan sedang dalam permintaan tinggi. Coba lagi dalam beberapa saat.";
      }
      toast({
        variant: 'destructive',
        title: 'Gagal Mendapatkan Saran',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
                <Lightbulb className="h-6 w-6 text-accent" />
            </div>
            <div>
                <CardTitle className="font-headline text-xl">Penasihat Strategis</CardTitle>
                <CardDescription>
                Butuh ide untuk presentasi? Dapatkan saran instan berbasis AI untuk memperkuat proposal Anda.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        )}
        {advice && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold font-headline text-lg mb-2">Saran Kategori Kompetisi:</h3>
              <Accordion type="single" collapsible className="w-full">
                {advice.competitionSuggestions.map((suggestion, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{suggestion.category}</AccordionTrigger>
                    <AccordionContent>{suggestion.justification}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            <div>
              <h3 className="font-bold font-headline text-lg mb-2">Poin Kunci untuk Presentasi:</h3>
               <Accordion type="single" collapsible className="w-full">
                {advice.pitchPoints.map((point, index) => (
                  <AccordionItem value={`item-pitch-${index}`} key={index}>
                    <AccordionTrigger>{point.point}</AccordionTrigger>
                    <AccordionContent>{point.elaboration}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGetAdvice} disabled={isLoading} className="ml-auto">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-4 w-4" />
          )}
          {advice ? 'Buat Ide Baru' : 'Beri Aku Ide!'}
        </Button>
      </CardFooter>
    </Card>
  );
}
