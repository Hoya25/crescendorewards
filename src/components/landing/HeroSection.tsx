import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HeroSectionProps {
  onJoin: () => void;
}

const STAT_TILES = [
  { headline: '5', label: 'STATUS TIERS', sub: 'Bronze to Diamond' },
  { headline: '360', label: 'DAYS', sub: 'One commitment, instant activation' },
  { headline: '∞', label: 'EARN IN THE GARDEN', sub: 'Shop brands to fuel your status' },
];

const ambient = '0px 4px 20px rgba(50,50,50,0.04), 0px 10px 40px rgba(50,50,50,0.06)';
const barlow = "'Barlow Condensed', sans-serif";
const dmSans = "'DM Sans', sans-serif";
const hoverCurve = 'cubic-bezier(0.4,0,0.2,1)';

/* ── Flywheel as a single cohesive SVG ── */
function FlywheelSVG() {
  const cx = 200, cy = 200, r = 130;
  const nodes = [
    { label: 'EARN', sub: 'Shop, contribute, refer', angle: -90 },
    { label: 'COMMIT', sub: 'Commit for 360 days', angle: 30 },
    { label: 'UNLOCK', sub: 'Level up your status', angle: 150 },
  ];

  // Arrow positions (midpoints between nodes)
  const arrows = [0, 120, 240].map((deg) => {
    const mid = deg + 60;
    const rad = (mid * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), rot: mid + 90 };
  });

  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Orbit circle */}
      <circle cx={cx} cy={cy} r={r} stroke="#D9D9D9" strokeWidth="2" fill="none" />

      {/* Arrows */}
      {arrows.map((a, i) => (
        <polygon
          key={i}
          points="-5,-6 5,-6 0,7"
          fill="#323232"
          transform={`translate(${a.x},${a.y}) rotate(${a.rot})`}
        />
      ))}

      {/* Center text */}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: barlow, fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', fill: '#323232' }}
      >
        LIVE &amp; EARN
      </text>

      {/* Nodes */}
      {nodes.map((node) => {
        const rad = (node.angle * Math.PI) / 180;
        const nx = cx + r * Math.cos(rad);
        const ny = cy + r * Math.sin(rad);
        const boxW = 72, boxH = 48;

        return (
          <g key={node.label}>
            {/* Node rectangle */}
            <rect
              x={nx - boxW / 2} y={ny - boxH / 2}
              width={boxW} height={boxH}
              fill="#FFFFFF" stroke="#323232" strokeWidth="2" rx="0"
            />
            {/* Node label */}
            <text
              x={nx} y={ny + 2}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontFamily: barlow, fontWeight: 700, fontSize: '13px', fill: '#323232', letterSpacing: '0.08em' }}
            >
              {node.label}
            </text>
            {/* Sub-label below the box */}
            <text
              x={nx} y={ny + boxH / 2 + 16}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontFamily: dmSans, fontSize: '11px', fill: '#5A5A58' }}
            >
              {node.sub}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

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
                fontFamily: barlow, fontWeight: 900,
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                color: '#323232', display: 'block', textTransform: 'uppercase',
              }}
            >
              Your Status.
            </span>
            <span
              style={{
                fontFamily: barlow, fontWeight: 900,
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                color: '#3A4A00', display: 'block', textTransform: 'uppercase',
              }}
            >
              Your Rewards.
            </span>
            <span
              style={{
                fontFamily: barlow, fontWeight: 900,
                fontSize: 'clamp(3rem, 6vw, 5rem)',
                color: '#323232', display: 'block', textTransform: 'uppercase',
              }}
            >
              Your Life.
            </span>
          </h1>

          <p style={{ fontFamily: dmSans, fontSize: '16px', lineHeight: 1.6, color: '#5A5A58', maxWidth: '480px' }}>
            Bronze through Diamond — your Crescendo status level determines every reward, opportunity, and benefit you can access.
          </p>

          <div className="flex flex-col gap-3 max-w-md">
            <button
              onClick={() => navigate('/membership')}
              style={{
                fontFamily: barlow, fontWeight: 700, fontSize: '14px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                backgroundColor: '#323232', color: '#FFFFFF',
                border: 'none', borderRadius: '0px', height: '56px', width: '100%',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
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
                fontFamily: barlow, fontWeight: 700, fontSize: '14px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                backgroundColor: 'transparent', color: '#323232',
                border: '1px solid #323232', borderRadius: '0px', height: '56px', width: '100%',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: `background-color 300ms ${hoverCurve}, color 300ms ${hoverCurve}`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#323232'; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#323232'; }}
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
              fontFamily: dmSans, fontSize: '14px', color: '#323232',
              textDecoration: 'underline', textUnderlineOffset: '3px',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}
          >
            Don't have NCTR yet? Earn it in The Garden →
          </a>
        </div>

        {/* Right: Flywheel — single SVG */}
        <div className="flex items-center justify-center md:justify-end">
          <div className="w-72 h-72 md:w-[22rem] md:h-[22rem]">
            <FlywheelSVG />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12" style={{ transform: 'translateY(50%)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {STAT_TILES.map((tile) => (
            <div
              key={tile.label}
              style={{
                backgroundColor: '#FFFFFF', boxShadow: ambient, borderRadius: '0px',
                padding: '24px 16px', textAlign: 'center',
              }}
            >
              <p style={{ fontFamily: barlow, fontWeight: 900, fontSize: 'clamp(32px, 4vw, 48px)', color: '#323232', lineHeight: 1, margin: 0 }}>
                {tile.headline}
              </p>
              <p style={{ fontFamily: dmSans, fontWeight: 400, fontSize: '12px', color: '#323232', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '8px' }}>
                {tile.label}
              </p>
              <p style={{ fontFamily: dmSans, fontWeight: 400, fontSize: '11px', color: '#5A5A58', marginTop: '4px' }}>
                {tile.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
