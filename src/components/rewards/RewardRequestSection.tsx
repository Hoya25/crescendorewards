import { useState } from 'react';
import { Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { useAuthContext } from '@/contexts/AuthContext';

const GOLD_TIER_LEVEL = 3; // Bronze=1, Silver=2, Gold=3, Platinum=4, Diamond=5

export function RewardRequestSection() {
  const { user } = useAuthContext();
  const { profile, tier } = useUnifiedUser();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const tierLevel = tier?.sort_order ?? 0;
  const isGoldOrAbove = tierLevel >= GOLD_TIER_LEVEL;

  const handleSubmit = async () => {
    if (!title.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      const handle = (profile?.crescendo_data as any)?.display_name || profile?.email || user.email;
      const { error } = await supabase.functions.invoke('submit-reward-request', {
        body: {
          request_title: title.trim(),
          request_details: details.trim() || null,
          tier_at_time: tier?.tier_name || 'Unknown',
          user_email: profile?.email || user.email,
          handle,
        },
      });
      if (error) throw error;
      setSubmitted(true);
      setTitle('');
      setDetails('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0D0D0D',
    border: '1px solid #323232',
    color: '#FFFFFF',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    padding: '12px 16px',
    borderRadius: '0px',
    outline: 'none',
    transition: 'border-color 200ms ease',
  };

  return (
    <div style={{ padding: '0 16px', maxWidth: '100%' }}>
      <div
        style={{
          background: '#131313',
          border: '1px solid #323232',
          borderRadius: '0px',
          padding: '32px',
          marginBottom: '8px',
        }}
      >
        <h2
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '24px',
            fontWeight: 700,
            color: '#FFFFFF',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.04em',
            marginBottom: '8px',
          }}
        >
          WHAT DO YOU WANT?
        </h2>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#D9D9D9',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
        >
          Tell us the experience, product, or access you want. We'll work to make it happen.
        </p>

        {!isGoldOrAbove ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock style={{ width: 20, height: 20, color: '#5A5A58', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#5A5A58',
              }}
            >
              Unlock personalized requests at Gold status
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="e.g. Two tickets to see Glass Animals in Denver"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#E2FF6D')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#323232')}
            />
            <textarea
              placeholder="Any details — dates, location, preferences..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              style={{ ...inputStyle, height: '80px', resize: 'none' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#E2FF6D')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#323232')}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || submitting}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '13px',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  background: 'transparent',
                  border: '1px solid #E2FF6D',
                  color: '#E2FF6D',
                  padding: '12px 24px',
                  borderRadius: '0px',
                  cursor: !title.trim() || submitting ? 'not-allowed' : 'pointer',
                  opacity: !title.trim() || submitting ? 0.5 : 1,
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  if (title.trim() && !submitting) {
                    e.currentTarget.style.background = '#E2FF6D';
                    e.currentTarget.style.color = '#131313';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#E2FF6D';
                }}
              >
                {submitting ? 'Submitting...' : 'Request This'}
              </button>
              {submitted && (
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    color: '#E2FF6D',
                    animation: 'fadeIn 300ms ease-in',
                  }}
                >
                  Request submitted. We're on it.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px',
          color: '#5A5A58',
          fontStyle: 'italic',
          marginBottom: '24px',
        }}
      >
        Your requests help shape what rewards we pursue. Every voice matters.
      </p>
    </div>
  );
}
