import { ExternalLink } from 'lucide-react';

export function InviteHeaderCTA() {
  return (
    <a
      href="https://bountyhunter.nctr.live"
      target="_blank"
      rel="noopener noreferrer"
      className="hidden md:flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wide transition-colors"
      style={{
        border: '1px solid rgba(226,255,109,0.3)',
        color: '#E2FF6D',
        background: 'transparent',
        borderRadius: 0,
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(226,255,109,0.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <ExternalLink className="w-4 h-4" />
      Open Bounty Hunter →
    </a>
  );
}
