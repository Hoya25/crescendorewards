import { SEO } from '@/components/SEO';
import { Footer } from '@/components/Footer';
import { ExternalLink } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const PLATFORMS = [
  {
    name: 'The Garden',
    url: 'https://thegarden.nctr.live',
    description: 'Commerce gateway where members shop at thousands of brands and earn NCTR automatically on every purchase.',
  },
  {
    name: 'Crescendo',
    url: 'https://crescendo.nctr.live',
    description: 'Member rewards marketplace where 360LOCK status unlocks benefits, discounts, and exclusive access.',
  },
  {
    name: 'BaseCamp',
    url: 'https://basecamp.nctr.live',
    description: 'Token dashboard for tracking NCTR vesting and lockup plans.',
  },
];

const FAQS = [
  {
    q: 'What is NCTR Alliance?',
    a: 'NCTR Alliance is a participation token economy on the Base blockchain. Members earn NCTR tokens through shopping and contribution — not speculation.',
  },
  {
    q: 'What is the NCTR token?',
    a: 'NCTR (pronounced Nectar) is the participation token of NCTR Alliance on Base. Contract: 0x973104fAa7F2B11787557e85953ECA6B4e262328. It is earned, not bought.',
  },
  {
    q: 'How do I earn NCTR through shopping?',
    a: 'Shop at thousands of partner brands through The Garden at thegarden.nctr.live and earn NCTR automatically on every purchase.',
  },
  {
    q: 'What is 360LOCK?',
    a: 'LOCK is a 360-day commitment where you lock your NCTR tokens to earn status tiers on Crescendo — Bronze through Diamond. Tokens are never spent. You always keep ownership after the lock period ends.',
  },
  {
    q: 'What is the difference between 90LOCK and 360LOCK?',
    a: '90LOCK is an entry-level commitment that earns no status. 360LOCK is the only path to earning status tiers and unlocking Crescendo rewards, and pays approximately 3x more NCTR than 90LOCK for the same bounty.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0D0D0D', color: '#D9D9D9' }}>
      <SEO
        title="About NCTR Alliance — Participation Token Economy on Base"
        description="NCTR Alliance is a participation token economy on the Base blockchain where people earn NCTR (pronounced Nectar) tokens by shopping at thousands of brands and commit them via 360LOCK to unlock rewards and status on Crescendo."
        canonical="https://crescendo.nctr.live/about"
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-16">
        {/* Section 1 */}
        <section className="space-y-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: '#E2FF6D' }}>
            About NCTR Alliance
          </h1>
          <p className="text-base sm:text-lg leading-relaxed">
            NCTR Alliance (pronounced Nectar Alliance) is a participation token economy built on Base. Members earn NCTR tokens through everyday shopping at thousands of brands on The Garden, then commit those tokens via 360LOCK — a 360-day commitment — to rise through status tiers on Crescendo, our member rewards marketplace. You never spend your tokens. You always keep ownership.
          </p>
        </section>

        {/* Section 2 — Name disambiguation */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold" style={{ color: '#E2FF6D' }}>A note on the NCTR name</h2>
          <p className="leading-relaxed">
            NCTR is also used by several unrelated organizations. To be clear:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm opacity-80">
            <li>We are NOT the National Center for Teacher Residencies (nctresidencies.org)</li>
            <li>We are NOT the FDA's National Center for Toxicological Research</li>
            <li>We are NOT Apillon's NCTR token on the Moonbeam blockchain</li>
            <li>We are NOT any other Nectar-branded token on centralized exchanges</li>
          </ul>
          <p className="text-sm">
            NCTR Alliance's token is deployed exclusively on Base. Contract:{' '}
            <code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1a1a1a', color: '#E2FF6D' }}>
              0x973104fAa7F2B11787557e85953ECA6B4e262328
            </code>
          </p>
        </section>

        {/* Section 3 — Our Platforms */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold" style={{ color: '#E2FF6D' }}>Our Platforms</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {PLATFORMS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border p-5 space-y-2 transition-colors hover:border-[#E2FF6D]/40"
                style={{ borderColor: '#2a2a2a', backgroundColor: '#141414' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: '#E2FF6D' }}>{p.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                </div>
                <p className="text-sm opacity-70 leading-relaxed">{p.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Section 4 — FAQ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold" style={{ color: '#E2FF6D' }}>Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b" style={{ borderColor: '#2a2a2a' }}>
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline" style={{ color: '#D9D9D9' }}>
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm opacity-70 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>

      <Footer />
    </div>
  );
}
