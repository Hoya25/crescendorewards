import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES = ['Founder', 'Employee', 'Partner', 'Ambassador'];

interface AboutYouStepProps {
  displayName: string;
  isSponsor: boolean;
  brandName: string;
  brandRole: string;
  onDisplayNameChange: (v: string) => void;
  onIsSponsorChange: (v: boolean) => void;
  onBrandNameChange: (v: string) => void;
  onBrandRoleChange: (v: string) => void;
}

export function AboutYouStep({
  displayName, isSponsor, brandName, brandRole,
  onDisplayNameChange, onIsSponsorChange, onBrandNameChange, onBrandRoleChange,
}: AboutYouStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About You</CardTitle>
        <CardDescription>How should we credit you?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Display Name</Label>
          <Input
            value={displayName}
            onChange={e => onDisplayNameChange(e.target.value)}
            placeholder="Your display name"
          />
          <p className="text-xs text-muted-foreground">This is what shows on the content: "Shared by {displayName || '...'}"</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Switch checked={isSponsor} onCheckedChange={onIsSponsorChange} id="is-sponsor" />
          <Label htmlFor="is-sponsor">Are you affiliated with a brand/sponsor?</Label>
        </div>

        {isSponsor && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
            <div className="space-y-2">
              <Label>Brand / Company Name</Label>
              <Input
                value={brandName}
                onChange={e => onBrandNameChange(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label>Your Role</Label>
              <Select value={brandRole} onValueChange={onBrandRoleChange}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Content will show: 🏢 From {brandName || '...'}</p>
          </div>
        )}

        {!isSponsor && (
          <p className="text-xs text-muted-foreground">Content will show: 👤 Shared by {displayName || '...'}</p>
        )}
      </CardContent>
    </Card>
  );
}
