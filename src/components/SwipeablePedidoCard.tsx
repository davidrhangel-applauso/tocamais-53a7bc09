import { useState, useRef, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Archive, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeablePedidoCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void; // Archive
  onSwipeRight?: () => void; // Delete
  className?: string;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 120;

export function SwipeablePedidoCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  disabled = false,
}: SwipeablePedidoCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || disabled) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limit the swipe distance
    const clampedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff));
    setTranslateX(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (!isSwiping || disabled) return;
    setIsSwiping(false);

    if (translateX <= -SWIPE_THRESHOLD && onSwipeLeft) {
      // Swiped left - Archive
      setTranslateX(-MAX_SWIPE);
      setTimeout(() => {
        onSwipeLeft();
        setTranslateX(0);
      }, 200);
    } else if (translateX >= SWIPE_THRESHOLD && onSwipeRight) {
      // Swiped right - Delete
      setTranslateX(MAX_SWIPE);
      setTimeout(() => {
        onSwipeRight();
        setTranslateX(0);
      }, 200);
    } else {
      // Reset position
      setTranslateX(0);
    }
  };

  const getLeftActionOpacity = () => {
    if (translateX >= 0) return 0;
    return Math.min(1, Math.abs(translateX) / SWIPE_THRESHOLD);
  };

  const getRightActionOpacity = () => {
    if (translateX <= 0) return 0;
    return Math.min(1, translateX / SWIPE_THRESHOLD);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Archive action (left swipe - shows on right side) */}
      {onSwipeLeft && (
        <div
          className="absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-amber-500 text-white transition-opacity"
          style={{ opacity: getLeftActionOpacity() }}
        >
          <div className="flex flex-col items-center gap-1">
            <Archive className="w-6 h-6" />
            <span className="text-xs font-medium">Arquivar</span>
          </div>
        </div>
      )}

      {/* Delete action (right swipe - shows on left side) */}
      {onSwipeRight && (
        <div
          className="absolute inset-y-0 left-0 w-24 flex items-center justify-center bg-destructive text-destructive-foreground transition-opacity"
          style={{ opacity: getRightActionOpacity() }}
        >
          <div className="flex flex-col items-center gap-1">
            <Trash2 className="w-6 h-6" />
            <span className="text-xs font-medium">Excluir</span>
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative transition-transform bg-background rounded-lg",
          !isSwiping && "duration-200",
          className
        )}
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
