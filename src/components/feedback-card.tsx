'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquareText, ThumbsUp } from 'lucide-react';
import { processFeedback } from '@/ai/flows/process-feedback';

export function FeedbackCard() {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Feedback',
        description: 'Please write your thoughts before submitting.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await processFeedback({ feedback });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An error occurred while submitting feedback. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="bg-card border-accent/50">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
            <ThumbsUp className="h-12 w-12 text-accent mb-4" />
            <h3 className="text-xl font-bold font-headline">Terima Kasih!</h3>
            <p className="text-muted-foreground mt-2">
              Saran Anda sangat berharga untuk kami dalam mengembangkan Partner AI.
            </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-primary/5 h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <MessageSquareText className="h-6 w-6 text-accent" />
          <div>
            <CardTitle>Punya Masukan?</CardTitle>
            <CardDescription>
              Kami ingin mendengar pendapat Anda tentang Partner AI selama masa uji coba gratis ini.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
        <CardContent className="flex-grow">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tuliskan ide, saran, atau kritik Anda di sini..."
            rows={4}
            disabled={isSubmitting}
            className="h-full"
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="ml-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Masukan
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
