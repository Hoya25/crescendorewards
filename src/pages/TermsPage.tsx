import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/Footer';
import { CrescendoLogo } from '@/components/CrescendoLogo';
import { SEO } from '@/components/SEO';

export function TermsPage() {
  return (
    <>
      <SEO 
        title="Terms of Service | Crescendo"
        description="Read the terms of service for using Crescendo by NCTR Alliance."
      />
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/">
              <CrescendoLogo className="h-8 w-auto" />
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 2026</p>
          
          <div className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using Crescendo ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Beta Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Crescendo is currently in beta. Features may change, and the service may experience interruptions. We appreciate your patience as we continue to improve the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when creating your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Rewards and NCTR Tokens</h2>
              <p className="text-muted-foreground leading-relaxed">
                NCTR tokens and rewards are subject to availability and may be modified or discontinued at any time. Token balances and rewards have no cash value and cannot be exchanged for currency unless explicitly stated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users agree not to engage in any activity that may harm the Service or other users, including but not limited to: fraudulent activity, manipulation of reward systems, or violation of any applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on the Service, including logos, text, and graphics, is owned by Crescendo or its licensors and is protected by intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Crescendo is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:support@crescendo.nctr.live" className="text-primary hover:underline">
                  support@crescendo.nctr.live
                </a>
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
