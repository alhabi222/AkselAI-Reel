
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Type, Image as ImageIcon, Mic, Video } from 'lucide-react';
import { generatePartnerDescription } from '@/ai/flows/generate-partner-description';
import type { Partner } from '@/lib/partners';
import { getRandomIcon } from '@/lib/partners';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card } from './ui/card';
import { logPartnerCreation } from '@/services/notion';


const formSchema = z.object({
  name: z.string().min(3, { message: 'Partner name must be at least 3 characters.' }).max(30, { message: 'Partner name must be less than 30 characters.' }),
  skill: z.string().min(10, { message: 'Skill description must be at least 10 characters.' }).max(100, { message: 'Skill description must be less than 100 characters.' }),
  capability: z.enum(['text', 'image', 'audio', 'video'], { required_error: 'You must select a capability.' }),
});

const capabilityConfig = {
    text: { price: 19, tier: 'Basic' as const, icon: Type },
    image: { price: 39, tier: 'Pro' as const, icon: ImageIcon },
    audio: { price: 39, tier: 'Pro' as const, icon: Mic },
    video: { price: 59, tier: 'Pro' as const, icon: Video },
}

interface CreatePartnerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPartnerCreated: (partner: Partner) => void;
}

export function CreatePartnerDialog({ isOpen, onOpenChange, onPartnerCreated }: CreatePartnerDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      skill: '',
      capability: 'text',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // 1. Generate description from AI
      const { description } = await generatePartnerDescription({
        partnerName: values.name,
        partnerSkill: values.skill,
      });

      const selectedCapability = capabilityConfig[values.capability];

      // 2. Create the new partner object
      const newPartner: Partner = {
        slug: values.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        name: values.name,
        skill: values.skill,
        description,
        icon: getRandomIcon(),
        price: selectedCapability.price,
        tier: selectedCapability.tier,
        version: 1.0,
        capabilities: [values.capability],
        config: {},
      };

      // 3. Callback to add partner to the list
      onPartnerCreated(newPartner);
      
      toast({
        title: 'Partner Created!',
        description: `${newPartner.name} has been added to your team.`,
      });
      
      // 4. (Non-critical) Log to Notion. This runs in the background.
      // We don't await it so it doesn't block the UI response.
      logPartnerCreation({
        name: newPartner.name,
        skill: newPartner.skill,
        description: newPartner.description || '',
        capability: newPartner.capabilities[0],
      });


      // 5. Reset form and close dialog
      form.reset();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Failed to create partner:', error);
      let description = 'Terjadi kesalahan saat membuat partner AI Anda. Silakan coba lagi.';
      if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
        description = "Layanan sedang dalam permintaan tinggi. Coba lagi dalam beberapa saat.";
      }
      toast({
        variant: 'destructive',
        title: 'Pembuatan Gagal',
        description: description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a New AI Partner</DialogTitle>
          <DialogDescription>
            Define your new partner's name, skill, and primary capability. The price will be set automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Marketing Maverick" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skill"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Core Skill</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Creates viral social media campaigns" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="capability"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Primary Capability</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                      {Object.entries(capabilityConfig).map(([key, { price, tier, icon: Icon }]) => (
                        <FormItem key={key}>
                          <FormControl>
                            <RadioGroupItem value={key as 'text' | 'image' | 'audio' | 'video'} id={key} className="sr-only" />
                          </FormControl>
                          <FormLabel htmlFor={key}>
                            <Card className="cursor-pointer transition-all hover:border-accent has-[input:checked]:border-accent has-[input:checked]:ring-2 has-[input:checked]:ring-accent">
                                <div className="p-4 text-center">
                                    <Icon className="mx-auto h-8 w-8 text-accent mb-2" />
                                    <p className="font-semibold capitalize">{key}</p>
                                    <p className="text-sm text-muted-foreground">${price}/mo</p>
                                </div>
                            </Card>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Partner
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
