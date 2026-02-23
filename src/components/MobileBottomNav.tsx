import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, CheckCircle, DollarSign, Music, List, MoreHorizontal, XCircle, History, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

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
  concluidos?: number;
  recusados?: number;
  gorjetas?: number;
  activeCheckin?: boolean;
  pedidosLocal?: number;
}

export function MobileBottomNav({ 
  pendentes, 
  aceitos, 
  aguardandoPix,
  concluidos = 0,
  recusados = 0,
  gorjetas = 0,
  activeCheckin = false,
  pedidosLocal = 0,
}: MobileBottomNavProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentTab = searchParams.get("tab") || "pendentes";

  // 4 fixed main items
  const mainNavItems: NavItem[] = [
    { value: "pendentes", icon: Clock, label: "Pendentes", badge: pendentes },
    { value: "aceitos", icon: CheckCircle, label: "Aceitos", badge: aceitos },
    { value: "gorjetas", icon: DollarSign, label: "Gorjetas", badge: gorjetas > 0 ? gorjetas : undefined },
    { value: "repertorio", icon: Music, label: "Repertório" },
  ];

  // Extra items in the "More" drawer
  const moreItems: NavItem[] = [
    { value: "concluidos", icon: CheckCircle, label: "Concluídos", badge: concluidos > 0 ? concluidos : undefined },
    { value: "recusados", icon: XCircle, label: "Recusados", badge: recusados > 0 ? recusados : undefined },
    { value: "historico", icon: History, label: "Histórico" },
    { value: "setlists", icon: List, label: "Setlists" },
  ];

  if (aguardandoPix > 0) {
    moreItems.unshift({ value: "aguardando_pix", icon: DollarSign, label: "PIX", badge: aguardandoPix });
  }

  if (activeCheckin) {
    moreItems.push({ value: "pedidos_local", icon: MapPin, label: "Local", badge: pedidosLocal > 0 ? pedidosLocal : undefined });
  }

  const moreItemValues = moreItems.map(i => i.value);
  const isMoreActive = moreItemValues.includes(currentTab);

  const handleNavClick = (value: string) => {
    setSearchParams({ tab: value });
    setDrawerOpen(false);
  };

  const renderNavButton = (item: NavItem, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.value}
        onClick={() => handleNavClick(item.value)}
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full py-1 px-0.5 relative transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <div className="relative">
          <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-0.5">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </div>
        <span className={cn(
          "text-[9px] mt-0.5 truncate max-w-full",
          isActive && "font-medium"
        )}>
          {item.label}
        </span>
        {isActive && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
        )}
      </button>
    );
  };

  // Count total badges in more items
  const moreBadgeTotal = moreItems.reduce((sum, i) => sum + (i.badge || 0), 0);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden">
        <div className="flex items-center justify-around h-14 px-1">
          {mainNavItems.map((item) => renderNavButton(item, currentTab === item.value))}
          
          {/* "Mais" button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 px-0.5 relative transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <MoreHorizontal className={cn("w-5 h-5", isMoreActive && "scale-110")} />
              {moreBadgeTotal > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-0.5">
                  {moreBadgeTotal > 99 ? "99+" : moreBadgeTotal}
                </span>
              )}
            </div>
            <span className={cn(
              "text-[9px] mt-0.5 truncate max-w-full",
              isMoreActive && "font-medium"
            )}>
              Mais
            </span>
            {isMoreActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Mais opções</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => handleNavClick(item.value)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-1.5">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
