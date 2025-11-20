import { LayoutDashboard, Gift, ShoppingBag, Users, Settings, Store, FileCheck, Receipt, Heart, TrendingUp } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

interface AdminSidebarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

const menuItems = [
  { title: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
  { title: 'Submissions', view: 'submissions', icon: FileCheck },
  { title: 'Rewards', view: 'rewards', icon: Gift },
  { title: 'Claims', view: 'claims', icon: ShoppingBag },
  { title: 'Purchases', view: 'purchases', icon: Receipt },
  { title: 'Brands', view: 'brands', icon: Store },
  { title: 'Wishlists', view: 'wishlists', icon: Heart },
  { title: 'Wishlist Analytics', view: 'wishlist-analytics', icon: TrendingUp },
];

export function AdminSidebar({ onNavigate, currentView }: AdminSidebarProps) {
  const { open } = useSidebar();

  return (
    <Sidebar className={open ? 'w-60' : 'w-14'} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            {open && <h2 className="font-bold text-lg">Admin Panel</h2>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.view)}
                    className={`cursor-pointer ${
                      currentView === item.view ? 'bg-accent text-accent-foreground' : ''
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {open && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
