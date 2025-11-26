import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";

interface Conversation {
  userId: string;
  userName: string;
  userPhoto: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function Conversations() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUser(user.id);
  };

  const loadConversations = async () => {
    if (!currentUser) return;

    // Buscar todas as mensagens do usuário
    const { data: messages, error } = await supabase
      .from("mensagens")
      .select("*, profiles!mensagens_remetente_id_fkey(nome, foto_url)")
      .or(`remetente_id.eq.${currentUser},destinatario_id.eq.${currentUser}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar conversas:", error);
      setLoading(false);
      return;
    }

    // Agrupar mensagens por conversa
    const conversationsMap = new Map<string, Conversation>();

    for (const msg of messages || []) {
      const otherUserId = msg.remetente_id === currentUser ? msg.destinatario_id : msg.remetente_id;
      
      if (!conversationsMap.has(otherUserId)) {
        // Buscar perfil do outro usuário
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome, foto_url")
          .eq("id", otherUserId)
          .single();

        // Contar mensagens não lidas
        const { count } = await supabase
          .from("mensagens")
          .select("*", { count: "exact", head: true })
          .eq("remetente_id", otherUserId)
          .eq("destinatario_id", currentUser)
          .eq("lida", false);

        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          userName: profile?.nome || "Usuário",
          userPhoto: profile?.foto_url || null,
          lastMessage: msg.conteudo,
          lastMessageTime: msg.created_at,
          unreadCount: count || 0,
        });
      }
    }

    setConversations(Array.from(conversationsMap.values()));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Mensagens</h1>
          </div>
          <NotificationBell userId={currentUser || undefined} />
        </div>

        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Você ainda não tem conversas</p>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Card
                  key={conv.userId}
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/mensagens?destinatario=${conv.userId}`)}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.userPhoto || ""} />
                      <AvatarFallback>{conv.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{conv.userName}</h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.lastMessageTime).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
