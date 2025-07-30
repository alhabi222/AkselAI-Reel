
'use client';

import Link from 'next/link';
import { Bot, LogOut, User as UserIcon, Clock, PanelLeft, Moon, Sun, Home, Play } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from './ui/skeleton';
import { Logo } from './logo';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function SidebarToggle() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('skillai-theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('skillai-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export function SiteHeader() {
  const { user, logout, isTrialActive, daysRemainingInTrial, loading } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPartnerPage = pathname.startsWith('/partner/');
  const isDemoPage = pathname === '/demo';


  const getTrialMessage = () => {
    if (!user) return null;
    if (isTrialActive) {
      return `Free trial: ${daysRemainingInTrial} days remaining`;
    }
    return 'Free trial has ended.';
  };
  
  const renderNavContent = () => {
    if (loading && !isAuthPage) {
      return (
        <div className="flex items-center gap-4">
          <Skeleton className="hidden h-6 w-48 md:block" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      );
    }

    if (user) {
      return (
        <>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{getTrialMessage()}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-accent">
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">My Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="md:hidden">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{getTrialMessage()}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="md:hidden" />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    }
    
    return (
       <>
          <Button asChild variant="outline" size="sm">
            <Link href="/demo">
              <Play className="mr-2 h-4 w-4" />
              Lihat Demo
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Register</Link>
          </Button>
        </>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        <div className="flex items-center gap-2 mr-auto">
          { !isAuthPage && !isDemoPage && user && (
            <SidebarToggle />
          )}
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </div>
        
        <nav className="flex items-center gap-4">
          <ThemeToggle />
           { (isPartnerPage || isDemoPage) && (
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          )}
          {renderNavContent()}
        </nav>
      </div>
    </header>
  );
}
