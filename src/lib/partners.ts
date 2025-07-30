
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export type Partner = {
  slug: string;
  name: string;
  skill: string;
  description?: string;
  icon: keyof typeof LucideIcons;
  price: number;
  tier: 'Basic' | 'Pro' | 'Enterprise';
  version: number;
  capabilities: ('text' | 'image' | 'audio' | 'video')[];
  config?: { [key: string]: any };
};

const availableIcons: (keyof typeof LucideIcons)[] = [
  'Activity', 'Airplay', 'Album', 'Archive', 'Atom', 'Award', 'BadgeCheck',
  'Beaker', 'Bell', 'Book', 'Bookmark', 'BrainCircuit', 'Briefcase', 'Brush', 'Calculator',
  'Calendar', 'Camera', 'CircuitBoard', 'Clipboard', 'Cloud', 'Cog', 'Compass',
  'Computer', 'Copy', 'Crown', 'Database', 'Diamond', 'DraftingCompass', 'ShieldCheck',
  'Edit', 'Feather', 'Film', 'Filter', 'Flag', 'FlaskConical', 'Folder',
  'Gem', 'Gift', 'GraduationCap', 'Heart', 'Home', 'Image', 'Inbox', 'Key',
  'Landmark', 'Languages', 'Layers', 'LayoutGrid', 'Library', 'LifeBuoy', 'Lightbulb',
  'Link', 'Lock', 'Mail', 'Map', 'Medal', 'Megaphone', 'MessageSquare',
  'Mic', 'Moon', 'MousePointer', 'Music', 'Newspaper', 'Nut', 'Package',
  'Paintbrush', 'Palette', 'Paperclip', 'Pen', 'Percent', 'Phone', 'PieChart',
  'Pin', 'Plane', 'Puzzle', 'Quote', 'Receipt', 'Rocket', 'Ruler', 'Save',
  'Scale', 'Scissors', 'ScreenShare', 'Send', 'Settings', 'Shield', 'ShoppingBag',
  'Smile', 'Sparkles', 'Speaker', 'Star', 'Sun', 'Sunrise', 'Sunset', 'Sword',
  'Table', 'Tag', 'Target', 'Tent', 'Terminal', 'ThumbsUp', 'Ticket', 'Timer',
  'ToggleLeft', 'Tool', 'Train', 'Trash', 'TrendingUp', 'Trophy', 'Umbrella',
  'Users', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap', 'Code', 'Bug', 'BarChart3'
];

export const getRandomIcon = (): keyof typeof LucideIcons => {
    return availableIcons[Math.floor(Math.random() * availableIcons.length)];
}

// This is now effectively a fallback or an empty list, as the primary source is Notion.
export const defaultPartners: Partner[] = [];

export const getPartnerBySlug = (slug: string, partners: Partner[]): Partner | undefined => {
  return partners.find(partner => partner.slug === slug);
};
