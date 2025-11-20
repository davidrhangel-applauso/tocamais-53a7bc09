import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";

interface Message {
  id: string;
  conteudo: string;
  created_at: string;
  remetente_id: string;
  destinatario_id: string;
  lida: boolean;
}

interface Profile {
  id: string;
  nome: string;
  foto_url: string | null;
}

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destinatarioId = searchParams.get("destinatario");
  
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [destinatario, setDestinatario] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser && destinatarioId) {
      loadMessages();
      loadDestinatario();
      subscribeToMessages();
    }
  }, [currentUser, destinatarioId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUser(user.id);
  };

  const loadDestinatario = async () => {
    if (!destinatarioId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, foto_url")
      .eq("id", destinatarioId)
      .single();

    if (error) {
      toast.error("Erro ao carregar perfil");
      return;
    }

    setDestinatario(data);
  };

  const loadMessages = async () => {
    if (!currentUser || !destinatarioId) return;

    const { data, error } = await supabase
      .from("mensagens")
      .select("*")
      .or(`and(remetente_id.eq.${currentUser},destinatario_id.eq.${destinatarioId}),and(remetente_id.eq.${destinatarioId},destinatario_id.eq.${currentUser})`)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar mensagens");
      return;
    }

    setMessages(data || []);
    setLoading(false);

    // Marcar mensagens recebidas como lidas
    const unreadMessages = data?.filter(
      (msg) => msg.destinatario_id === currentUser && !msg.lida
    );

    if (unreadMessages && unreadMessages.length > 0) {
      await supabase
        .from("mensagens")
        .update({ lida: true })
        .in("id", unreadMessages.map((msg) => msg.id));
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("mensagens-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mensagens",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            if (
              (newMsg.remetente_id === currentUser && newMsg.destinatario_id === destinatarioId) ||
              (newMsg.remetente_id === destinatarioId && newMsg.destinatario_id === currentUser)
            ) {
              setMessages((prev) => [...prev, newMsg]);
              
              // Marcar como lida se for recebida
              if (newMsg.destinatario_id === currentUser) {
                supabase
                  .from("mensagens")
                  .update({ lida: true })
                  .eq("id", newMsg.id)
                  .then();
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !destinatarioId) return;

    const { error } = await supabase.from("mensagens").insert({
      remetente_id: currentUser,
      destinatario_id: destinatarioId,
      conteudo: newMessage.trim(),
    });

    if (error) {
      toast.error("Erro ao enviar mensagem");
      return;
    }

    setNewMessage("");
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
      <div className="container max-w-4xl mx-auto p-4 flex flex-col h-screen">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {destinatario && (
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={destinatario.foto_url || ""} />
                  <AvatarFallback>{destinatario.nome[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{destinatario.nome}</h1>
                </div>
              </div>
            )}
          </div>
          <NotificationBell userId={currentUser || undefined} />
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => {
                const isMine = msg.remetente_id === currentUser;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isMine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.conteudo}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <form onSubmit={sendMessage} className="border-t p-4 flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
