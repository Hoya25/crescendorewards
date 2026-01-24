import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const TIER_EMOJIS = [
  // Medals & Trophies
  '🥉', '🥈', '🥇', '🏆', '💎', '👑',
  // Stars & Sparkles
  '⭐', '🌟', '✨', '💫', '⚡', '🔥',
  // Status Symbols
  '🎖️', '🏅', '🎯', '💯', '🎪', '🎭',
  // Premium
  '💎', '💍', '👸', '🤴', '🦁', '🦅',
  // Nature
  '🌹', '🌸', '🍀', '🌙', '☀️', '🌈',
];

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState(value);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomEmoji(val);
    if (val) {
      onChange(val);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-16 text-2xl"
        >
          {value || '😀'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-1">
            {TIER_EMOJIS.map((emoji, index) => (
              <Button
                key={index}
                variant={value === emoji ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9 text-xl"
                onClick={() => handleSelect(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">Custom:</span>
            <Input
              value={customEmoji}
              onChange={handleCustomChange}
              className="h-8 text-center text-xl"
              maxLength={4}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
