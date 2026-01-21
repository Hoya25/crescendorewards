import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { AdminSubmissions } from './AdminSubmissions';
import { AdminRewards } from './AdminRewards';
import { AdminClaims } from './AdminClaims';
import { AdminBrands } from './AdminBrands';
import { AdminPurchases } from './AdminPurchases';
import { AdminPackages } from './AdminPackages';
import { AdminWishlists } from './AdminWishlists';
import { AdminUsers } from './AdminUsers';
import { AdminSponsors } from './AdminSponsors';
import { AdminSyncVerification } from './AdminSyncVerification';
import { AdminSponsoredRewards } from './AdminSponsoredRewards';
import { AdminCampaigns } from './AdminCampaigns';
import { AdminManagement } from './AdminManagement';
import { AdminActivityLog } from './AdminActivityLog';
import { AdminFeedback } from './AdminFeedback';
import { WishlistAnalytics } from '@/components/WishlistAnalytics';
import AdminGifts from './AdminGifts';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function AdminPanel() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard onNavigate={setCurrentView} />;
      case 'submissions':
        return <AdminSubmissions />;
      case 'rewards':
        return <AdminRewards />;
      case 'sponsored-rewards':
        return <AdminSponsoredRewards />;
      case 'campaigns':
        return <AdminCampaigns />;
      case 'claims':
        return <AdminClaims />;
      case 'gifts':
        return <AdminGifts />;
      case 'purchases':
        return <AdminPurchases />;
      case 'packages':
        return <AdminPackages />;
      case 'brands':
        return <AdminBrands />;
      case 'sponsors':
        return <AdminSponsors />;
      case 'wishlists':
        return <AdminWishlists />;
      case 'wishlist-analytics':
        return <WishlistAnalytics />;
      case 'users':
        return <AdminUsers />;
      case 'sync-verification':
        return <AdminSyncVerification />;
      case 'team':
        return <AdminManagement />;
      case 'activity':
        return <AdminActivityLog />;
      case 'feedback':
        return <AdminFeedback />;
      default:
        return <AdminDashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar onNavigate={setCurrentView} currentView={currentView} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <X className="w-5 h-5" />
            </Button>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {renderView()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
