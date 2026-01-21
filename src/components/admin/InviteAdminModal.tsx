import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { AdminRole, AdminPermission, PERMISSION_GROUPS, ROLE_PRESETS } from '@/types/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Search, User, Shield, ShieldCheck, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InviteAdminModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SearchResult {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
}

export function InviteAdminModal({ open, onClose, onSuccess }: InviteAdminModalProps) {
  const { profile } = useUnifiedUser();
  const { logActivity } = useAdminRole();
  const [step, setStep] = useState<'search' | 'configure'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [role, setRole] = useState<AdminRole>('moderator');
  const [useDefaultPermissions, setUseDefaultPermissions] = useState(true);
  const [customPermissions, setCustomPermissions] = useState<AdminPermission[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('unified_profiles')
        .select('id, display_name, email, avatar_url')
        .or(`email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Filter out users who are already admins
      const { data: existingAdmins } = await supabase
        .from('admin_users')
        .select('user_id');

      const existingIds = new Set(existingAdmins?.map(a => a.user_id) || []);
      setSearchResults((data || []).filter(u => !existingIds.has(u.id)));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: SearchResult) => {
    setSelectedUser(user);
    setStep('configure');
    setCustomPermissions(ROLE_PRESETS[role].defaultPermissions);
  };

  const handleRoleChange = (newRole: AdminRole) => {
    setRole(newRole);
    if (useDefaultPermissions) {
      setCustomPermissions(ROLE_PRESETS[newRole].defaultPermissions);
    }
  };

  const togglePermission = (permission: AdminPermission) => {
    setCustomPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = async () => {
    if (!selectedUser || !profile) return;

    try {
      setSubmitting(true);
      const permissions = useDefaultPermissions 
        ? ROLE_PRESETS[role].defaultPermissions 
        : customPermissions;

      const { error } = await supabase.from('admin_users').insert({
        user_id: selectedUser.id,
        role,
        permissions,
        invited_by: profile.id,
        notes: notes || null,
      });

      if (error) throw error;

      await logActivity(
        'Invited new admin',
        'admin_users',
        selectedUser.id,
        { 
          admin_name: selectedUser.display_name, 
          role, 
          permissions_count: permissions.length 
        }
      );

      toast({
        title: 'Success',
        description: `${selectedUser.display_name} has been invited as ${ROLE_PRESETS[role].label}`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite admin',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setRole('moderator');
    setUseDefaultPermissions(true);
    setCustomPermissions([]);
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Invite Admin</DialogTitle>
          <DialogDescription>
            {step === 'search' 
              ? 'Search for a user to invite as an admin' 
              : `Configure permissions for ${selectedUser?.display_name}`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {step === 'search' ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <Card 
                      key={user.id} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectUser(user)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.display_name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{user.display_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !searching && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found. Try a different search term.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected User */}
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUser?.avatar_url} />
                    <AvatarFallback>
                      {selectedUser?.display_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-lg">{selectedUser?.display_name}</div>
                    <div className="text-muted-foreground">{selectedUser?.email}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Role</Label>
                <RadioGroup value={role} onValueChange={(v) => handleRoleChange(v as AdminRole)}>
                  {(['admin', 'moderator'] as AdminRole[]).map((r) => (
                    <div 
                      key={r}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        role === r ? "border-primary bg-primary/5" : "hover:bg-accent"
                      )}
                      onClick={() => handleRoleChange(r)}
                    >
                      <RadioGroupItem value={r} id={r} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {r === 'admin' ? (
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Shield className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Label htmlFor={r} className="font-medium cursor-pointer">
                            {ROLE_PRESETS[r].label}
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ROLE_PRESETS[r].description}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="use-defaults"
                      checked={useDefaultPermissions}
                      onCheckedChange={(checked) => {
                        setUseDefaultPermissions(!!checked);
                        if (checked) {
                          setCustomPermissions(ROLE_PRESETS[role].defaultPermissions);
                        }
                      }}
                    />
                    <Label htmlFor="use-defaults" className="text-sm cursor-pointer">
                      Use default permissions for this role
                    </Label>
                  </div>
                </div>

                {!useDefaultPermissions && (
                  <div className="space-y-4">
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
                                customPermissions.includes(perm.key)
                                  ? "border-primary bg-primary/5"
                                  : "hover:bg-accent"
                              )}
                              onClick={() => togglePermission(perm.key)}
                            >
                              <Checkbox
                                checked={customPermissions.includes(perm.key)}
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

                {useDefaultPermissions && (
                  <div className="flex flex-wrap gap-2">
                    {ROLE_PRESETS[role].defaultPermissions.map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {p.replace('_', ' ')}
                      </Badge>
                    ))}
                    {ROLE_PRESETS[role].defaultPermissions.length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        Default permissions will be applied
                      </span>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any internal notes about this admin..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 mt-4">
          {step === 'configure' && (
            <Button variant="ghost" onClick={() => setStep('search')}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'configure' && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Invite as {ROLE_PRESETS[role].label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
