import { useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { UserJourneyModal } from './admin/UserJourneyModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ClickableUsernameProps {
  userId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  showAvatar?: boolean;
  className?: string;
  avatarSize?: 'sm' | 'md' | 'lg';
}

export function ClickableUsername({
  userId,
  displayName,
  email,
  avatarUrl,
  showAvatar = false,
  className = '',
  avatarSize = 'sm'
}: ClickableUsernameProps) {
  const { isAdmin } = useAdminRole();
  const [showJourney, setShowJourney] = useState(false);

  const avatarSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const initials = displayName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  // Only admins can click to view journey
  if (!isAdmin) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        {showAvatar && (
          <Avatar className={avatarSizeClasses[avatarSize]}>
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        )}
        <span>{displayName}</span>
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowJourney(true)}
        className={cn(
          'inline-flex items-center gap-1.5 group hover:text-primary cursor-pointer text-left transition-colors',
          className
        )}
        title="View user journey"
      >
        {showAvatar && (
          <Avatar className={avatarSizeClasses[avatarSize]}>
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        )}
        <span className="underline decoration-dotted underline-offset-2 group-hover:decoration-solid">
          {displayName}
        </span>
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          👁
        </span>
      </button>

      {showJourney && (
        <UserJourneyModal
          userId={userId}
          displayName={displayName}
          email={email}
          onClose={() => setShowJourney(false)}
        />
      )}
    </>
  );
}
