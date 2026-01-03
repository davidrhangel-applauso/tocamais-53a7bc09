import { useSearchParams } from "react-router-dom";
import { Clock, CheckCircle, DollarSign, Music, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

interface MobileBottomNavProps {
  pendentes: number;
  aceitos: number;
  aguardandoPix: number;
}

export function MobileBottomNav({ pendentes, aceitos, aguardandoPix }: MobileBottomNavProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "pendentes";

  const navItems: NavItem[] = [
    { value: "pendentes", icon: Clock, label: "Pendentes", badge: pendentes },
    { value: "aceitos", icon: CheckCircle, label: "Aceitos", badge: aceitos },
    ...(aguardandoPix > 0 ? [{ value: "aguardando_pix", icon: DollarSign, label: "PIX", badge: aguardandoPix }] : []),
    { value: "gorjetas", icon: DollarSign, label: "Gorjetas" },
    { value: "repertorio", icon: Music, label: "Repertório" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.value;
          
          return (
            <button
              key={item.value}
              onClick={() => setSearchParams({ tab: item.value })}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 px-1 relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 truncate max-w-full",
                isActive && "font-medium"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
