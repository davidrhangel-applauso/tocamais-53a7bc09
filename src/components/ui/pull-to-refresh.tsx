import { useState, useRef, useCallback, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollableChildRef = useRef<HTMLElement | null>(null);

  const THRESHOLD = 80;
  const MAX_PULL = 120;

  // Verifica se o elemento ou um ancestral tem scroll próprio
  const findScrollableParent = useCallback((element: HTMLElement | null): HTMLElement | null => {
    while (element && element !== containerRef.current) {
      const style = window.getComputedStyle(element);
      const overflowY = style.overflowY;
      
      if ((overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollableChild = findScrollableParent(target);
    
    // Se o toque está em um elemento scrollável que NÃO está no topo, não ativar pull
    if (scrollableChild && scrollableChild.scrollTop > 0) {
      setIsPulling(false);
      scrollableChildRef.current = null;
      return;
    }
    
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      scrollableChildRef.current = scrollableChild;
    }
  }, [findScrollableParent]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // Se há um elemento scrollável filho que agora tem scroll, cancelar o pull
    if (scrollableChildRef.current && scrollableChildRef.current.scrollTop > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Só previne o default se não há elemento scrollável ou ele está no topo
      if (!scrollableChildRef.current || scrollableChildRef.current.scrollTop === 0) {
        e.preventDefault();
        const distance = Math.min(diff * 0.5, MAX_PULL);
        setPullDistance(distance);
      }
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-200",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: isRefreshing ? 16 : Math.max(pullDistance - 40, 8),
        }}
      >
        <div
          className={cn(
            "rounded-full bg-primary/10 p-2 shadow-lg border border-primary/20 backdrop-blur-sm",
            isRefreshing && "animate-pulse"
          )}
        >
          <RefreshCw
            className={cn(
              "w-5 h-5 text-primary transition-transform",
              isRefreshing && "animate-spin"
            )}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${progress * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: isPulling || isRefreshing
            ? `translateY(${isRefreshing ? 50 : pullDistance}px)`
            : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
