import { useEffect, useState, useCallback } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Suggestion {
  handle: string;
  available: boolean | null;
  checking: boolean;
}

function generateVariations(base: string): string[] {
  if (!base || base.length < 3) return [];
  const cleaned = base.replace(/[^a-z0-9_]/g, '');
  if (cleaned.length < 2) return [];
  const candidates = [
    cleaned.length <= 17 ? cleaned + '_og' : null,
    cleaned.length <= 18 ? cleaned + '_x' : null,
    cleaned.length <= 17 ? 'the_' + cleaned : null,
    cleaned.length <= 16 ? cleaned + '_real' : null,
  ];
  return candidates.filter((s): s is string => s !== null && s.length >= 3 && s.length <= 20);
}

interface Props {
  input: string;
  onSelect: (handle: string) => void;
  visible: boolean;
}

export function HandleSuggestionsDropdown({ input, onSelect, visible }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const checkAll = useCallback(async (value: string) => {
    const variations = generateVariations(value);
    // Include the user's exact input + variations
    const all = [value, ...variations.filter((v) => v !== value)];
    const initial: Suggestion[] = all.map((h) => ({ handle: h, available: null, checking: true }));
    setSuggestions(initial);

    const results = await Promise.all(
      all.map(async (h) => {
        try {
          const { data } = await supabase.rpc('check_handle_available', { p_handle: h });
          const r = data as unknown as { available: boolean };
          return { handle: h, available: r?.available ?? false, checking: false };
        } catch {
          return { handle: h, available: false, checking: false };
        }
      }),
    );
    setSuggestions(results);
  }, []);

  useEffect(() => {
    if (!visible || input.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => checkAll(input), 400);
    return () => clearTimeout(timer);
  }, [input, visible, checkAll]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
      {suggestions.map((s) => {
        const isExact = s.handle === input;
        return (
          <button
            key={s.handle}
            type="button"
            disabled={s.checking || !s.available}
            onClick={() => s.available && onSelect(s.handle)}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors
              ${s.available ? 'hover:bg-accent cursor-pointer' : 'opacity-60 cursor-default'}
              ${isExact ? 'bg-muted/40' : ''}
            `}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">@</span>
              <span className={`font-medium ${isExact ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.handle}
              </span>
              {isExact && (
                <span className="text-[10px] text-muted-foreground ml-1">exact</span>
              )}
            </span>
            <span>
              {s.checking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : s.available ? (
                <Check className="h-3.5 w-3.5" style={{ color: '#E2FF6D' }} />
              ) : (
                <X className="h-3.5 w-3.5 text-destructive" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
