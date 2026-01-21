import { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Send, Loader2, Image, X } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { user } = useAuthContext();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    const fileExt = selectedImage.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('feedback-screenshots')
      .upload(filePath, selectedImage);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload screenshot');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('feedback-screenshots')
      .getPublicUrl(filePath);

    return publicUrl;
  };

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
      // Upload image if selected
      let imageUrl: string | null = null;
      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        page_url: location.pathname + location.search,
        whats_working: whatsWorking.trim() || null,
        whats_broken: whatsBroken.trim() || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast({
        title: 'Thank you!',
        description: 'Your feedback helps us improve Crescendo.',
      });

      setWhatsWorking('');
      setWhatsBroken('');
      setSelectedImage(null);
      setImagePreview(null);
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

            {/* Screenshot upload section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Attach a screenshot (optional) 📸
              </Label>
              
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <img 
                    src={imagePreview} 
                    alt="Screenshot preview" 
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground shadow-sm"
                    aria-label="Remove screenshot"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  <Image className="w-5 h-5" />
                  <span className="text-xs">Click to add screenshot</span>
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
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
