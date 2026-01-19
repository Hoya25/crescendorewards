import { useState } from 'react';
import { Menu, X, Gift, LogIn, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { CrescendoLogo } from './CrescendoLogo';

interface MobileNavProps {
  onViewRewards: () => void;
  onSignIn: () => void;
  onJoin: () => void;
}

export function MobileNav({ onViewRewards, onSignIn, onJoin }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleNavAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">
            <CrescendoLogo />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-4 gap-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-base"
            onClick={() => handleNavAction(onViewRewards)}
          >
            <Gift className="w-5 h-5" />
            Rewards
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-base"
            onClick={() => handleNavAction(onSignIn)}
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </Button>
          <div className="pt-4 border-t mt-2">
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base gap-2"
              onClick={() => handleNavAction(onJoin)}
            >
              <UserPlus className="w-5 h-5" />
              Join Now
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
