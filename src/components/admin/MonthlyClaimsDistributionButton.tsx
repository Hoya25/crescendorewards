import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Gift, Loader2 } from 'lucide-react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function MonthlyClaimsDistributionButton() {
  const [distributing, setDistributing] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDistribute = async () => {
    try {
      setDistributing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/monthly-claims-distribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Distribution failed');
      }

      toast({
        title: '✅ Monthly Claims Distributed',
        description: `${result.total_claims_distributed} Claims distributed to ${result.users_processed} members.`,
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Distribution Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDistributing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Gift className="w-4 h-4" />
          Distribute Monthly Claims
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Distribute Monthly Claims</AlertDialogTitle>
          <AlertDialogDescription>
            This will credit Claims to all eligible members based on their current status tier:
            <br /><br />
            <strong>Silver:</strong> 2 Claims · <strong>Gold:</strong> 5 Claims · <strong>Platinum:</strong> 10 Claims · <strong>Diamond:</strong> 20 Claims
            <br /><br />
            Bronze members (0 Claims) will be skipped. Each member will receive a notification. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={distributing}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDistribute} disabled={distributing}>
            {distributing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Distributing...
              </>
            ) : (
              'Confirm Distribution'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
