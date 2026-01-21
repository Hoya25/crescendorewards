import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminRole } from '@/hooks/useAdminRole';
import { AdminUser, AdminPermission, ROLE_PRESETS } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Users,
  UserCheck,
  Pencil,
  Ban,
  Trash2,
  Clock,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InviteAdminModal } from './InviteAdminModal';
import { EditAdminModal } from './EditAdminModal';
import { PermissionGate } from './PermissionGate';

export function AdminManagement() {
  const { isSuperAdmin, adminUser: currentAdmin, logActivity } = useAdminRole();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user details for each admin
      const adminsWithUsers = await Promise.all(
        (data || []).map(async (admin) => {
          const { data: userData } = await supabase
            .from('unified_profiles')
            .select('id, display_name, email, avatar_url')
            .eq('id', admin.user_id)
            .single();

          const { data: inviterData } = admin.invited_by
            ? await supabase
                .from('unified_profiles')
                .select('display_name')
                .eq('id', admin.invited_by)
                .single()
            : { data: null };

          return {
            ...admin,
            permissions: admin.permissions || [],
            user: userData || undefined,
            inviter: inviterData || undefined,
          } as AdminUser;
        })
      );

      setAdmins(adminsWithUsers);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load admins',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = !searchQuery || 
      admin.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? admin.is_active : !admin.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleActive = async (admin: AdminUser) => {
    if (admin.id === currentAdmin?.id) {
      toast({
        title: 'Error',
        description: 'You cannot deactivate yourself',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !admin.is_active })
        .eq('id', admin.id);

      if (error) throw error;

      await logActivity(
        admin.is_active ? 'Deactivated admin' : 'Activated admin',
        'admin_users',
        admin.id,
        { admin_name: admin.user?.display_name }
      );

      toast({
        title: 'Success',
        description: `Admin ${admin.is_active ? 'deactivated' : 'activated'} successfully`,
      });

      loadAdmins();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update admin status',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAdmin = async (admin: AdminUser) => {
    if (admin.id === currentAdmin?.id) {
      toast({
        title: 'Error',
        description: 'You cannot remove yourself',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove ${admin.user?.display_name || 'this admin'}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', admin.id);

      if (error) throw error;

      await logActivity(
        'Removed admin',
        'admin_users',
        admin.id,
        { admin_name: admin.user?.display_name }
      );

      toast({
        title: 'Success',
        description: 'Admin removed successfully',
      });

      loadAdmins();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      super_admin: { className: 'bg-red-500/10 text-red-600 border-red-500/20', icon: ShieldAlert },
      admin: { className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: ShieldCheck },
      moderator: { className: 'bg-muted text-muted-foreground', icon: Shield },
    };
    const { className, icon: Icon } = config[role as keyof typeof config] || config.moderator;
    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', className)}>
        <Icon className="w-3 h-3" />
        {ROLE_PRESETS[role as keyof typeof ROLE_PRESETS]?.label || role}
      </Badge>
    );
  };

  const stats = {
    total: admins.length,
    active: admins.filter(a => a.is_active).length,
    superAdmins: admins.filter(a => a.role === 'super_admin').length,
    admins: admins.filter(a => a.role === 'admin').length,
    moderators: admins.filter(a => a.role === 'moderator').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Admin Management</h2>
          <p className="text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <PermissionGate permission="admins_manage">
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Admin
          </Button>
        </PermissionGate>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-bold">{stats.active}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.superAdmins}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.admins}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moderators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.moderators}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Admin Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No admins found
                </TableCell>
              </TableRow>
            ) : (
              filteredAdmins.map((admin) => (
                <TableRow key={admin.id} className={!admin.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={admin.user?.avatar_url} />
                        <AvatarFallback>
                          {admin.user?.display_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{admin.user?.display_name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{admin.user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(admin.role)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {admin.role === 'super_admin' 
                        ? 'All permissions' 
                        : `${admin.permissions?.length || 0} permissions`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <PermissionGate permission="admins_manage">
                      <Switch
                        checked={admin.is_active}
                        onCheckedChange={() => handleToggleActive(admin)}
                        disabled={admin.id === currentAdmin?.id}
                      />
                    </PermissionGate>
                    {!isSuperAdmin && (
                      <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{admin.inviter?.display_name || '—'}</div>
                      {admin.invited_at && (
                        <div className="text-muted-foreground text-xs">
                          {format(new Date(admin.invited_at), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {admin.last_login ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(admin.last_login), { addSuffix: true })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <PermissionGate permission="admins_manage">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingAdmin(admin)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleActive(admin)}
                            disabled={admin.id === currentAdmin?.id}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            {admin.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleRemoveAdmin(admin)}
                            disabled={admin.id === currentAdmin?.id}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modals */}
      {showInviteModal && (
        <InviteAdminModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadAdmins();
          }}
        />
      )}

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          open={!!editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSuccess={() => {
            setEditingAdmin(null);
            loadAdmins();
          }}
        />
      )}
    </div>
  );
}
