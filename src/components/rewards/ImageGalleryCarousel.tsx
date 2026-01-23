import { useState } from 'react';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface ImageGalleryCarouselProps {
  images: string[];
  title: string;
  className?: string;
  children?: React.ReactNode; // For overlay badges
}

export function ImageGalleryCarousel({ 
  images, 
  title, 
  className,
  children 
}: ImageGalleryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  
  // Filter out empty/null images
  const validImages = images.filter(img => img && img.trim() !== '');
  
  // If no valid images, show placeholder
  if (validImages.length === 0) {
    return (
      <div className={cn("relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted", className)}>
        <ImageWithFallback
          src="/placeholder.svg"
          alt={title}
          className="w-full h-full object-cover"
        />
        {children}
      </div>
    );
  }
  
  const hasMultipleImages = validImages.length > 1;
  const currentImage = validImages[currentIndex] || validImages[0];
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };
  
  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* Main Image Container */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted group">
          <ImageWithFallback
            src={currentImage}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300"
          />
          
          {/* Zoom Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={() => setShowLightbox(true)}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          {/* Navigation Arrows - Only show if multiple images */}
          {hasMultipleImages && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg h-10 w-10"
                onClick={goToPrevious}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg h-10 w-10"
                onClick={goToNext}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}
          
          {/* Image Counter - Only show if multiple images */}
          {hasMultipleImages && (
            <Badge 
              variant="secondary" 
              className="absolute bottom-4 right-4 bg-black/60 text-white border-0"
            >
              {currentIndex + 1} / {validImages.length}
            </Badge>
          )}
          
          {/* Children (overlay badges like Sponsored, Featured) */}
          {children}
        </div>
        
        {/* Thumbnail Strip - Only show if multiple images */}
        {hasMultipleImages && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {validImages.map((img, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all",
                  currentIndex === index 
                    ? "border-primary ring-2 ring-primary/30" 
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <ImageWithFallback
                  src={img}
                  alt={`${title} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Lightbox Dialog */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0">
          <div className="relative">
            <img
              src={currentImage}
              alt={`${title} - Full size`}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            
            {/* Navigation in lightbox */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {validImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToIndex(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        currentIndex === index 
                          ? "bg-white w-4" 
                          : "bg-white/50 hover:bg-white/75"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
