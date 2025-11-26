import { Home, Music, Heart, BarChart3, Settings, MessageCircle, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";
import { useEffect, useState } from "react";

interface AppSidebarProps {
  artistName: string;
  artistPhoto?: string;
  ativoAoVivo: boolean;
}

const menuItems = [
  { title: "Dashboard", url: "/painel?tab=analytics", icon: Home },
  { title: "Pedidos Pendentes", url: "/painel?tab=pendentes", icon: Music },
  { title: "Pedidos Aceitos", url: "/painel?tab=aceitos", icon: Music },
  { title: "Gorjetas", url: "/painel?tab=gorjetas", icon: Heart },
  { title: "Analytics", url: "/painel?tab=analytics", icon: BarChart3 },
];

const secondaryItems = [
  { title: "Mensagens", url: "/mensagens", icon: MessageCircle },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar({ artistName, artistPhoto, ativoAoVivo }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/auth");
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={artistPhoto} />
            <AvatarFallback>{artistName[0]}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{artistName}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${ativoAoVivo ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
                <p className="text-xs text-muted-foreground">
                  {ativoAoVivo ? "Ao Vivo" : "Offline"}
                </p>
              </div>
            </div>
          )}
          <NotificationBell userId={userId} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Outros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
