'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { PartnersProvider } from '@/hooks/use-partners';
import { AppWithSidebar } from '@/components/app-with-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PartnersProvider>
        <SidebarProvider>
          <AppWithSidebar>
            {children}
          </AppWithSidebar>
        </SidebarProvider>
        <Toaster />
      </PartnersProvider>
    </AuthProvider>
  );
}
