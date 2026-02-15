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
import { AdminSponsorApplications } from './AdminSponsorApplications';
import { AdminCampaigns } from './AdminCampaigns';
import { AdminManagement } from './AdminManagement';
import { AdminActivityLog } from './AdminActivityLog';
import { AdminFeedback } from './AdminFeedback';
import { AdminSettings } from './AdminSettings';
import { AdminShopSettings } from './AdminShopSettings';
import { AdminEarningOpportunities } from './AdminEarningOpportunities';
import { AdminStatusTiers } from './AdminStatusTiers';
import { AdminAlliancePartners } from './AdminAlliancePartners';
import { AdminSocialPosts } from './AdminSocialPosts';
import { AdminFeaturedCreators } from './AdminFeaturedCreators';
import { AdminContentLibrary } from './AdminContentLibrary';
import { AdminContributors } from './AdminContributors';
import { AdminContributedRewards } from './AdminContributedRewards';
import { AdminBounties } from './AdminBounties';
import { AdminFounding111 } from './AdminFounding111';
import { WishlistAnalytics } from '@/components/WishlistAnalytics';
import AdminGifts from './AdminGifts';
import { AdminUserNotifications } from './AdminUserNotifications';
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
      case 'content-library':
        return <AdminContentLibrary />;
      case 'contributors':
        return <AdminContributors />;
      case 'brands':
        return <AdminBrands />;
      case 'sponsors':
        return <AdminSponsors />;
      case 'sponsor-applications':
        return <AdminSponsorApplications />;
      case 'wishlists':
        return <AdminWishlists />;
      case 'wishlist-analytics':
        return <WishlistAnalytics />;
      case 'users':
        return <AdminUsers />;
      case 'user-notifications':
        return <AdminUserNotifications />;
      case 'sync-verification':
        return <AdminSyncVerification />;
      case 'team':
        return <AdminManagement />;
      case 'activity':
        return <AdminActivityLog />;
      case 'feedback':
        return <AdminFeedback />;
      case 'settings':
        return <AdminSettings />;
      case 'shop-settings':
        return <AdminShopSettings />;
      case 'earning':
        return <AdminEarningOpportunities />;
      case 'status-tiers':
        return <AdminStatusTiers />;
      case 'alliance-partners':
        return <AdminAlliancePartners />;
      case 'social-posts':
        return <AdminSocialPosts />;
      case 'featured-creators':
        return <AdminFeaturedCreators />;
      case 'contributed-rewards':
        return <AdminContributedRewards />;
      case 'bounties':
        return <AdminBounties />;
      case 'founding-111':
        return <AdminFounding111 />;
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
