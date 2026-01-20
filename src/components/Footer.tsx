import { Link } from 'react-router-dom';
import { CrescendoLogo } from './CrescendoLogo';
import { NCTRLogo } from './NCTRLogo';
import { Twitter, MessageCircle, Mail, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left: Logo and NCTR Alliance */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <CrescendoLogo className="h-8 w-auto" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Part of</span>
              <NCTRLogo size="sm" />
              <span>Alliance</span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link 
              to="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link 
              to="/faq" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
            <Link 
              to="/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link 
              to="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <a 
              href="mailto:support@crescendo.nctr.live" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* Right: Social Icons */}
          <div className="flex justify-center md:justify-end gap-4">
            <a
              href="https://twitter.com/NCTRAlliance"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter/X"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://discord.gg/lovable-dev"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Discord"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a
              href="mailto:support@crescendo.nctr.live"
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} Crescendo Rewards Marketplace. All rights reserved.</p>
          <p className="mt-1 text-xs">
            Beta version — Building the future of member-owned rewards.
          </p>
        </div>
      </div>
    </footer>
  );
}
