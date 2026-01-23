import { Button } from '@/components/ui/button';
import { Twitter, MessageCircle, Mail, Send, Copy, Check, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SocialShareButtonsProps {
  referralLink: string;
  allocation: number;
  variant?: 'default' | 'compact';
  /** Optional cleaner display link (e.g., /join/username) for social messages */
  displayLink?: string;
}

// Pre-written share messages - use cleaner personalized links when available
const getShareMessages = (allocation: number, displayLink?: string) => ({
  twitter: `I'm earning rewards on @CrescendoApp 🎁 Join me → ${displayLink || ''}`,
  discord: `Check out Crescendo - finally a rewards platform that doesn't suck. Use my link and we both earn ${allocation} NCTR 🔥`,
  telegram: `Hey! Join me on Crescendo and we both get ${allocation} NCTR when you sign up →`,
  whatsapp: `I found this cool rewards app - if you sign up with my link we both get ${allocation} NCTR:`,
  email: {
    subject: "Join me on Crescendo - we both get rewarded",
    body: (link: string) => 
      `Hey!\n\nI've been using Crescendo to earn rewards and thought you'd like it too.\n\nIf you sign up with my link, we both get ${allocation} NCTR to start.\n\n${link}\n\nSee you there!`
  }
});

export function SocialShareButtons({ referralLink, allocation, variant = 'default', displayLink }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  
  // Use displayLink for cleaner social shares, but referralLink for actual functionality
  const shareLink = displayLink || referralLink;
  const messages = getShareMessages(allocation, displayLink);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = (platform: string) => {
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        // Twitter: Use clean personalized link in the message if available
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(messages.twitter)}${displayLink ? '' : `&url=${encodeURIComponent(referralLink)}`}`;
        break;
      case 'discord':
        // Discord doesn't have a share URL, copy the message instead
        const discordMessage = `${messages.discord} ${shareLink}`;
        navigator.clipboard.writeText(discordMessage);
        toast.success('Discord message copied! Paste it in your server');
        return;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(messages.telegram)}`;
        break;
      case 'whatsapp':
        const whatsappText = `${messages.whatsapp} ${shareLink}`;
        shareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
        break;
      case 'email':
        const emailBody = messages.email.body(shareLink);
        shareUrl = `mailto:?subject=${encodeURIComponent(messages.email.subject)}&body=${encodeURIComponent(emailBody)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => handleShare('twitter')} className="gap-1.5">
          <Twitter className="w-4 h-4" />
          <span className="hidden sm:inline">Twitter</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleShare('discord')} className="gap-1.5">
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Discord</span>
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleShare('telegram')} className="gap-1.5">
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Telegram</span>
        </Button>
        <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Share via</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Button 
          variant="outline" 
          onClick={() => handleShare('twitter')}
          className="gap-2 h-12 flex-col sm:flex-row"
        >
          <Twitter className="w-5 h-5 text-[#1DA1F2]" />
          <span className="text-xs sm:text-sm">Twitter / X</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleShare('discord')}
          className="gap-2 h-12 flex-col sm:flex-row"
        >
          <MessageCircle className="w-5 h-5 text-[#5865F2]" />
          <span className="text-xs sm:text-sm">Discord</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleShare('telegram')}
          className="gap-2 h-12 flex-col sm:flex-row"
        >
          <Send className="w-5 h-5 text-[#0088cc]" />
          <span className="text-xs sm:text-sm">Telegram</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleShare('whatsapp')}
          className="gap-2 h-12 flex-col sm:flex-row"
        >
          <Share2 className="w-5 h-5 text-[#25D366]" />
          <span className="text-xs sm:text-sm">WhatsApp</span>
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleShare('email')}
          className="gap-2 h-12 flex-col sm:flex-row"
        >
          <Mail className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs sm:text-sm">Email</span>
        </Button>
      </div>
    </div>
  );
}
