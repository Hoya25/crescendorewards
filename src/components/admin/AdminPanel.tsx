import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { AdminSubmissions } from './AdminSubmissions';
import { AdminRewards } from './AdminRewards';
import { AdminClaims } from './AdminClaims';
import { AdminBrands } from './AdminBrands';
import { AdminPurchases } from './AdminPurchases';
import { AdminWishlists } from './AdminWishlists';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'submissions':
        return <AdminSubmissions />;
      case 'rewards':
        return <AdminRewards />;
      case 'claims':
        return <AdminClaims />;
      case 'purchases':
        return <AdminPurchases />;
      case 'brands':
        return <AdminBrands />;
      case 'wishlists':
        return <AdminWishlists />;
      case 'users':
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">User management coming soon</p>
          </div>
        );
      default:
        return <AdminDashboard />;
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
            <Button variant="ghost" size="icon" onClick={onClose}>
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
