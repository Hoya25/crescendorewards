import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Minus, Plus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EditableCellType = 'text' | 'number' | 'dropdown' | 'toggle';

interface EditableCellProps {
  value: string | number | boolean | null;
  type: EditableCellType;
  onSave: (newValue: any) => Promise<void>;
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayValue?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  showStepper?: boolean;
}

export function EditableCell({
  value,
  type,
  onSave,
  options = [],
  placeholder = '',
  className,
  displayValue,
  min,
  max,
  disabled = false,
  showStepper = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync tempValue when external value changes
  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(async (newValue: any) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      // Revert to original value on error
      setTempValue(value);
    } finally {
      setIsSaving(false);
    }
  }, [value, onSave]);

  const handleCancel = useCallback(() => {
    setTempValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(tempValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      handleSave(tempValue);
    }
  }, [tempValue, handleSave, handleCancel]);

  // Toggle - immediate save on click
  if (type === 'toggle') {
    return (
      <div className="flex justify-center">
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => handleSave(checked)}
            disabled={disabled || isSaving}
          />
        )}
      </div>
    );
  }

  // Dropdown - immediate save on selection
  if (type === 'dropdown') {
    return (
      <div className={cn("min-w-[100px]", className)}>
        {isSaving ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </div>
        ) : (
          <Select
            value={String(value || '')}
            onValueChange={(newValue) => handleSave(newValue)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  // Number with stepper
  if (type === 'number' && showStepper) {
    const numValue = typeof value === 'number' ? value : 0;

    const handleIncrement = async () => {
      const newVal = max !== undefined ? Math.min(numValue + 1, max) : numValue + 1;
      await handleSave(newVal);
    };

    const handleDecrement = async () => {
      const newVal = min !== undefined ? Math.max(numValue - 1, min) : numValue - 1;
      await handleSave(newVal);
    };

    return (
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleDecrement}
          disabled={disabled || isSaving || (min !== undefined && numValue <= min)}
        >
          <Minus className="w-3 h-3" />
        </Button>
        
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              type="number"
              value={tempValue as number}
              onChange={(e) => setTempValue(parseInt(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              onBlur={() => handleSave(tempValue)}
              className="h-6 w-16 text-center text-xs"
              min={min}
              max={max}
              disabled={isSaving}
            />
          </div>
        ) : (
          <button
            onClick={() => !disabled && setIsEditing(true)}
            className={cn(
              "h-6 min-w-8 px-2 text-sm hover:bg-muted rounded transition-colors",
              disabled && "cursor-default",
              isSaving && "opacity-50"
            )}
            disabled={disabled}
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : displayValue ?? value}
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleIncrement}
          disabled={disabled || isSaving || (max !== undefined && numValue >= max)}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  // Text and Number fields - edit on click
  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          value={tempValue as string | number}
          onChange={(e) => setTempValue(type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => handleSave(tempValue)}
          className={cn("h-7 text-sm", type === 'number' ? 'w-20 text-right' : 'w-full')}
          placeholder={placeholder}
          min={min}
          max={max}
          disabled={isSaving}
        />
        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  // Display mode
  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      className={cn(
        "text-left w-full px-1 py-0.5 rounded hover:bg-muted/50 transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        type === 'number' && "text-right",
        disabled && "cursor-default hover:bg-transparent",
        className
      )}
      disabled={disabled}
      title={disabled ? undefined : 'Click to edit'}
    >
      <span className={cn(
        isSaving && "opacity-50"
      )}>
        {displayValue ?? value ?? placeholder}
      </span>
    </button>
  );
}
