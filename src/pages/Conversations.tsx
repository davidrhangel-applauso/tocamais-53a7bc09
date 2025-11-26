import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationBell from "@/components/NotificationBell";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Conversation {
  userId: string;
  userName: string;
  userPhoto: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned?: boolean;
  isImportant?: boolean;
  pedidoId?: string;
  isPedido?: boolean;
}

export default function Conversations() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "important">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pinnedConversations, setPinnedConversations] = useState<Set<string>>(new Set());
  const [importantConversations, setImportantConversations] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser, pinnedConversations, importantConversations]);

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
      .select("*")
      .or(`remetente_id.eq.${currentUser},destinatario_id.eq.${currentUser}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar conversas:", error);
      setLoading(false);
      return;
    }

    // Buscar pedidos com mensagens do artista
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("*")
      .eq("artista_id", currentUser)
      .not("mensagem", "is", null)
      .order("created_at", { ascending: false });

    // Agrupar mensagens por conversa
    const conversationsMap = new Map<string, Conversation>();

    // Adicionar conversas de mensagens
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
          isPinned: pinnedConversations.has(otherUserId),
          isImportant: importantConversations.has(otherUserId),
        });
      }
    }

    // Adicionar pedidos com mensagens
    for (const pedido of pedidos || []) {
      if (pedido.cliente_id && !conversationsMap.has(pedido.cliente_id)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome, foto_url")
          .eq("id", pedido.cliente_id)
          .single();
        
        conversationsMap.set(pedido.cliente_id, {
          userId: pedido.cliente_id,
          userName: profile?.nome || pedido.cliente_nome || "Cliente",
          userPhoto: profile?.foto_url || null,
          lastMessage: `🎵 Pedido: ${pedido.musica} - ${pedido.mensagem}`,
          lastMessageTime: pedido.created_at,
          unreadCount: 0,
          isPedido: true,
          pedidoId: pedido.id,
          isPinned: pinnedConversations.has(pedido.cliente_id),
          isImportant: importantConversations.has(pedido.cliente_id),
        });
      }
    }

    setConversations(Array.from(conversationsMap.values()));
    setLoading(false);
  };

  const togglePin = (userId: string) => {
    setPinnedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleImportant = (userId: string) => {
    setImportantConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const filteredConversations = conversations
    .filter(conv => {
      // Filtro de busca
      if (searchTerm && !conv.userName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro de tipo
      if (filter === "unread" && conv.unreadCount === 0) {
        return false;
      }
      if (filter === "important" && !importantConversations.has(conv.userId)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Conversas fixadas sempre no topo
      const aPinned = pinnedConversations.has(a.userId);
      const bPinned = pinnedConversations.has(b.userId);
      
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // Depois ordenar por data
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

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
            <Button variant="ghost" size="icon" onClick={() => navigate("/painel")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Mensagens</h1>
          </div>
          <NotificationBell userId={currentUser || undefined} />
        </div>

        <div className="mb-4 space-y-4">
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="unread">Não Lidas</TabsTrigger>
              <TabsTrigger value="important">Importantes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredConversations.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhuma conversa encontrada" : "Você ainda não tem conversas"}
            </p>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-260px)]">
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <Card
                  key={conv.userId}
                  className="p-4 hover:bg-muted/50 transition-colors relative"
                >
                  <div className="flex items-center gap-4">
                    <Avatar 
                      className="w-12 h-12 cursor-pointer" 
                      onClick={() => navigate(`/mensagens?destinatario=${conv.userId}`)}
                    >
                      <AvatarImage src={conv.userPhoto || ""} />
                      <AvatarFallback>{conv.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer" 
                      onClick={() => navigate(`/mensagens?destinatario=${conv.userId}`)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {pinnedConversations.has(conv.userId) && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                        <h3 className="font-semibold truncate flex-1">{conv.userName}</h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.lastMessageTime).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(conv.userId);
                        }}
                      >
                        <Pin className={`h-4 w-4 ${pinnedConversations.has(conv.userId) ? "fill-current text-primary" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleImportant(conv.userId);
                        }}
                      >
                        <Star className={`h-4 w-4 ${importantConversations.has(conv.userId) ? "fill-current text-yellow-500" : ""}`} />
                      </Button>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
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
