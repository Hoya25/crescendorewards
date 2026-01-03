import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Sparkles, Trophy, Users, Award, ShoppingBag, Infinity } from "lucide-react";
import { NCTRLogo } from "./NCTRLogo";
import { CrescendoLogo } from "./CrescendoLogo";
import { ImageWithFallback } from "./ImageWithFallback";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

export function LandingPage() {
  const navigate = useNavigate();
  const { setShowAuthModal, setAuthMode } = useAuthContext();

  const handleJoin = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  const handleViewRewards = () => {
    navigate('/rewards');
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Navigation */}
      <nav className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <CrescendoLogo />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleViewRewards}>
            Rewards
          </Button>
          <Button variant="ghost" onClick={handleSignIn}>
            Sign in
          </Button>
          <Button onClick={handleJoin} className="bg-violet-600 hover:bg-violet-700 text-white">
            Join Now
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 -z-10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDEyNCwgNTgsIDIzNywgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40 -z-10" />

        <div className="max-w-7xl mx-auto text-center px-4">
          <Badge className="mb-4 md:mb-6 bg-violet-100 text-violet-700 hover:bg-violet-100">
            Member Built. Member Owned.
          </Badge>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Unlock Exclusive Rewards
          </h1>
          <p className="text-base md:text-xl text-neutral-600 max-w-2xl mx-auto mb-6 md:mb-10 px-4 flex items-center justify-center gap-2 flex-wrap">
            Commit <NCTRLogo size="lg" /> to 360LOCK, claim your status NFT on Base, and access crowdsourced digital rewards from Crescendo brands.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-200 text-base md:text-lg px-6 md:px-8 w-full sm:w-auto"
              onClick={handleJoin}
            >
              Start Earning <Sparkles className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-violet-200 hover:bg-violet-50 text-base md:text-lg w-full sm:w-auto"
              onClick={handleViewRewards}
            >
              Explore Rewards
            </Button>
          </div>
        </div>
      </section>

      {/* Status Levels Section */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">6 Levels of Status</h2>
            <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
              Lock NCTR in 360LOCK to unlock higher status levels and better earning rates
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {[
              { level: 1, name: 'Level 1', nctr: '100', multiplier: '1.0x', color: 'from-slate-400 to-gray-500' },
              { level: 2, name: 'Level 2', nctr: '500', multiplier: '1.1x', color: 'from-emerald-400 to-green-500' },
              { level: 3, name: 'Silver', nctr: '2,500', multiplier: '1.25x', color: 'from-blue-400 to-cyan-500' },
              { level: 4, name: 'Gold', nctr: '10,000', multiplier: '1.4x', color: 'from-purple-400 to-violet-500' },
              { level: 5, name: 'Platinum', nctr: '50,000', multiplier: '1.6x', color: 'from-amber-400 to-yellow-500' },
              { level: 6, name: 'Diamond', nctr: '100,000', multiplier: '2.0x', color: 'from-cyan-400 to-blue-600' },
            ].map((status) => (
              <Card 
                key={status.level} 
                className="border-2 hover:border-violet-300 transition-all cursor-pointer group overflow-hidden"
              >
                <div className={`h-1 bg-gradient-to-r ${status.color}`} />
                <CardContent className="p-3 md:p-4 text-center">
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${status.color} mx-auto mb-2 md:mb-3 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Trophy className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-xs md:text-sm">{status.name}</h3>
                  <p className="text-xs md:text-sm text-neutral-600 flex items-center justify-center gap-1">
                    {status.nctr} <NCTRLogo />
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {status.multiplier}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Crescendo Section */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">Why Crescendo?</h2>
            <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
              A loyalty program that actually works for you
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                icon: Users,
                title: "Member-Built Rewards",
                description: "Our community sources and votes on rewards. You decide what's worth earning.",
                gradient: "from-violet-500 to-purple-600"
              },
              {
                icon: ShoppingBag,
                title: "Earn From What You Buy",
                description: "Connect your everyday purchases to earn NCTR. No extra apps, no changing habits.",
                gradient: "from-emerald-500 to-green-600"
              },
              {
                icon: Trophy,
                title: "Own Your Status",
                description: "Your membership lives on-chain. Take your status anywhere, forever.",
                gradient: "from-amber-500 to-yellow-500"
              },
              {
                icon: Infinity,
                title: "Points That Never Expire",
                description: "Lock NCTR in 360LOCK and your benefits only grow. No use-it-or-lose-it pressure.",
                gradient: "from-blue-500 to-cyan-500"
              }
            ].map((benefit) => (
              <Card 
                key={benefit.title} 
                className="border border-neutral-200 hover:border-violet-300 hover:shadow-lg transition-all group"
              >
                <CardContent className="p-5 md:p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-base md:text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Partners Section */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">Brand Partners</h2>
            <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
              Earn NCTR from purchases at our exclusive brand partners
            </p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 md:gap-8">
            {[
              { name: 'Nike', logo: '/brands/nike-logo.png' },
              { name: 'Spotify', logo: '/brands/spotify-logo.png' },
              { name: 'Sephora', logo: '/brands/sephora-logo.png' },
              { name: 'Whole Foods', logo: '/brands/wholefoods-logo.png' },
              { name: 'Chipotle', logo: '/brands/chipotle-logo.png' },
              { name: 'Delta', logo: '/brands/delta-logo.png' },
              { name: 'Apple', logo: '/brands/apple-logo.png' },
              { name: 'AMC', logo: '/brands/amc-logo.png' },
              { name: 'Urban Outfitters', logo: '/brands/urbanoutfitters-logo.png' },
              { name: 'Kroma', logo: '/brands/kroma-logo.png' },
            ].map((brand) => (
              <div key={brand.name} className="flex items-center justify-center p-2 md:p-4 grayscale hover:grayscale-0 transition-all">
                <ImageWithFallback
                  src={brand.logo}
                  alt={brand.name}
                  className="h-6 md:h-10 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-base md:text-xl text-violet-100 mb-6 md:mb-8">
            Join thousands of members already earning NCTR and claiming exclusive rewards
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-violet-600 hover:text-violet-700 text-base md:text-lg px-6 md:px-8"
            onClick={handleJoin}
          >
            Join Crescendo <Award className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
