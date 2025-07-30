
'use client';

import { useEffect, useState } from 'react';
import { Loader2, PlusCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePartners } from '@/hooks/use-partners';
import { useRouter } from 'next/navigation';
import { FeedbackCard } from '@/components/feedback-card';
import { PartnerCard } from '@/components/partner-card';
import { Button } from '@/components/ui/button';
import { CreatePartnerDialog } from '@/components/create-partner-dialog';
import { ClientOnly } from '@/components/client-only';
import { StrategicAdvisorCard } from '@/components/strategic-advisor-card';

export default function HomePage() {
  const { user, loading, isTrialActive } = useAuth();
  const { partners, deletePartner, resetPartners, addPartner } = usePartners();
  const router = useRouter();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Check for a recently evolved partner slug from sessionStorage
    const evolvedSlug = sessionStorage.getItem('skillai-evolved-slug');
    if (evolvedSlug) {
      setHighlightedSlug(evolvedSlug);
      sessionStorage.removeItem('skillai-evolved-slug'); // Clean up

      // Remove the highlight after the animation
      const timer = setTimeout(() => {
        setHighlightedSlug(null);
      }, 2000); // Animation is 1.5s, give it a little extra time

      return () => clearTimeout(timer);
    }
  }, []);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold font-headline tracking-tight sm:text-4xl">
                Selamat Datang di AkselAI
              </h1>
              <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
                {isTrialActive
                  ? 'Platform untuk mengakselerasi keahlian Anda, bukan menggantikannya. Ciptakan Partner AI untuk menangani tugas, sementara Anda fokus pada strategi.'
                  : 'Masa uji coba gratis Anda telah berakhir. Terima kasih telah menggunakan AkselAI.'}
              </p>
            </div>
            {isTrialActive && (
              <ClientOnly>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={resetPartners}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Buat Partner Baru
                  </Button>
                </div>
              </ClientOnly>
            )}
          </div>
        </div>

        <ClientOnly>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {partners.map(partner => (
              <PartnerCard
                key={partner.slug}
                partner={partner}
                onDelete={() => deletePartner(partner.slug)}
                isGlowing={partner.slug === highlightedSlug}
              />
            ))}
          </div>
          
           {isTrialActive && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-1">
                  <StrategicAdvisorCard />
                </div>
                <div className="md:col-span-1">
                    <FeedbackCard />
                </div>
              </div>
            )}

        </ClientOnly>
      </div>
      <CreatePartnerDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPartnerCreated={addPartner}
      />
    </>
  );
}
