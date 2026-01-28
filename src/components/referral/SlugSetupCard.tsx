import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, Loader2, Sparkles, Link2, RefreshCw } from 'lucide-react';
import { useReferralSlug, generateSlugSuggestions, validateSlugFormat } from '@/hooks/useReferralSlug';
import { PRODUCTION_DOMAIN } from '@/lib/referral-links';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { cn } from '@/lib/utils';

interface SlugSetupCardProps {
  onSlugSaved?: (slug: string) => void;
}

export function SlugSetupCard({ onSlugSaved }: SlugSetupCardProps) {
  const { profile } = useUnifiedUser();
  const { 
    currentSlug, 
    isLoadingSlug, 
    checkAvailability, 
    checkingSlug,
    saveSlug, 
    isSaving 
  } = useReferralSlug();

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [availability, setAvailability] = useState<{ available: boolean; error?: string } | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Generate suggestions on mount
  useEffect(() => {
    if (profile?.display_name && !currentSlug) {
      const slugSuggestions = generateSlugSuggestions(profile.display_name);
      setSuggestions(slugSuggestions);
      // Auto-select first suggestion
      if (slugSuggestions.length > 0 && !inputValue) {
        setInputValue(slugSuggestions[0]);
      }
    }
  }, [profile?.display_name, currentSlug]);

  // Debounced availability check
  const checkSlugDebounced = useCallback((slug: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const validation = validateSlugFormat(slug);
    if (!validation.valid) {
      setAvailability({ available: false, error: validation.error });
      return;
    }

    setAvailability(null); // Reset while checking

    const timer = setTimeout(async () => {
      const result = await checkAvailability(slug);
      setAvailability(result);
    }, 300);

    setDebounceTimer(timer);
  }, [checkAvailability, debounceTimer]);

  // Handle input change
  const handleInputChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setInputValue(normalized);
    
    if (normalized.length >= 3) {
      checkSlugDebounced(normalized);
    } else if (normalized.length > 0) {
      setAvailability({ available: false, error: 'Must be at least 3 characters' });
    } else {
      setAvailability(null);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    const result = await checkAvailability(suggestion);
    setAvailability(result);
  };

  // Handle save
  const handleSave = async () => {
    if (!inputValue || !availability?.available) return;
    
    const result = await saveSlug(inputValue);
    if (result.success && result.slug) {
      setIsEditing(false);
      onSlugSaved?.(result.slug);
    }
  };

  // Regenerate suggestions
  const regenerateSuggestions = () => {
    if (profile?.display_name) {
      const newSuggestions = generateSlugSuggestions(profile.display_name);
      setSuggestions(newSuggestions);
    }
  };

  if (isLoadingSlug) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  // If user already has a slug and not editing, show it with edit option
  if (currentSlug && !isEditing) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            Your Personalized Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border">
            <span className="text-sm text-muted-foreground">{PRODUCTION_DOMAIN}/join/</span>
            <span className="font-medium text-primary">{currentSlug}</span>
            <Badge variant="outline" className="ml-auto text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setIsEditing(true);
              setInputValue(currentSlug);
              setAvailability({ available: true });
            }}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Change My Link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create Your Personalized Link
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Make your invite link memorable and easy to share
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Preview */}
        <div className="flex items-center gap-1 p-3 rounded-lg bg-background/70 border">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {PRODUCTION_DOMAIN}/join/
          </span>
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="your-name"
            className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
            maxLength={30}
          />
          {checkingSlug && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {availability && !checkingSlug && (
            availability.available ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-destructive" />
            )
          )}
        </div>

        {/* Validation message */}
        {availability && !availability.available && availability.error && (
          <p className="text-xs text-destructive">{availability.error}</p>
        )}
        {availability?.available && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ This name is available!</p>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Suggestions based on your name:</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={regenerateSuggestions}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 4).map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className={cn(
                    "cursor-pointer hover:bg-accent transition-colors",
                    inputValue === suggestion && "bg-accent border-primary"
                  )}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Save/Cancel buttons */}
        <div className="flex gap-2">
          {isEditing && currentSlug && (
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setInputValue('');
                setAvailability(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!inputValue || !availability?.available || isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Link' : 'Claim This Link'}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          3-30 characters • Letters, numbers, and hyphens only
        </p>
      </CardContent>
    </Card>
  );
}
