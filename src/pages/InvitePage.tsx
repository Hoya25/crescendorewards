import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Copy, Check, UserPlus, Share2, Zap, ArrowLeft,
  Twitter, Send, Mail, MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReferralSettings } from '@/hooks/useReferralSettings';
import { useReferralStats } from '@/hooks/useReferralStats';
import { useReferralMilestones, ReferralMilestone } from '@/hooks/useReferralMilestones';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { useReferralSlug } from '@/hooks/useReferralSlug';
import { generateReferralLink, PRODUCTION_DOMAIN } from '@/lib/referral-links';

const FALLBACK_MILESTONES = [
  { id: 'f1', referral_count: 1, nctr_reward: 500, claims_reward: 0 },
  { id: 'f3', referral_count: 3, nctr_reward: 1500, claims_reward: 0 },
  { id: 'f5', referral_count: 5, nctr_reward: 2500, claims_reward: 0 },
  { id: 'f10', referral_count: 10, nctr_reward: 5000, claims_reward: 0 },
  { id: 'f25', referral_count: 25, nctr_reward: 12500, claims_reward: 0 },
];

export default function InvitePage() {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { data: settings } = useReferralSettings();
  const { data: stats, isLoading } = useReferralStats();
  const { data: dbMilestones } = useReferralMilestones();
  const { profile } = useUnifiedUser();
  const { currentSlug } = useReferralSlug();

  const crescendoData = profile?.crescendo_data || {};
  const referralCode = (crescendoData as any).referral_code || 'LOADING';
  const handle = profile?.handle;
  const totalReferrals = stats?.totalReferrals ?? 0;
  const totalEarned = stats?.totalEarned ?? 0;

  const milestones = dbMilestones && dbMilestones.length > 0 ? dbMilestones : FALLBACK_MILESTONES;
  const nextMilestone = milestones.find((m) => totalReferrals < m.referral_count);

  // Build referral link
  const referralLink = useMemo(() => {
    if (handle) return `${PRODUCTION_DOMAIN}/ref/@${handle}`;
    if (currentSlug) return `${PRODUCTION_DOMAIN}/join/${currentSlug}`;
    return generateReferralLink(referralCode);
  }, [handle, currentSlug, referralCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const shareText = {
    twitter: `I'm building status on Crescendo — a rewards marketplace where you earn, not spend. Join through my link and we both earn NCTR 🔥 ${referralLink}`,
    whatsapp: `Join me on Crescendo — earn NCTR from shopping and unlock real rewards. Use my invite link: ${referralLink}`,
    telegram: `Join me on Crescendo — earn NCTR from shopping and unlock real rewards. Use my invite link: ${referralLink}`,
    emailSubject: 'Join me on Crescendo',
    emailBody: `Hey!\n\nI've been using Crescendo to earn NCTR from everyday shopping. You should check it out — we both earn NCTR when you join through my link:\n\n${referralLink}\n\nSee you there!`,
  };

  const share = (platform: string) => {
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.twitter)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText.whatsapp)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText.telegram)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(shareText.emailSubject)}&body=${encodeURIComponent(shareText.emailBody)}`;
        break;
    }
    if (url) window.open(url, '_blank');
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(50,50,50,0.6)',
    border: '1px solid rgba(226,255,109,0.15)',
    borderRadius: 0,
  };

  return (
    <>
      <SEO title="Invite Friends" description="Invite friends to Crescendo and earn NCTR rewards." />
      <div className="flex-1 px-4 md:px-6 pt-3 pb-4">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Back */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm"
            style={{ color: '#D9D9D9' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* HERO */}
          <div className="p-8" style={{ background: '#323232', borderRadius: 0 }}>
            <h1 className="text-[28px] font-bold uppercase text-white tracking-wide">
              Grow the Alliance
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: '#D9D9D9' }}>
              Every friend you invite earns you NCTR and builds your status faster. They get a head start too.
            </p>
          </div>

          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5" style={cardStyle}>
              <p className="text-sm" style={{ color: '#D9D9D9' }}>Total Referrals</p>
              <p className="text-3xl font-bold mt-1" style={{ color: '#E2FF6D', fontFamily: '"DM Mono", monospace' }}>
                {totalReferrals}
              </p>
              <p className="text-xs mt-1" style={{ color: '#5A5A58' }}>friends invited</p>
            </div>
            <div className="p-5" style={cardStyle}>
              <p className="text-sm" style={{ color: '#D9D9D9' }}>NCTR Earned</p>
              <p className="text-3xl font-bold mt-1" style={{ color: '#E2FF6D', fontFamily: '"DM Mono", monospace' }}>
                {totalEarned.toLocaleString()}
              </p>
              <p className="text-xs mt-1" style={{ color: '#5A5A58' }}>NCTR earned</p>
            </div>
            <div className="p-5" style={cardStyle}>
              <p className="text-sm" style={{ color: '#D9D9D9' }}>Next Milestone</p>
              {nextMilestone ? (
                <>
                  <p className="text-3xl font-bold mt-1" style={{ color: '#E2FF6D', fontFamily: '"DM Mono", monospace' }}>
                    {nextMilestone.referral_count - totalReferrals}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#5A5A58' }}>more referrals needed</p>
                </>
              ) : (
                <p className="text-sm mt-2" style={{ color: '#E2FF6D' }}>All milestones reached! 🎉</p>
              )}
            </div>
          </div>

          {/* SHARE SECTION */}
          <div className="p-5 space-y-4" style={cardStyle}>
            <p className="text-sm font-semibold text-white">Your Referral Link</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 px-3 py-2 text-sm text-white font-mono"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 0,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase"
                style={{ background: '#E2FF6D', color: '#323232', borderRadius: 0 }}
              >
                {copied ? <><Check className="w-4 h-4" /> COPIED ✓</> : <><Copy className="w-4 h-4" /> COPY</>}
              </button>
            </div>

            {/* Share buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { key: 'twitter', icon: Twitter, label: 'X / Twitter', color: '#1DA1F2' },
                { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: '#25D366' },
                { key: 'telegram', icon: Send, label: 'Telegram', color: '#0088cc' },
                { key: 'email', icon: Mail, label: 'Email', color: '#D9D9D9' },
              ].map(({ key, icon: Icon, label, color }) => (
                <button
                  key={key}
                  onClick={() => share(key)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase"
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#D9D9D9',
                    borderRadius: 0,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Share2, title: 'Share', desc: 'Send your personal link to friends' },
                { icon: UserPlus, title: 'They Join', desc: 'Your friend signs up through your link' },
                { icon: Zap, title: 'You Both Earn', desc: 'You get 500 NCTR, they get a head start' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="p-5 flex flex-col items-center text-center" style={cardStyle}>
                  <div className="w-10 h-10 flex items-center justify-center mb-3" style={{ border: '1px solid rgba(226,255,109,0.3)', borderRadius: 0 }}>
                    <Icon className="w-5 h-5" style={{ color: '#E2FF6D' }} />
                  </div>
                  <p className="font-semibold text-white text-sm">{title}</p>
                  <p className="text-xs mt-1" style={{ color: '#D9D9D9' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MILESTONES */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Referral Milestones</h2>
            <div className="space-y-2">
              {milestones.map((m: any) => {
                const achieved = totalReferrals >= m.referral_count;
                const isCurrent = m === nextMilestone;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 p-4"
                    style={{
                      ...cardStyle,
                      ...(isCurrent ? { border: '1px solid rgba(226,255,109,0.4)' } : {}),
                      ...(achieved ? {} : { opacity: 0.5 }),
                    }}
                  >
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      {achieved ? (
                        <Check className="w-5 h-5" style={{ color: '#E2FF6D' }} />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: '#5A5A58' }}>{m.referral_count}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: achieved ? '#E2FF6D' : '#D9D9D9' }}>
                        {m.referral_count} Referral{m.referral_count !== 1 ? 's' : ''}
                      </p>
                      {isCurrent && (
                        <div className="mt-1.5 w-full h-1" style={{ background: '#5A5A58', borderRadius: 0 }}>
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min((totalReferrals / m.referral_count) * 100, 100)}%`,
                              background: '#E2FF6D',
                              borderRadius: 0,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: achieved ? '#E2FF6D' : '#5A5A58', fontFamily: '"DM Mono", monospace' }}>
                      +{m.nctr_reward.toLocaleString()} NCTR
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM CTA */}
          <div className="p-5 flex items-center justify-between" style={{ background: '#E2FF6D', borderRadius: 0 }}>
            <p className="font-bold text-[#323232]">Ready to grow the Alliance?</p>
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-bold uppercase text-white"
              style={{ background: '#323232', borderRadius: 0 }}
            >
              Copy Your Link
            </button>
          </div>

          <div className="h-20 md:hidden" />
        </div>
      </div>
    </>
  );
}
