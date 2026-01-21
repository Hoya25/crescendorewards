import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminRole } from '@/hooks/useAdminRole';
import { AdminUser, AdminRole, AdminPermission, PERMISSION_GROUPS, ROLE_PRESETS } from '@/types/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Save, 
  RotateCcw,
  AlertTriangle,
  Ban,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditAdminModalProps {
  admin: AdminUser;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAdminModal({ admin, open, onClose, onSuccess }: EditAdminModalProps) {
  const { isSuperAdmin, adminUser: currentAdmin, logActivity } = useAdminRole();
  const [role, setRole] = useState<AdminRole>(admin.role);
  const [permissions, setPermissions] = useState<AdminPermission[]>(admin.permissions || []);
  const [notes, setNotes] = useState(admin.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCurrentUser = admin.id === currentAdmin?.id;
  const canPromoteToSuperAdmin = isSuperAdmin && !isCurrentUser;

  const handleRoleChange = (newRole: AdminRole) => {
    setRole(newRole);
  };

  const togglePermission = (permission: AdminPermission) => {
    setPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const resetToDefaults = () => {
    setPermissions(ROLE_PRESETS[role].defaultPermissions);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('admin_users')
        .update({
          role,
          permissions,
          notes: notes || null,
        })
        .eq('id', admin.id);

      if (error) throw error;

      const changes = [];
      if (role !== admin.role) changes.push(`role: ${admin.role} → ${role}`);
      if (JSON.stringify(permissions) !== JSON.stringify(admin.permissions)) {
        changes.push(`permissions updated`);
      }
      if (notes !== admin.notes) changes.push('notes updated');

      await logActivity(
        'Updated admin',
        'admin_users',
        admin.id,
        { 
          admin_name: admin.user?.display_name, 
          changes 
        }
      );

      toast({
        title: 'Success',
        description: 'Admin updated successfully',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update admin',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setSubmitting(true);
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

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update admin status',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
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

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove admin',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (r: AdminRole) => {
    switch (r) {
      case 'super_admin': return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'admin': return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      default: return <Shield className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Admin</DialogTitle>
          <DialogDescription>
            Modify role and permissions for this admin
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Admin Info */}
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={admin.user?.avatar_url} />
                  <AvatarFallback>
                    {admin.user?.display_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-lg">{admin.user?.display_name}</div>
                  <div className="text-muted-foreground">{admin.user?.email}</div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    admin.role === 'super_admin' && 'bg-red-500/10 text-red-600 border-red-500/20',
                    admin.role === 'admin' && 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                  )}
                >
                  {getRoleIcon(admin.role)}
                  <span className="ml-1">{ROLE_PRESETS[admin.role].label}</span>
                </Badge>
              </CardContent>
            </Card>

            {isCurrentUser && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You are editing your own admin profile. Some actions may be restricted.
                </AlertDescription>
              </Alert>
            )}

            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Role</Label>
              <Select 
                value={role} 
                onValueChange={(v) => handleRoleChange(v as AdminRole)}
                disabled={isCurrentUser}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Moderator
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      Admin
                    </div>
                  </SelectItem>
                  {canPromoteToSuperAdmin && (
                    <SelectItem value="super_admin">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        Super Admin
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {ROLE_PRESETS[role].description}
              </p>
            </div>

            {role === 'super_admin' && role !== admin.role && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: Promoting to Super Admin grants full access to everything, including managing other admins.
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Permissions */}
            {role !== 'super_admin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <Button variant="ghost" size="sm" onClick={resetToDefaults}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>

                {Object.entries(PERMISSION_GROUPS).map(([key, group]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {group.label}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {group.permissions.map((perm) => (
                        <div
                          key={perm.key}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors",
                            permissions.includes(perm.key)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-accent"
                          )}
                          onClick={() => togglePermission(perm.key)}
                        >
                          <Checkbox
                            checked={permissions.includes(perm.key)}
                            onCheckedChange={() => togglePermission(perm.key)}
                          />
                          <span className="text-sm">{perm.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {role === 'super_admin' && (
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Super Admins have full access to all features and permissions.
                  </p>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any internal notes about this admin..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Danger Zone */}
            {!isCurrentUser && (
              <>
                <Separator />
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive text-base">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {admin.is_active ? 'Deactivate Admin' : 'Activate Admin'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {admin.is_active 
                            ? 'Temporarily remove admin access' 
                            : 'Restore admin access'}
                        </p>
                      </div>
                      <Button 
                        variant={admin.is_active ? "outline" : "default"}
                        onClick={handleDeactivate}
                        disabled={submitting}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        {admin.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Remove Admin</div>
                        <p className="text-sm text-muted-foreground">
                          Permanently remove this admin. This cannot be undone.
                        </p>
                      </div>
                      {!showDeleteConfirm ? (
                        <Button 
                          variant="destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={submitting}
                          >
                            Confirm Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
