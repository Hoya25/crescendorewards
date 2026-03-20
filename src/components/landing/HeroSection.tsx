import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, TrendingUp, Lock, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HeroSectionProps {
  onJoin: () => void;
}

const FLYWHEEL_NODES = [
  { label: 'Earn', sub: 'Shop, contribute, refer', Icon: TrendingUp, angle: -90 },
  { label: 'Commit', sub: 'Commit for 360 days', Icon: Lock, angle: 30 },
  { label: 'Unlock', sub: 'Level up your status', Icon: Trophy, angle: 150 },
];

const STAT_TILES = [
  { headline: '5', label: 'STATUS TIERS', sub: 'Bronze to Diamond' },
  { headline: '360', label: 'DAYS', sub: 'One commitment, instant activation' },
  { headline: '∞', label: 'EARN IN THE GARDEN', sub: 'Shop brands to fuel your status' },
];

const ambient = '0px 4px 20px rgba(50,50,50,0.04), 0px 10px 40px rgba(50,50,50,0.06)';
const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";
const hoverCurve = 'cubic-bezier(0.4,0,0.2,1)';

export function HeroSection({ onJoin }: HeroSectionProps) {
  const navigate = useNavigate();
  const [memberCount, setMemberCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count } = await supabase
          .from('unified_profiles')
          .select('id', { count: 'exact', head: true });
        if (count) setMemberCount(count);
      } catch {
        // fail silently
      }
    };
    fetchCount();
  }, []);

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative flex items-center px-6 md:px-12 pt-28 md:pt-0 md:min-h-screen"
      style={{ backgroundColor: '#F9F9F7' }}
    >
      <div className="relative z-10 max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-10 md:gap-20 items-center py-16 md:py-0">
        {/* Left: Copy */}
        <div className="space-y-8">
          <h1 style={{ lineHeight: 1.0, letterSpacing: '-0.03em' }}>
            <span
              style={{
                fontFamily: barlow,
                fontWeight: 900,
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                color: '#323232',
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              Your Status.
            </span>
            <span
              style={{
                fontFamily: barlow,
                fontWeight: 900,
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                color: '#3A4A00',
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              Your Rewards.
            </span>
            <span
              style={{
                fontFamily: barlow,
                fontWeight: 900,
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                color: '#323232',
                display: 'block',
                textTransform: 'uppercase',
              }}
            >
              Your Life.
            </span>
          </h1>

          <p
            style={{
              fontFamily: dmSans,
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#5A5A58',
              maxWidth: '480px',
            }}
          >
            Bronze through Diamond — your Crescendo status level determines every reward, opportunity, and benefit you can access.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 max-w-md">
            <button
              onClick={() => navigate('/membership')}
              style={{
                fontFamily: barlow,
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                backgroundColor: '#323232',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0px',
                height: '56px',
                width: '100%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: `background-color 300ms ${hoverCurve}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#323232')}
            >
              CHECK MY STATUS
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={scrollToHowItWorks}
              style={{
                fontFamily: barlow,
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                backgroundColor: 'transparent',
                color: '#323232',
                border: '1px solid #323232',
                borderRadius: '0px',
                height: '56px',
                width: '100%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: `background-color 300ms ${hoverCurve}, color 300ms ${hoverCurve}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#323232';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#323232';
              }}
            >
              SEE HOW IT WORKS
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <a
            href="https://thegarden.nctr.live"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: dmSans,
              fontSize: '14px',
              color: '#323232',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Don't have NCTR yet? Earn it in The Garden →
          </a>
        </div>

        {/* Right: Flywheel */}
        <div className="flex items-center justify-center md:justify-end">
          <div className="relative w-72 h-72 md:w-[22rem] md:h-[22rem]">
            {/* SVG orbit */}
            <svg viewBox="0 0 300 300" fill="none" className="absolute inset-0 w-full h-full">
              <circle cx="150" cy="150" r="130" stroke="#D9D9D9" strokeWidth="2" />
              {[0, 120, 240].map((deg) => {
                const midAngle = deg + 60;
                const rad = (midAngle * Math.PI) / 180;
                const cx = 150 + 130 * Math.cos(rad);
                const cy = 150 + 130 * Math.sin(rad);
                const rot = midAngle + 90;
                return (
                  <polygon
                    key={deg}
                    points="-5,-6 5,-6 0,6"
                    fill="#323232"
                    transform={`translate(${cx},${cy}) rotate(${rot})`}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {FLYWHEEL_NODES.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const r = 130;
              const x = 50 + (r / 150) * 50 * Math.cos(rad);
              const y = 50 + (r / 150) * 50 * Math.sin(rad);
              return (
                <div
                  key={node.label}
                  className="absolute flex flex-col items-center gap-1.5"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #323232',
                      borderRadius: '0px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <node.Icon style={{ width: '24px', height: '24px', color: '#323232' }} />
                  </div>
                  <span
                    style={{
                      fontFamily: barlow,
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#323232',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {node.label}
                  </span>
                  <span
                    style={{
                      fontFamily: dmSans,
                      fontSize: '12px',
                      color: '#5A5A58',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {node.sub}
                  </span>
                </div>
              );
            })}

            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <p
                style={{
                  fontFamily: barlow,
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#323232',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Live &amp; Earn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div
        className="absolute bottom-0 left-0 right-0 px-6 md:px-12"
        style={{ transform: 'translateY(50%)' }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {STAT_TILES.map((tile) => (
            <div
              key={tile.label}
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: ambient,
                borderRadius: '0px',
                padding: '24px 16px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: barlow,
                  fontWeight: 900,
                  fontSize: 'clamp(32px, 4vw, 48px)',
                  color: '#323232',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                {tile.headline}
              </p>
              <p
                style={{
                  fontFamily: dmSans,
                  fontWeight: 400,
                  fontSize: '12px',
                  color: '#323232',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginTop: '8px',
                }}
              >
                {tile.label}
              </p>
              <p
                style={{
                  fontFamily: dmSans,
                  fontWeight: 400,
                  fontSize: '11px',
                  color: '#5A5A58',
                  marginTop: '4px',
                }}
              >
                {tile.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
