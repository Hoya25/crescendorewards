import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Send, Users, User, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface SendNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedUserId?: string;
  preselectedUserName?: string;
}

const NOTIFICATION_TYPES = [
  { value: 'admin_message', label: 'Admin Message' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'reward_alert', label: 'Reward Alert' },
  { value: 'account_update', label: 'Account Update' },
  { value: 'promotion', label: 'Promotion' },
];

export function SendNotificationModal({
  open,
  onOpenChange,
  preselectedUserId,
  preselectedUserName,
}: SendNotificationModalProps) {
  const queryClient = useQueryClient();
  const [recipientType, setRecipientType] = useState<'single' | 'multiple' | 'all'>(
    preselectedUserId ? 'single' : 'all'
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    preselectedUserId ? [preselectedUserId] : []
  );
  const [userSearch, setUserSearch] = useState('');
  const [notificationType, setNotificationType] = useState('admin_message');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // Fetch users for selection
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-for-notification', userSearch],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name', { ascending: true })
        .limit(50);

      if (userSearch) {
        query = query.or(`email.ilike.%${userSearch}%,full_name.ilike.%${userSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open && recipientType !== 'all',
  });

  // Send notification mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !message.trim()) {
        throw new Error('Title and message are required');
      }

      let userIds: string[] = [];

      if (recipientType === 'all') {
        // Get all user IDs
        const { data: allUsers, error } = await supabase
          .from('profiles')
          .select('id');
        if (error) throw error;
        userIds = (allUsers || []).map(u => u.id);
      } else {
        userIds = selectedUsers;
      }

      if (userIds.length === 0) {
        throw new Error('Please select at least one recipient');
      }

      // Insert notifications for all selected users
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: notificationType,
        title: title.trim(),
        message: message.trim(),
        is_read: false,
        metadata: { sent_by_admin: true },
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      return { count: userIds.length };
    },
    onSuccess: (data) => {
      toast({
        title: 'Notifications Sent',
        description: `Successfully sent to ${data.count} user${data.count > 1 ? 's' : ''}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-type-counts'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send notifications',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    if (!preselectedUserId) {
      setRecipientType('all');
      setSelectedUsers([]);
    }
    setUserSearch('');
    setNotificationType('admin_message');
    setTitle('');
    setMessage('');
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Notification
          </DialogTitle>
          <DialogDescription>
            Send a custom notification to users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient Selection */}
          {!preselectedUserId && (
            <div className="space-y-3">
              <Label>Recipients</Label>
              <RadioGroup
                value={recipientType}
                onValueChange={(v) => {
                  setRecipientType(v as 'single' | 'multiple' | 'all');
                  if (v === 'all') setSelectedUsers([]);
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex items-center gap-1 cursor-pointer">
                    <Users className="h-4 w-4" />
                    All Users
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple" id="multiple" />
                  <Label htmlFor="multiple" className="cursor-pointer">Select Users</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* User Selection (for multiple) */}
          {(recipientType === 'multiple' || recipientType === 'single') && !preselectedUserId && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.map(id => {
                    const user = users?.find(u => u.id === id);
                    return (
                      <Badge 
                        key={id} 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => toggleUser(id)}
                      >
                        {user?.full_name || user?.email || id}
                        <span className="ml-1">×</span>
                      </Badge>
                    );
                  })}
                </div>
              )}

              <ScrollArea className="h-[150px] border rounded-md p-2">
                {usersLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {users?.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                        onClick={() => toggleUser(user.id)}
                      >
                        <Checkbox checked={selectedUsers.includes(user.id)} />
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {user.full_name || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ))}
                    {users?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No users found
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Show preselected user */}
          {preselectedUserId && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sending to: {preselectedUserName || preselectedUserId}</span>
            </div>
          )}

          {/* Notification Type */}
          <div className="space-y-2">
            <Label>Notification Type</Label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Notification title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || !title.trim() || !message.trim() || 
              (recipientType !== 'all' && selectedUsers.length === 0)}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
