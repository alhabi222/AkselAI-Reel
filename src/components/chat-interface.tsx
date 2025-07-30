
"use client";

import { useState, useEffect, useRef, useId } from 'react';
import Image from 'next/image';
import type { Partner } from '@/lib/partners';
import { generateSuggestedPrompt } from '@/ai/flows/generate-suggested-prompt';
import { executeInstruction, ExecuteInstructionOutput } from '@/ai/flows/execute-instruction';
import { generateImage, GenerateImageOutput } from '@/ai/flows/generate-image';
import { generateAudio, GenerateAudioOutput } from '@/ai/flows/generate-audio';
import { generateVideo, GenerateVideoOutput } from '@/ai/flows/generate-video';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Sparkles, User, HelpCircle, Image as ImageIcon, Mic, Video } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';
import { StrategicAdvisorCard } from './strategic-advisor-card';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: React.ReactNode;
  type: 'text' | 'image' | 'audio' | 'video' | 'component';
  originalText?: string;
}

interface ChatInterfaceProps {
  partner: Partner;
  onMessageSent: () => void;
}

export function ChatInterface({ partner, onMessageSent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompt, setSuggestedPrompt] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();

  const Icon = LucideIcons[partner.icon] || LucideIcons.Bot;
  const partnerCapability = partner.capabilities?.[0] || 'text';

  useEffect(() => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setSuggestedPrompt(null);
    
     if (partner.slug === 'penasihat-strategis') {
      setMessages([{
        id: `${uniqueId}-initial`,
        role: 'assistant',
        content: <StrategicAdvisorCard />,
        type: 'component',
      }]);
      return;
    }

    const fetchSuggestion = async () => {
        try {
            let prompt: string;
            if (partner.slug === 'cerdas-keuangan') {
              prompt = 'Berapa harga saham Telkom (TLKM)?';
            } else if (partner.slug === 'analis-kebijakan-publik') {
              prompt = 'Berapa populasi kota Jakarta?';
            } else if (partnerCapability === 'text') {
                 const result = await generateSuggestedPrompt({ skill: partner.skill });
                 prompt = result.suggestedPrompt;
            } else if (partnerCapability === 'image') {
                prompt = 'Sebuah poster sinematik untuk startup AI bernama "AkselAI"';
            } else if (partnerCapability === 'audio') {
                prompt = 'Speaker1: Halo dan selamat datang di Partner AI SkillAI. Ada yang bisa saya bantu?';
            } else if (partnerCapability === 'video') {
                prompt = 'Seekor naga agung terbang di atas hutan mistis saat fajar.';
            } else {
                prompt = `Ceritakan proyek Anda yang berkaitan dengan ${partner.skill}.`;
            }
             setSuggestedPrompt(prompt);
        } catch (error: any) {
            console.error("Failed to fetch suggested prompt", error);
            let description = 'Terjadi kesalahan saat membuat saran.';
            if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
                description = "Layanan sedang dalam permintaan tinggi. Coba lagi nanti.";
            }
            toast({
              variant: "destructive",
              title: "Gagal Memuat Saran",
              description,
            });
            setSuggestedPrompt(`Ceritakan proyek Anda yang berkaitan dengan ${partner.skill}.`);
        }
    };
    fetchSuggestion();
  }, [partner, toast, uniqueId]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);


  const handleSendMessage = async (messageContent?: string) => {
    const content = (messageContent || input).trim();
    if (!content) return;

    onMessageSent(); 

    const userMessage: Message = {
      id: `${uniqueId}-${Date.now()}`,
      role: 'user',
      content,
      type: 'text',
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
        let aiMessage: Message;
        const chatHistoryForAI = newMessages.map(m => ({ 
            role: m.role,
            content: (typeof m.content === 'string' ? m.content : m.originalText) || 'Input non-tekstual dari pengguna.'
        }));


        if (partnerCapability === 'image') {
            const aiResponse: GenerateImageOutput = await generateImage({ prompt: content });
            aiMessage = {
                id: `${uniqueId}-${Date.now() + 1}`,
                role: 'assistant',
                content: aiResponse.imageUrl,
                type: 'image',
            };
        } else if (partnerCapability === 'audio') {
             const aiResponse: GenerateAudioOutput = await generateAudio({ text: content });
             aiMessage = {
                id: `${uniqueId}-${Date.now() + 1}`,
                role: 'assistant',
                content: aiResponse.audioUrl,
                type: 'audio',
                originalText: content,
             }
        } else if (partnerCapability === 'video') {
             const aiResponse: GenerateVideoOutput = await generateVideo({ prompt: content });
             aiMessage = {
                id: `${uniqueId}-${Date.now() + 1}`,
                role: 'assistant',
                content: aiResponse.videoUrl,
                type: 'video',
                originalText: content,
             }
        } else {
            const aiResponse: ExecuteInstructionOutput = await executeInstruction({
                partnerSlug: partner.slug,
                skill: partner.skill,
                version: partner.version,
                history: chatHistoryForAI as any,
                config: partner.config,
            });

            aiMessage = {
                id: `${uniqueId}-${Date.now() + 1}`,
                role: 'assistant',
                content: aiResponse.response,
                type: 'text',
            };
        }

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any)      {
      console.error("Failed to get AI response", error);
      let description = "Gagal mendapatkan respons dari partner AI. Silakan coba lagi.";
      if (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('503'))) {
        description = "Layanan sedang dalam permintaan tinggi atau sementara tidak tersedia. Coba lagi nanti.";
      }
       toast({
        variant: "destructive",
        title: "Error",
        description,
      });
       const aiMessage: Message = {
        id: `${uniqueId}-${Date.now() + 1}`,
        role: 'assistant',
        content: `Sepertinya saya sedang mengalami masalah koneksi. Silakan coba lagi sesaat lagi.`,
        type: 'text',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePromptClick = (prompt: string) => {
    if (prompt) {
      handleSendMessage(prompt);
    }
  };
  
  const isAdvisor = partner.slug === 'penasihat-strategis';


  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.length === 0 && !isAdvisor && (
            <div className="text-center py-16 px-4">
              <div className="inline-block bg-primary/10 p-4 rounded-full mb-4">
                <Icon className="h-12 w-12 text-accent" />
              </div>
              <h2 className="text-2xl font-bold font-headline">Mulai percakapan dengan {partner.name}</h2>
              <p className="text-muted-foreground mt-2 mb-6">{partner.skill}</p>
              {suggestedPrompt && (
                <Button variant="outline" onClick={() => handlePromptClick(suggestedPrompt)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {suggestedPrompt}
                </Button>
              )}
            </div>
          )}
          {messages.map((message) => (
             message.type === 'component' ? (
              <div key={message.id}>{message.content}</div>
            ) : (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-accent">
                    <Icon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xl rounded-xl text-sm shadow-md',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground px-4 py-3'
                    : 'bg-card',
                  message.type === 'text' && 'px-4 py-3',
                  (message.type === 'image' || message.type === 'video') && 'p-2 bg-card/80',
                  message.type === 'audio' && 'p-3 bg-card',
                )}
              >
                {message.type === 'text' && typeof message.content === 'string' ? (
                  <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: message.content.replace(/\\n/g, '<br />').replace(/\n/g, '<br />') }} />
                ) : message.type === 'image' && typeof message.content === 'string' ? (
                    <div className="relative aspect-square w-80">
                      <Image src={message.content} alt="Generated by AI" layout="fill" objectFit="contain" className="rounded-lg" />
                    </div>
                ) : message.type === 'video' && typeof message.content === 'string' ? (
                    <div className="relative w-80 aspect-video">
                        <video src={message.content} controls className="rounded-lg w-full h-full" />
                    </div>
                ) : message.type === 'audio' && typeof message.content === 'string' ? (
                  <div className='w-full max-w-sm'>
                    <audio controls src={message.content} className="w-full" />
                    {message.originalText && (
                        <p className="text-xs text-muted-foreground mt-2 p-1 italic">
                           {message.originalText}
                        </p>
                    )}
                  </div>
                ) : (
                  message.content
                )}
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-accent">
                  <Icon className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-md rounded-xl px-4 py-3 text-sm shadow-md bg-card flex items-center space-x-2">
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
       {!isAdvisor && (
      <div className="relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={
            partnerCapability === 'image'
              ? `Jelaskan gambar yang Anda ingin ${partner.name} buat...`
              : partnerCapability === 'audio'
              ? `Ketik teks yang ingin diucapkan ${partner.name}...`
              : partnerCapability === 'video'
              ? `Jelaskan video yang Anda ingin ${partner.name} buat...`
              : `Kirim pesan ke ${partner.name}...`
          }
          className="pr-16 py-3 min-h-[52px] resize-none"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/90"
          onClick={() => handleSendMessage()}
          disabled={!input.trim() || isLoading}
          aria-label="Kirim pesan"
        >
          {partnerCapability === 'image' ? (
            <ImageIcon className="h-5 w-5" />
          ) : partnerCapability === 'audio' ? (
            <Mic className="h-5 w-5" />
          ) : partnerCapability === 'video' ? (
            <Video className="h-5 w-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
       )}
    </div>
  );
}
