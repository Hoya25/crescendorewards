import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function InviteHeaderCTA() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/invite')}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wide transition-colors"
      style={{
        border: '1px solid rgba(226,255,109,0.3)',
        color: '#E2FF6D',
        background: 'transparent',
        borderRadius: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(226,255,109,0.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <UserPlus className="w-4 h-4" />
      Invite &amp; Earn NCTR →
    </button>
  );
}
