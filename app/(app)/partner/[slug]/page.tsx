
'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePartners } from '@/hooks/use-partners';
import { useEffect, useState } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { Loader2, Zap, Award, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { evolvePartner } from '@/ai/flows/evolve-partner';
import { useToast } from '@/hooks/use-toast';

const XP_PER_MESSAGE = 20;
const XP_TO_EVOLVE = 100;

export default function PartnerPage() {
  const params = useParams();
  const router = useRouter();
  const { partners, updatePartner } = usePartners();
  const slug = params.slug as string;

  const [xp, setXp] = useState(0);
  const [isEvolving, setIsEvolving] = useState(false);
  const { toast } = useToast();

  const partner = partners.find(p => p.slug === slug);
  const isEvolutionDisabled = partner?.slug === 'language-architect';

  useEffect(() => {
    // Load XP from local storage only on the client side after mount
    if (partner) {
      const storedXp = localStorage.getItem(`skillai-xp-${partner.slug}`);
      setXp(storedXp ? parseInt(storedXp, 10) : 0);
    }
  }, [partner]);

  const handleMessageSent = () => {
    if (isEvolutionDisabled) return;

    if (xp < XP_TO_EVOLVE && partner) {
      const newXp = xp + XP_PER_MESSAGE;
      setXp(newXp);
      localStorage.setItem(`skillai-xp-${partner.slug}`, newXp.toString());
    }
  };

  const handleEvolve = async () => {
    if (!partner || xp < XP_TO_EVOLVE) return;
    setIsEvolving(true);
    try {
      const { newSkillDescription, newVersion } = await evolvePartner({
        partnerName: partner.name,
        currentSkill: partner.skill,
        currentVersion: partner.version,
      });

      const evolvedPartner = {
        ...partner,
        skill: newSkillDescription,
        version: newVersion,
      };

      updatePartner(slug, evolvedPartner);
      setXp(0);
      localStorage.removeItem(`skillai-xp-${slug}`);

      toast({
        title: 'Evolution Complete!',
        description: `${partner.name} has evolved to v${newVersion.toFixed(1)} with a new skill!`,
      });
      
      // Use sessionStorage to notify the home page
      sessionStorage.setItem('skillai-evolved-slug', slug);
      router.push('/');


    } catch (error: any) {
      console.error('Failed to evolve partner:', error);
      let description = 'An error occurred while evolving your partner. Please try again.';
      if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
        description = "Services are in high demand. Please try again in a few moments.";
      }
      toast({
        variant: 'destructive',
        title: 'Evolution Failed',
        description,
      });
    } finally {
      setIsEvolving(false);
    }
  };


  if (!partner) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const canEvolve = xp >= XP_TO_EVOLVE;

  return (
    <div className="flex h-screen max-h-screen">
      <div className="flex-1 flex flex-col h-full">
        <ChatInterface 
          partner={partner} 
          onMessageSent={handleMessageSent} 
        />
      </div>
      <aside className="w-80 border-l bg-card/40 p-4 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
               <Award className="text-accent" />
              <span>Partner Details</span>
            </CardTitle>
            <CardDescription>
              {isEvolutionDisabled ? 'Potensi Penuh' : `Versi ${partner.version.toFixed(1)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg">{partner.name}</h3>
            <p className="text-sm text-muted-foreground">{partner.skill}</p>
          </CardContent>
        </Card>
        
        {!isEvolutionDisabled && (
          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Star className="text-accent" />
                <span>Evolution</span>
              </CardTitle>
              <CardDescription>
                Interact with your partner to gain XP and unlock its next evolution.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center">
              <div className="space-y-3 text-center">
                <Progress value={Math.min(xp, XP_TO_EVOLVE)} max={XP_TO_EVOLVE} />
                <p className="text-sm text-muted-foreground">
                  Experience: {xp} / {XP_TO_EVOLVE}
                </p>
                <Button onClick={handleEvolve} disabled={!canEvolve || isEvolving} className="w-full">
                  {isEvolving ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Zap className="mr-2" />
                      Evolve Partner
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}
