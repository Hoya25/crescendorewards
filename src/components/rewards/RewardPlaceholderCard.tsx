import { Gift, Coffee, Music, BookOpen, Users, ShoppingBag, Sparkles, Heart, CreditCard, Coins, type LucideIcon } from 'lucide-react';

const categoryIconMap: Record<string, LucideIcon> = {
  experiences: Sparkles,
  merch: ShoppingBag,
  gift_cards: CreditCard,
  wellness: Heart,
  alliance_tokens: Coins,
  community: Users,
  subscriptions: CreditCard,
  coffee: Coffee,
  music: Music,
  course: BookOpen,
};

function pickIcon(category?: string, title?: string): LucideIcon {
  if (category && categoryIconMap[category]) return categoryIconMap[category];
  const t = (title || '').toLowerCase();
  if (t.includes('coffee')) return Coffee;
  if (t.includes('music') || t.includes('vinyl') || t.includes('playlist')) return Music;
  if (t.includes('course') || t.includes('101') || t.includes('learn')) return BookOpen;
  if (t.includes('community') || t.includes('mentorship') || t.includes('virtual')) return Users;
  if (t.includes('app') || t.includes('shop') || t.includes('snack') || t.includes('box') || t.includes('sampler')) return ShoppingBag;
  if (t.includes('earn') || t.includes('double') || t.includes('garden')) return Sparkles;
  return Gift;
}

interface RewardPlaceholderCardProps {
  title: string;
  category?: string;
  className?: string;
}

export function RewardPlaceholderCard({ title, category, className }: RewardPlaceholderCardProps) {
  const Icon = pickIcon(category, title);

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${className ?? ''}`}
      style={{ background: 'linear-gradient(135deg, #323232 0%, #1a1a1a 100%)' }}
    >
      {/* Subtle lime border glow */}
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(226,255,109,0.15), inset 0 0 30px rgba(226,255,109,0.05)' }} />

      {/* Icon */}
      <Icon className="w-12 h-12 mb-3" style={{ color: '#E2FF6D' }} />

      {/* Title */}
      <p className="text-white font-bold text-sm text-center px-6 line-clamp-2 leading-snug max-w-[80%]">
        {title}
      </p>

      {/* NCTR N watermark */}
      <span
        className="absolute bottom-3 right-4 font-extrabold text-3xl select-none pointer-events-none"
        style={{ color: 'rgba(226,255,109,0.08)', letterSpacing: '2px' }}
      >
        N
      </span>
    </div>
  );
}
