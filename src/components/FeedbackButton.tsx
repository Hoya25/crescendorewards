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
import { supabase } from '@/lib/supabase';
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
      {/* Floating feedback button - mobile-optimized with safe area */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center gap-2 w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary active:scale-95 sm:hover:scale-105 transition-all backdrop-blur-sm touch-manipulation"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Send feedback"
      >
        <MessageSquare className="w-5 h-5 sm:w-4 sm:h-4" />
        <span className="text-sm font-medium hidden sm:inline">Feedback</span>
      </button>

      {/* Feedback dialog - mobile-optimized full-screen on small devices */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto sm:mx-0 max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-primary" />
              Beta Feedback
            </DialogTitle>
            <DialogDescription className="text-sm">
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
                className="min-h-[80px] resize-none text-base sm:text-sm"
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
                className="min-h-[80px] resize-none text-base sm:text-sm"
              />
            </div>

            <p className="text-xs text-muted-foreground truncate">
              Page: {location.pathname}
              {user && ' • Logged in'}
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-10"
            >
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
