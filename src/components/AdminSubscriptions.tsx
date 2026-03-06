import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Eye, Clock, Receipt, RefreshCw } from "lucide-react";

interface SubscriptionReceipt {
  id: string;
  subscription_id: string;
  artista_id: string;
  receipt_url: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  artist: {
    nome: string;
    foto_url: string | null;
    cidade: string | null;
  } | null;
}


export function AdminSubscriptions() {
  const [receipts, setReceipts] = useState<SubscriptionReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<SubscriptionReceipt | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  useEffect(() => {
    fetchReceipts();
    fetchSettings();
  }, [filter]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('subscription_receipts')
        .select(`
          *,
          artist:profiles!subscription_receipts_artista_id_fkey(nome, foto_url, cidade)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast.error('Erro ao carregar comprovantes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data?.forEach(s => {
        settingsMap[s.setting_key] = s.setting_value;
      });

      setSettings({
        subscription_pix_key: settingsMap['subscription_pix_key'] || '',
        subscription_pix_key_type: settingsMap['subscription_pix_key_type'] || 'cpf',
        subscription_pix_name: settingsMap['subscription_pix_name'] || 'TocaMais',
        subscription_pix_city: settingsMap['subscription_pix_city'] || 'São Paulo',
        subscription_price: settingsMap['subscription_price'] || '19.90',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('admin_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSavingSettings(false);
    }
  };

  const approveReceipt = async (receipt: SubscriptionReceipt) => {
    setProcessing(receipt.id);
    try {
      // Update receipt status
      const { error: receiptError } = await supabase
        .from('subscription_receipts')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', receipt.id);

      if (receiptError) throw receiptError;

      // Fetch plano_tipo from subscription to determine duration
      const { data: subData } = await supabase
        .from('artist_subscriptions')
        .select('*')
        .eq('id', receipt.subscription_id)
        .single();

      const planoTipo = (subData as any)?.plano_tipo || 'mensal';
      const daysMap: Record<string, number> = { mensal: 30, anual: 365, bienal: 730 };
      const days = daysMap[planoTipo] || 30;

      // Calculate subscription dates
      const startsAt = new Date();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + days);

      // Update subscription
      const { error: subError } = await supabase
        .from('artist_subscriptions')
        .update({
          status: 'active',
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
        })
        .eq('id', receipt.subscription_id);

      if (subError) throw subError;

      // Update artist profile to PRO
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plano: 'pro' })
        .eq('id', receipt.artista_id);

      if (profileError) throw profileError;

      // Create notification for artist
      const planLabel = planoTipo === 'anual' ? 'Anual' : planoTipo === 'bienal' ? 'Bienal' : 'Mensal';
      await supabase.rpc('criar_notificacao', {
        p_usuario_id: receipt.artista_id,
        p_tipo: 'assinatura_aprovada',
        p_titulo: 'Plano Pro Ativado! 🎉',
        p_mensagem: `Seu pagamento do plano ${planLabel} foi aprovado e já está ativo por ${days} dias. Aproveite!`,
        p_link: '/painel',
      });

      toast.success(`Assinatura ${planLabel} (${days} dias) aprovada!`);
      fetchReceipts();
    } catch (error) {
      console.error('Error approving receipt:', error);
      toast.error('Erro ao aprovar assinatura');
    } finally {
      setProcessing(null);
    }
  };

  const rejectReceipt = async () => {
    if (!selectedReceipt) return;
    
    setProcessing(selectedReceipt.id);
    try {
      // Update receipt status
      const { error: receiptError } = await supabase
        .from('subscription_receipts')
        .update({ 
          status: 'rejected',
          admin_notes: rejectNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedReceipt.id);

      if (receiptError) throw receiptError;

      // Update subscription status
      const { error: subError } = await supabase
        .from('artist_subscriptions')
        .update({ status: 'rejected' })
        .eq('id', selectedReceipt.subscription_id);

      if (subError) throw subError;

      // Create notification for artist
      await supabase.rpc('criar_notificacao', {
        p_usuario_id: selectedReceipt.artista_id,
        p_tipo: 'assinatura_rejeitada',
        p_titulo: 'Pagamento não aprovado',
        p_mensagem: rejectNotes || 'Seu comprovante de pagamento não foi aprovado. Por favor, tente novamente.',
        p_link: '/painel',
      });

      toast.success('Comprovante rejeitado');
      setShowRejectDialog(false);
      setRejectNotes('');
      setSelectedReceipt(null);
      fetchReceipts();
    } catch (error) {
      console.error('Error rejecting receipt:', error);
      toast.error('Erro ao rejeitar comprovante');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = receipts.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Comprovantes de Pagamento
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Gerencie os comprovantes de assinatura Pro</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchReceipts}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum comprovante encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <div 
                  key={receipt.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={receipt.artist?.foto_url || undefined} />
                      <AvatarFallback>
                        {receipt.artist?.nome?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{receipt.artist?.nome || 'Artista'}</p>
                      <p className="text-sm text-muted-foreground">
                        {receipt.artist?.cidade || 'Sem cidade'} • {' '}
                        {format(new Date(receipt.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(receipt.status)}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setShowImageDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    
                    {receipt.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => approveReceipt(receipt)}
                          disabled={processing === receipt.id}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedReceipt(receipt);
                            setShowRejectDialog(true);
                          }}
                          disabled={processing === receipt.id}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              {selectedReceipt?.artist?.nome} - {' '}
              {selectedReceipt && format(new Date(selectedReceipt.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="flex justify-center">
              <img 
                src={selectedReceipt.receipt_url} 
                alt="Comprovante" 
                className="max-h-[60vh] rounded-lg border"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Comprovante</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição (opcional). O artista será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Ex: Comprovante ilegível, valor incorreto, etc."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={rejectReceipt}
                disabled={processing === selectedReceipt?.id}
              >
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}