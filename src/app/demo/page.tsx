
'use client';

import { useEffect, useState } from 'react';
import { Loader2, PlusCircle, RotateCcw } from 'lucide-react';
import { usePartners } from '@/hooks/use-partners';
import { PartnerCard } from '@/components/partner-card';
import { Button } from '@/components/ui/button';
import { CreatePartnerDialog } from '@/components/create-partner-dialog';
import { ClientOnly } from '@/components/client-only';
import { SiteHeader } from '@/components/site-header';
import { AuthProvider } from '@/hooks/use-auth';
import { PartnersProvider } from '@/hooks/use-partners';
import { Toaster } from '@/components/ui/toaster';

function DemoPageContent() {
  const { partners, loading, resetPartners, addPartner } = usePartners();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold font-headline tracking-tight sm:text-4xl">
              Selamat Datang di Demo AkselAI
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-muted-foreground mx-auto">
              Ini adalah lingkungan demo interaktif. Coba buat Partner AI Anda sendiri atau jelajahi yang sudah ada. Semua data partner di bawah ini dikelola langsung dari Notion.
            </p>
        </div>
        
        <div className="flex justify-center items-center gap-2 mb-8">
            <Button variant="outline" size="sm" onClick={resetPartners}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Sinkronkan dari Notion
            </Button>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Buat Partner Baru
            </Button>
        </div>


        <ClientOnly>
          {loading ? (
             <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {partners.map(partner => (
                <PartnerCard
                    key={partner.slug}
                    partner={partner}
                />
                ))}
            </div>
          )}
           { !loading && partners.length === 0 && (
              <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-bold font-headline">Database Notion Kosong</h3>
                <p className="text-muted-foreground mt-2">
                  Tidak ada partner yang berstatus "Published" di database Notion Anda. <br/> Tambahkan beberapa partner di Notion dan klik "Sinkronkan" untuk melihatnya di sini.
                </p>
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


export default function DemoPage() {
    return (
        <AuthProvider>
            <PartnersProvider>
                <div className="flex flex-col h-screen">
                    <SiteHeader />
                    <main className="flex-1 overflow-y-auto">
                        <DemoPageContent />
                    </main>
                    <Toaster />
                </div>
            </PartnersProvider>
        </AuthProvider>
    )
}
