import Link from 'next/link';
import type { Partner } from '@/lib/partners';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { MoreVertical, Trash2 } from 'lucide-react';

interface PartnerCardProps {
  partner: Partner;
  onDelete?: () => void;
  isGlowing?: boolean;
}

export function PartnerCard({ partner, onDelete, isGlowing = false }: PartnerCardProps) {
  const { isTrialActive } = useAuth();
  const Icon = LucideIcons[partner.icon] ?? LucideIcons.Bot;
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const cardContent = (
    <Card className={cn(
      "h-full flex flex-col transition-all duration-300 ease-in-out relative",
      isTrialActive ? "hover:border-accent hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1" : "opacity-60 bg-card/50",
      isGlowing && "border-accent shadow-lg shadow-accent/20 animate-pulse-once"
    )}>
      <CardHeader className="flex-row items-start gap-4 space-y-0 pr-12">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1">
          <CardTitle className="font-headline text-xl">{partner.name}</CardTitle>
          <CardDescription>{partner.skill}</CardDescription>
        </div>
        <Badge variant="outline" className="shrink-0">v{partner.version.toFixed(1)}</Badge>
      </CardHeader>
      
      {isTrialActive && onDelete && (
        <div className="absolute top-4 right-2" onClick={handleMenuClick}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )}

      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm">
          {partner.description}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" disabled={!isTrialActive}>
          {isTrialActive ? (
            <Link href={`/partner/${partner.slug}`}>Engage</Link>
          ) : (
            <span>Trial Ended</span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="group block h-full">
      {cardContent}
    </div>
  );
}
