import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Download, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusTier {
  id: string;
  tier_name: string;
  display_name: string;
  badge_emoji: string;
  badge_color: string;
  min_nctr_360_locked: number;
  earning_multiplier: number;
  claims_per_month: number;
  claims_per_year: number;
  unlimited_claims: boolean;
  discount_percent: number;
  priority_support: boolean;
  early_access: boolean;
  vip_events: boolean;
  concierge_service: boolean;
  free_shipping: boolean;
  sort_order: number;
}

interface TierComparisonTableProps {
  tiers: StatusTier[];
  onUpdate: (tierId: string, field: keyof StatusTier, value: any) => void;
  onSave: () => void;
  hasChanges: boolean;
}

type EditingCell = {
  tierId: string;
  field: keyof StatusTier;
} | null;

export function TierComparisonTable({ tiers, onUpdate, onSave, hasChanges }: TierComparisonTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState<string>('');

  const sortedTiers = [...tiers].sort((a, b) => a.sort_order - b.sort_order);

  const startEdit = (tierId: string, field: keyof StatusTier, currentValue: any) => {
    setEditingCell({ tierId, field });
    setEditValue(String(currentValue));
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    const { tierId, field } = editingCell;
    let value: any = editValue;
    
    // Parse value based on field type
    if (['min_nctr_360_locked', 'claims_per_month', 'claims_per_year', 'discount_percent'].includes(field)) {
      value = parseInt(editValue) || 0;
    } else if (field === 'earning_multiplier') {
      value = parseFloat(editValue) || 1;
    }
    
    onUpdate(tierId, field, value);
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const checkProgression = (field: keyof StatusTier, tierIndex: number, value: number): boolean => {
    if (tierIndex === 0) return true;
    const prevTier = sortedTiers[tierIndex - 1];
    const prevValue = prevTier[field] as number;
    return value >= prevValue;
  };

  const exportToCSV = () => {
    const headers = [
      'Tier', 'NCTR Required', 'Multiplier', 'Claims/Month', 'Claims/Year', 
      'Unlimited', 'Discount %', 'Priority Support', 'Early Access', 
      'VIP Events', 'Concierge', 'Free Shipping'
    ];
    
    const rows = sortedTiers.map(tier => [
      tier.display_name,
      tier.min_nctr_360_locked,
      tier.earning_multiplier,
      tier.claims_per_month,
      tier.claims_per_year,
      tier.unlimited_claims ? 'Yes' : 'No',
      tier.discount_percent,
      tier.priority_support ? 'Yes' : 'No',
      tier.early_access ? 'Yes' : 'No',
      tier.vip_events ? 'Yes' : 'No',
      tier.concierge_service ? 'Yes' : 'No',
      tier.free_shipping ? 'Yes' : 'No',
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tier-benefits.csv';
    a.click();
  };

  const renderEditableCell = (tier: StatusTier, field: keyof StatusTier, tierIndex: number) => {
    const value = tier[field];
    const isEditing = editingCell?.tierId === tier.id && editingCell?.field === field;
    const isNumber = ['min_nctr_360_locked', 'earning_multiplier', 'claims_per_month', 'claims_per_year', 'discount_percent'].includes(field);
    const isProgValid = isNumber ? checkProgression(field, tierIndex, value as number) : true;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-7 w-20 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEdit}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    const displayValue = field === 'earning_multiplier' 
      ? `${value}x` 
      : field === 'discount_percent' 
        ? `${value}%` 
        : field === 'min_nctr_360_locked'
          ? (value as number).toLocaleString()
          : value;

    return (
      <button
        onClick={() => startEdit(tier.id, field, value)}
        className={cn(
          "group flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition-colors text-left",
          !isProgValid && "bg-destructive/10 text-destructive"
        )}
      >
        <span className="text-sm">{displayValue}</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </button>
    );
  };

  const renderBooleanCell = (tier: StatusTier, field: keyof StatusTier, tierIndex: number) => {
    const value = tier[field] as boolean;
    const prevTier = tierIndex > 0 ? sortedTiers[tierIndex - 1] : null;
    const isRegression = prevTier && (prevTier[field] as boolean) && !value;

    return (
      <button
        onClick={() => onUpdate(tier.id, field, !value)}
        className={cn(
          "p-1 rounded transition-colors",
          isRegression && "bg-destructive/10"
        )}
      >
        {value ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground/50" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tier Comparison</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {hasChanges && (
            <Button size="sm" onClick={onSave}>
              Save All Changes
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10">Benefit</TableHead>
              {sortedTiers.map(tier => (
                <TableHead key={tier.id} className="text-center min-w-[100px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">{tier.badge_emoji}</span>
                    <span style={{ color: tier.badge_color }}>{tier.display_name}</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* NCTR Required */}
            <TableRow>
              <TableCell className="sticky left-0 bg-background font-medium">NCTR Required</TableCell>
              {sortedTiers.map((tier, i) => (
                <TableCell key={tier.id} className="text-center">
                  {renderEditableCell(tier, 'min_nctr_360_locked', i)}
                </TableCell>
              ))}
            </TableRow>

            {/* Earning Multiplier */}
            <TableRow>
              <TableCell className="sticky left-0 bg-background font-medium">Earning Multiplier</TableCell>
              {sortedTiers.map((tier, i) => (
                <TableCell key={tier.id} className="text-center">
                  {renderEditableCell(tier, 'earning_multiplier', i)}
                </TableCell>
              ))}
            </TableRow>

            {/* Claims */}
            <TableRow>
              <TableCell className="sticky left-0 bg-background font-medium">Claims/Year</TableCell>
              {sortedTiers.map((tier, i) => (
                <TableCell key={tier.id} className="text-center">
                  {tier.unlimited_claims ? (
                    <Badge variant="secondary">∞</Badge>
                  ) : (
                    renderEditableCell(tier, 'claims_per_year', i)
                  )}
                </TableCell>
              ))}
            </TableRow>

            {/* Discount */}
            <TableRow>
              <TableCell className="sticky left-0 bg-background font-medium">Discount</TableCell>
              {sortedTiers.map((tier, i) => (
                <TableCell key={tier.id} className="text-center">
                  {renderEditableCell(tier, 'discount_percent', i)}
                </TableCell>
              ))}
            </TableRow>

            {/* Boolean perks */}
            <TableRow>
              <TableCell className="sticky left-0 bg-background font-medium">Priority Support</TableCell>
              {sortedTiers.map((tier, i) => (
                <TableCell key={tier.id} className="text-center">
                  {renderBooleanCell(tier, 'priority_support', i)}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell className="sticky left-0 bg-background font-medium">Early Access</TableCell>
              {sortedTiers.map((tier, i) => (
                <TableCell key={tier.id} className="text-center">
                  {renderBooleanCell(tier, 'early_access', i)}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell className="sticky left-0 bg-background font-medium">VIP Events</TableCell>
              {sortedTiers.map((tier, i) => (
                <TableCell key={tier.id} className="text-center">
                  {renderBooleanCell(tier, 'vip_events', i)}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell className="sticky left-0 bg-background font-medium">Concierge</TableCell>
              {sortedTiers.map((tier, i) => (
                <TableCell key={tier.id} className="text-center">
                  {renderBooleanCell(tier, 'concierge_service', i)}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell className="sticky left-0 bg-background font-medium">Free Shipping</TableCell>
              {sortedTiers.map((tier, i) => (
                <TableCell key={tier.id} className="text-center">
                  {renderBooleanCell(tier, 'free_shipping', i)}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Click any cell to edit. <span className="text-destructive">Red cells</span> indicate regression from previous tier.
      </p>
    </div>
  );
}
