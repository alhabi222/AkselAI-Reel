
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { usePartners } from '@/hooks/use-partners';
import { SiteHeader } from '@/components/site-header';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useEffect } from 'react';
import { ClientOnly } from './client-only';

function MobileAwareSidebarCloser({ children }: { children: React.ReactNode }) {
    const { setOpenMobile } = useSidebar();
    const pathname = usePathname();

    useEffect(() => {
        setOpenMobile(false);
    }, [pathname, setOpenMobile]);

    return <>{children}</>;
}

export function AppWithSidebar({ children }: { children: React.ReactNode }) {
  const { partners } = usePartners();
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden">
        <ClientOnly>
          <MobileAwareSidebarCloser>
            <Sidebar
              collapsible="icon"
              className="hidden border-r bg-card/40 text-card-foreground md:flex"
            >
              <SidebarContent>
                <SidebarMenu>
                  {partners.map(partner => {
                    const Icon = LucideIcons[partner.icon as keyof typeof LucideIcons] ?? LucideIcons.Bot;
                    const isActive = pathname === `/partner/${partner.slug}`;
                    return (
                      <SidebarMenuItem key={partner.slug}>
                        <SidebarMenuButton
                          asChild
                          tooltip={partner.name}
                          isActive={isActive}
                        >
                          <Link href={`/partner/${partner.slug}`}>
                            <Icon />
                            <span>{partner.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
          </MobileAwareSidebarCloser>
        </ClientOnly>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
