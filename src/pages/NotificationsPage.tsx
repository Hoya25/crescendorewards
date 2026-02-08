import { Bell, Check, CheckCheck, Gift, FileText, Sparkles, Coins, Truck, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'claim_approved':
      return <Check className="h-5 w-5 text-green-500" />;
    case 'new_reward':
      return <Sparkles className="h-5 w-5 text-primary" />;
    case 'submission_review':
      return <FileText className="h-5 w-5 text-amber-500" />;
    case 'nctr_earned':
      return <Coins className="h-5 w-5 text-primary" />;
    case 'referral_success':
      return <Sparkles className="h-5 w-5 text-green-500" />;
    case 'claim_shipped':
    case 'claim_delivered':
      return <Truck className="h-5 w-5 text-blue-500" />;
    case 'restock':
      return <Gift className="h-5 w-5 text-primary" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

function NotificationCard({ notification, onMarkAsRead }: { notification: Notification; onMarkAsRead: (id: string) => void }) {
  return (
    <Card
      className={cn(
        'p-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-accent/50',
        !notification.is_read && 'bg-accent/30 border-primary/20'
      )}
      onClick={() => {
        if (!notification.is_read) onMarkAsRead(notification.id);
      }}
    >
      <div className="flex-shrink-0 mt-0.5 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm', !notification.is_read && 'font-semibold')}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </Card>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <>
      <SEO title="Notifications" description="View your notifications and updates." />
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-1.5">
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notification list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4 h-20 animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="p-12 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">All caught up!</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                You'll see notifications here when you earn NCTR or claim rewards.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <NotificationCard key={n.id} notification={n} onMarkAsRead={markAsRead} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
