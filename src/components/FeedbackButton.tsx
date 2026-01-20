import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [whatsWorking, setWhatsWorking] = useState('');
  const [whatsBroken, setWhatsBroken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const { user } = useAuthContext();

  const handleSubmit = async () => {
    if (!whatsWorking.trim() && !whatsBroken.trim()) {
      toast({
        title: 'Please provide feedback',
        description: 'Fill in at least one field before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        page_url: location.pathname + location.search,
        whats_working: whatsWorking.trim() || null,
        whats_broken: whatsBroken.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve Crescendo.',
      });

      setWhatsWorking('');
      setWhatsBroken('');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Failed to submit',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating feedback button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-all hover:scale-105 backdrop-blur-sm"
        aria-label="Send feedback"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Feedback</span>
      </button>

      {/* Feedback dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Beta Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve Crescendo! Your feedback is invaluable.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="whats-working" className="text-sm font-medium">
                What's working well? ✨
              </Label>
              <Textarea
                id="whats-working"
                placeholder="Tell us what you like..."
                value={whatsWorking}
                onChange={(e) => setWhatsWorking(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whats-broken" className="text-sm font-medium">
                What's broken or could be better? 🔧
              </Label>
              <Textarea
                id="whats-broken"
                placeholder="Tell us about issues or improvements..."
                value={whatsBroken}
                onChange={(e) => setWhatsBroken(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Page: {location.pathname}
              {user && ' • Logged in'}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
