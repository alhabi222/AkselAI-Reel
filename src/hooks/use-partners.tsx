
'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { Partner } from '@/lib/partners';
import { useToast } from './use-toast';
import { getPartnersFromNotion } from '@/services/notion';

const PARTNERS_STORAGE_KEY = 'skillai-partners';

interface PartnersContextType {
  partners: Partner[];
  loading: boolean;
  addPartner: (newPartner: Partner) => void;
  deletePartner: (slug: string) => void;
  resetPartners: () => void;
  updatePartner: (slug: string, updatedPartner: Partner) => void;
}

const PartnersContext = createContext<PartnersContextType | undefined>(undefined);

export function PartnersProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const notionPartners = await getPartnersFromNotion();
      if (notionPartners.length > 0) {
        setPartners(notionPartners);
        updateStorage(notionPartners);
      } else {
        const storedPartners = localStorage.getItem(PARTNERS_STORAGE_KEY);
        if (storedPartners) {
          setPartners(JSON.parse(storedPartners));
        } else {
          setPartners([]);
        }
      }
    } catch (error) {
      console.error('Failed to load partners from Notion', error);
      const storedPartners = localStorage.getItem(PARTNERS_STORAGE_KEY);
      setPartners(storedPartners ? JSON.parse(storedPartners) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const updateStorage = (updatedPartners: Partner[]) => {
    try {
      localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(updatedPartners));
    } catch (error) {
      console.error('Failed to save partners to localStorage', error);
      toast({
        variant: 'destructive',
        title: 'Storage Error',
        description: 'Could not save partner changes.',
      });
    }
  };

  const addPartner = useCallback((newPartner: Partner) => {
    const slugExists = partners.some(p => p.slug === newPartner.slug);
    if (slugExists) {
        toast({
            variant: 'destructive',
            title: 'Partner Already Exists',
            description: `A partner with a similar name already exists. Please choose a different name.`,
        });
        return;
    }
    const updatedPartners = [...partners, newPartner];
    setPartners(updatedPartners);
    updateStorage(updatedPartners);
    toast({
        title: 'Partner Added!',
        description: `${newPartner.name} was added. It will be synced from Notion on next refresh.`,
    });
  }, [partners, toast]);


  const deletePartner = useCallback((slug: string) => {
    const updatedPartners = partners.filter(p => p.slug !== slug);
    setPartners(updatedPartners);
    updateStorage(updatedPartners);
    toast({
      title: 'Partner Deleted Locally',
      description: 'The AI partner has been removed from your local session.',
    });
  }, [partners, toast]);

  const resetPartners = useCallback(async () => {
    setLoading(true);
    try {
        const notionPartners = await getPartnersFromNotion();
        setPartners(notionPartners);
        updateStorage(notionPartners);
        toast({
            title: 'Partners Synced',
            description: 'Your partner list has been re-synced from Notion.',
        });
    } catch (error) {
        console.error('Failed to reset partners from Notion', error);
        toast({
            variant: 'destructive',
            title: 'Sync Error',
            description: 'Could not connect to Notion to sync partners.',
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  const updatePartner = useCallback((slug: string, updatedPartnerData: Partner) => {
    const updatedPartners = partners.map(p => (p.slug === slug ? updatedPartnerData : p));
    setPartners(updatedPartners);
    updateStorage(updatedPartners);
  }, [partners]);

  const value = { partners, loading, addPartner, deletePartner, resetPartners, updatePartner };

  return <PartnersContext.Provider value={value}>{children}</PartnersContext.Provider>;
}

export function usePartners() {
    const context = useContext(PartnersContext);
    if (context === undefined) {
        throw new Error('usePartners must be used within a PartnersProvider');
    }
    return context;
}
