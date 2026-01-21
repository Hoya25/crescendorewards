import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DeliveryProfileForm } from '@/components/profile/DeliveryProfileForm';

export function DeliveryProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/profile')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Delivery Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your delivery preferences for faster claims</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <DeliveryProfileForm />
      </div>
    </div>
  );
}

export default DeliveryProfilePage;
